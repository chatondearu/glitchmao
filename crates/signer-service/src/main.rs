use std::{
    env, fs,
    io::Write,
    net::SocketAddr,
    path::PathBuf,
    process::{Command, Stdio},
    time::{SystemTime, UNIX_EPOCH},
};

use axum::{extract::State, routing::get, routing::post, Json, Router};
use crypto_core::signer::sign_text_detached_ascii;
use serde::{Deserialize, Serialize};

#[derive(Clone)]
struct AppState {
    default_key_id: String,
    default_key_domain: String,
}

#[derive(Debug, Deserialize)]
struct SignRequest {
    content_hash: String,
    key_id: Option<String>,
}

#[derive(Debug, Serialize)]
struct SignResponse {
    signature: String,
    key_id_used: String,
}

#[derive(Debug, Deserialize)]
struct VerifyRequest {
    signature: String,
    content_hash: String,
}

#[derive(Debug, Serialize)]
struct VerifyResponse {
    valid: bool,
}

#[derive(Debug, Deserialize)]
struct GenerateKeyRequest {
    name: String,
    handle: String,
}

#[derive(Debug, Serialize)]
struct GenerateKeyResponse {
    fingerprint: String,
    key_id: String,
    algorithm: String,
}

#[derive(Debug, Serialize)]
struct HealthResponse {
    status: &'static str,
}

#[tokio::main]
async fn main() {
    let host = env::var("SIGNER_HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
    let port = env::var("SIGNER_PORT")
        .ok()
        .and_then(|value| value.parse::<u16>().ok())
        .unwrap_or(4000);
    let default_key_id = env::var("SIGNER_DEFAULT_KEY_ID")
        .or_else(|_| env::var("GPG_KEY_ID"))
        .unwrap_or_else(|_| "".to_string());
    let default_key_domain =
        env::var("SIGNER_DEFAULT_KEY_DOMAIN").unwrap_or_else(|_| "glitchmao.local".to_string());

    let state = AppState {
        default_key_id,
        default_key_domain,
    };
    let app = Router::new()
        .route("/health", get(health))
        .route("/sign", post(sign_hash))
        .route("/verify", post(verify_signature))
        .route("/keys/generate", post(generate_key))
        .with_state(state);

    let addr: SocketAddr = format!("{host}:{port}")
        .parse()
        .expect("invalid signer address");
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("failed to bind signer listener");

    axum::serve(listener, app)
        .await
        .expect("signer service crashed");
}

async fn health() -> Json<HealthResponse> {
    Json(HealthResponse { status: "ok" })
}

async fn sign_hash(
    State(state): State<AppState>,
    Json(payload): Json<SignRequest>,
) -> Result<Json<SignResponse>, (axum::http::StatusCode, String)> {
    if payload.content_hash.trim().is_empty() {
        return Err((
            axum::http::StatusCode::BAD_REQUEST,
            "content_hash is required".to_string(),
        ));
    }

    let key_id = payload
        .key_id
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| state.default_key_id.clone());

    if key_id.trim().is_empty() {
        return Err((
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            "No key id configured for signer".to_string(),
        ));
    }

    let signature = sign_text_detached_ascii(&payload.content_hash, &key_id).map_err(|error| {
        (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            error.to_string(),
        )
    })?;

    Ok(Json(SignResponse {
        signature: signature.trim().to_string(),
        key_id_used: key_id,
    }))
}

async fn verify_signature(
    Json(payload): Json<VerifyRequest>,
) -> Result<Json<VerifyResponse>, (axum::http::StatusCode, String)> {
    if payload.signature.trim().is_empty() || payload.content_hash.trim().is_empty() {
        return Err((
            axum::http::StatusCode::BAD_REQUEST,
            "signature and content_hash are required".to_string(),
        ));
    }

    let valid = run_gpg_verify_inline(&payload.signature, &payload.content_hash)
        .map_err(|error| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, error))?;

    Ok(Json(VerifyResponse { valid }))
}

async fn generate_key(
    State(state): State<AppState>,
    Json(payload): Json<GenerateKeyRequest>,
) -> Result<Json<GenerateKeyResponse>, (axum::http::StatusCode, String)> {
    if payload.name.trim().is_empty() || payload.handle.trim().is_empty() {
        return Err((
            axum::http::StatusCode::BAD_REQUEST,
            "name and handle are required".to_string(),
        ));
    }

    let email = format!("{}@{}", payload.handle.trim(), state.default_key_domain);
    run_gpg_generate(&payload.name, &email)
        .map_err(|error| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, error))?;
    let (fingerprint, algorithm) = read_secret_fingerprint(&email)
        .map_err(|error| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, error))?;
    let key_id = fingerprint
        .chars()
        .rev()
        .take(16)
        .collect::<String>()
        .chars()
        .rev()
        .collect::<String>();

    Ok(Json(GenerateKeyResponse {
        fingerprint,
        key_id,
        algorithm,
    }))
}

fn run_gpg_generate(name: &str, email: &str) -> Result<(), String> {
    let batch = format!(
        "%no-protection\nKey-Type: RSA\nKey-Length: 3072\nName-Real: {}\nName-Email: {}\nExpire-Date: 0\n%commit\n",
        name, email
    );

    let mut child = Command::new("gpg")
        .arg("--batch")
        .arg("--generate-key")
        .stdin(Stdio::piped())
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| format!("failed to spawn gpg generate: {error}"))?;

    if let Some(stdin) = child.stdin.as_mut() {
        stdin
            .write_all(batch.as_bytes())
            .map_err(|error| format!("failed to write gpg batch input: {error}"))?;
    }

    let output = child
        .wait_with_output()
        .map_err(|error| format!("failed to wait for gpg generate: {error}"))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(())
}

fn read_secret_fingerprint(email: &str) -> Result<(String, String), String> {
    let output = Command::new("gpg")
        .arg("--list-secret-keys")
        .arg("--with-colons")
        .arg(email)
        .output()
        .map_err(|error| format!("failed to list secret keys: {error}"))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let fingerprint = stdout
        .lines()
        .find(|line| line.starts_with("fpr:"))
        .and_then(|line| line.split(':').nth(9))
        .ok_or_else(|| "missing fingerprint in gpg output".to_string())?
        .to_string();
    let algorithm = stdout
        .lines()
        .find(|line| line.starts_with("sec:"))
        .and_then(|line| line.split(':').nth(3))
        .unwrap_or("unknown")
        .to_string();

    Ok((fingerprint, algorithm))
}

fn run_gpg_verify_inline(signature: &str, content_hash: &str) -> Result<bool, String> {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| format!("failed to compute nonce: {error}"))?
        .as_nanos();
    let temp_dir = env::temp_dir();
    let sig_path: PathBuf = temp_dir.join(format!("glitchmao-signature-{nonce}.asc"));
    let hash_path: PathBuf = temp_dir.join(format!("glitchmao-hash-{nonce}.txt"));

    fs::write(&sig_path, signature)
        .map_err(|error| format!("failed to write temp signature: {error}"))?;
    fs::write(&hash_path, content_hash)
        .map_err(|error| format!("failed to write temp hash: {error}"))?;

    let output = Command::new("gpg")
        .arg("--verify")
        .arg(&sig_path)
        .arg(&hash_path)
        .output()
        .map_err(|error| format!("failed to spawn gpg verify: {error}"))?;

    let _ = fs::remove_file(&sig_path);
    let _ = fs::remove_file(&hash_path);

    Ok(output.status.success())
}

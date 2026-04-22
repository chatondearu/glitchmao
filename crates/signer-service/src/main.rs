use std::{
    collections::HashMap,
    env, fs,
    io::Write,
    net::SocketAddr,
    path::PathBuf,
    process::{Command, Stdio},
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc, Mutex,
    },
    time::{SystemTime, UNIX_EPOCH},
};

use axum::{
    extract::State,
    http::{header::AUTHORIZATION, HeaderMap},
    routing::{get, post},
    Json, Router,
};
use crypto_core::signer::sign_text_detached_ascii;
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::{Deserialize, Serialize};

static REQUEST_COUNTER: AtomicU64 = AtomicU64::new(1);

#[derive(Clone)]
struct AppState {
    security_mode: SecurityMode,
    jwt_secret: Option<String>,
    default_key_id: String,
    default_key_domain: String,
    jti_seen: Arc<Mutex<HashMap<String, u64>>>,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
enum SecurityMode {
    Secure,
    InsecureLocal,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
struct SignerClaims {
    sub: String,
    profile_id: Option<String>,
    allowed_fingerprint: Option<String>,
    scope: Vec<String>,
    iat: u64,
    exp: u64,
    jti: String,
}

#[derive(Debug, Clone)]
struct AuthContext {
    subject: String,
    profile_id: Option<String>,
    allowed_fingerprint: Option<String>,
    jti: String,
}

#[derive(Debug, Deserialize)]
struct SignRequest {
    content_hash: String,
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
    let security_mode = parse_security_mode();
    let insecure_bind =
        env::var("SIGNER_INSECURE_BIND").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = env::var("SIGNER_PORT")
        .ok()
        .and_then(|value| value.parse::<u16>().ok())
        .unwrap_or(4000);
    let jwt_secret = env::var("SIGNER_JWT_SECRET").ok();
    let default_key_id = env::var("SIGNER_DEFAULT_KEY_ID")
        .or_else(|_| env::var("GPG_KEY_ID"))
        .unwrap_or_else(|_| "".to_string());
    let default_key_domain =
        env::var("SIGNER_DEFAULT_KEY_DOMAIN").unwrap_or_else(|_| "glitchmao.local".to_string());

    validate_bootstrap(security_mode, &host, &insecure_bind, &jwt_secret);

    let state = AppState {
        security_mode,
        jwt_secret,
        default_key_id,
        default_key_domain,
        jti_seen: Arc::new(Mutex::new(HashMap::new())),
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
    headers: HeaderMap,
    Json(payload): Json<SignRequest>,
) -> Result<Json<SignResponse>, (axum::http::StatusCode, String)> {
    let request_id = REQUEST_COUNTER.fetch_add(1, Ordering::Relaxed);
    if payload.content_hash.trim().is_empty() {
        return Err((
            axum::http::StatusCode::BAD_REQUEST,
            "content_hash is required".to_string(),
        ));
    }

    let auth = authorize_request(&state, &headers, "sign")?;
    let key_id = match state.security_mode {
        SecurityMode::Secure => auth
            .allowed_fingerprint
            .clone()
            .filter(|value| !value.trim().is_empty())
            .ok_or((
                axum::http::StatusCode::FORBIDDEN,
                "Token is missing allowed_fingerprint claim".to_string(),
            ))?,
        SecurityMode::InsecureLocal => state.default_key_id.clone(),
    };

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

    eprintln!(
        "request_id={request_id} scope=sign sub={} profile_id={} key_id_used={} jti={}",
        auth.subject,
        auth.profile_id.as_deref().unwrap_or("-"),
        key_id,
        auth.jti,
    );

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
    headers: HeaderMap,
    Json(payload): Json<GenerateKeyRequest>,
) -> Result<Json<GenerateKeyResponse>, (axum::http::StatusCode, String)> {
    let request_id = REQUEST_COUNTER.fetch_add(1, Ordering::Relaxed);
    let auth = authorize_request(&state, &headers, "keys.generate")?;
    if payload.name.trim().is_empty() || payload.handle.trim().is_empty() {
        return Err((
            axum::http::StatusCode::BAD_REQUEST,
            "name and handle are required".to_string(),
        ));
    }
    if state.security_mode == SecurityMode::InsecureLocal {
        return Err((
            axum::http::StatusCode::FORBIDDEN,
            "keys.generate is disabled in insecure_local mode".to_string(),
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
    .inspect(|response| {
        eprintln!(
            "request_id={request_id} scope=keys.generate sub={} profile_id={} generated_fingerprint={} jti={}",
            auth.subject,
            auth.profile_id.as_deref().unwrap_or("-"),
            response.fingerprint,
            auth.jti,
        );
    })
}

fn parse_security_mode() -> SecurityMode {
    let mode = env::var("SIGNER_SECURITY_MODE").unwrap_or_else(|_| "secure".to_string());
    match mode.as_str() {
        "secure" => SecurityMode::Secure,
        "insecure_local" => SecurityMode::InsecureLocal,
        other => panic!("Unknown SIGNER_SECURITY_MODE: {other}"),
    }
}

fn validate_bootstrap(
    security_mode: SecurityMode,
    host: &str,
    insecure_bind: &str,
    jwt_secret: &Option<String>,
) {
    match security_mode {
        SecurityMode::Secure => {
            if jwt_secret.as_deref().unwrap_or("").trim().is_empty() {
                panic!("SIGNER_JWT_SECRET is required in secure mode");
            }
        }
        SecurityMode::InsecureLocal => {
            if !is_local_host(host) {
                panic!("insecure_local mode requires SIGNER_HOST to be localhost/127.0.0.1/::1");
            }
            if host != insecure_bind {
                panic!("insecure_local mode requires SIGNER_HOST to equal SIGNER_INSECURE_BIND");
            }
            if !is_local_host(insecure_bind) {
                panic!("SIGNER_INSECURE_BIND must be local in insecure_local mode");
            }
            eprintln!(
                "WARNING: signer-service started in insecure_local mode; API auth is disabled"
            );
        }
    }
}

fn is_local_host(host: &str) -> bool {
    matches!(host, "127.0.0.1" | "localhost" | "::1")
}

fn authorize_request(
    state: &AppState,
    headers: &HeaderMap,
    required_scope: &str,
) -> Result<AuthContext, (axum::http::StatusCode, String)> {
    match state.security_mode {
        SecurityMode::InsecureLocal => {
            return Ok(AuthContext {
                subject: "local-cli".to_string(),
                profile_id: None,
                allowed_fingerprint: Some(state.default_key_id.clone()),
                jti: "insecure-local".to_string(),
            });
        }
        SecurityMode::Secure => {}
    }

    let token = extract_bearer(headers)?;
    let secret = state.jwt_secret.as_deref().ok_or((
        axum::http::StatusCode::INTERNAL_SERVER_ERROR,
        "Signer JWT secret is not configured".to_string(),
    ))?;

    let mut validation = Validation::new(jsonwebtoken::Algorithm::HS256);
    validation.validate_exp = true;
    let decoded = decode::<SignerClaims>(
        &token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation,
    )
    .map_err(|_| {
        (
            axum::http::StatusCode::UNAUTHORIZED,
            "Invalid signer bearer token".to_string(),
        )
    })?;

    if !decoded
        .claims
        .scope
        .iter()
        .any(|scope| scope == required_scope)
    {
        return Err((
            axum::http::StatusCode::FORBIDDEN,
            "Token scope is insufficient".to_string(),
        ));
    }

    if decoded.claims.jti.trim().is_empty() {
        return Err((
            axum::http::StatusCode::UNAUTHORIZED,
            "Token jti is required".to_string(),
        ));
    }

    register_jti(state, &decoded.claims.jti, decoded.claims.exp)?;

    Ok(AuthContext {
        subject: decoded.claims.sub,
        profile_id: decoded.claims.profile_id,
        allowed_fingerprint: decoded.claims.allowed_fingerprint,
        jti: decoded.claims.jti,
    })
}

fn extract_bearer(headers: &HeaderMap) -> Result<String, (axum::http::StatusCode, String)> {
    let value = headers
        .get(AUTHORIZATION)
        .and_then(|raw| raw.to_str().ok())
        .ok_or((
            axum::http::StatusCode::UNAUTHORIZED,
            "Missing Authorization header".to_string(),
        ))?;
    let Some(token) = value.strip_prefix("Bearer ") else {
        return Err((
            axum::http::StatusCode::UNAUTHORIZED,
            "Authorization header must be a Bearer token".to_string(),
        ));
    };
    if token.trim().is_empty() {
        return Err((
            axum::http::StatusCode::UNAUTHORIZED,
            "Bearer token is empty".to_string(),
        ));
    }
    Ok(token.trim().to_string())
}

fn register_jti(
    state: &AppState,
    jti: &str,
    exp: u64,
) -> Result<(), (axum::http::StatusCode, String)> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|_| {
            (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to read system time".to_string(),
            )
        })?
        .as_secs();

    let mut cache = state.jti_seen.lock().map_err(|_| {
        (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            "Signer jti cache is poisoned".to_string(),
        )
    })?;
    cache.retain(|_, stored_exp| *stored_exp > now);
    if cache.contains_key(jti) {
        return Err((
            axum::http::StatusCode::UNAUTHORIZED,
            "Replay detected for signer token".to_string(),
        ));
    }
    cache.insert(jti.to_string(), exp);
    Ok(())
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

#[cfg(test)]
mod tests {
    use super::{is_local_host, SecurityMode};

    #[test]
    fn local_hosts_are_detected() {
        assert!(is_local_host("127.0.0.1"));
        assert!(is_local_host("localhost"));
        assert!(is_local_host("::1"));
        assert!(!is_local_host("0.0.0.0"));
        assert!(!is_local_host("10.0.0.2"));
    }

    #[test]
    fn security_mode_enum_is_comparable() {
        assert_eq!(SecurityMode::Secure, SecurityMode::Secure);
        assert_ne!(SecurityMode::Secure, SecurityMode::InsecureLocal);
    }
}

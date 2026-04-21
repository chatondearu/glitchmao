use std::{env, net::SocketAddr};

use axum::{extract::State, routing::get, routing::post, Json, Router};
use crypto_core::signer::sign_text_detached_ascii;
use serde::{Deserialize, Serialize};

#[derive(Clone)]
struct AppState {
    default_key_id: String,
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

    let state = AppState { default_key_id };
    let app = Router::new()
        .route("/health", get(health))
        .route("/sign", post(sign_hash))
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
        return Err((axum::http::StatusCode::BAD_REQUEST, "content_hash is required".to_string()));
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

    let signature = sign_text_detached_ascii(&payload.content_hash, &key_id)
        .map_err(|error| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, error.to_string()))?;

    Ok(Json(SignResponse {
        signature: signature.trim().to_string(),
        key_id_used: key_id,
    }))
}

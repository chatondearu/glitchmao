use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlitchBundle {
    pub project: String,
    pub version: String,
    pub content_hash: String,
    pub signature: String,
    pub timestamp: DateTime<Utc>,
    pub verification_url: String,
}

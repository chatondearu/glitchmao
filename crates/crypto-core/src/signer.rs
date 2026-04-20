use std::io::Write;
use std::process::{Command, Stdio};

use thiserror::Error;

#[derive(Debug, Error)]
pub enum SignerError {
    #[error("failed to spawn gpg process: {0}")]
    Spawn(std::io::Error),
    #[error("failed to write input to gpg stdin: {0}")]
    Stdin(std::io::Error),
    #[error("gpg process failed with status {status}: {stderr}")]
    GpgFailed { status: i32, stderr: String },
    #[error("gpg output was not valid UTF-8: {0}")]
    Utf8(std::string::FromUtf8Error),
}

pub fn sign_text_detached_ascii(text: &str, key_id: &str) -> Result<String, SignerError> {
    let mut child = Command::new("gpg")
        .arg("--armor")
        .arg("--batch")
        .arg("--yes")
        .arg("--detach-sign")
        .arg("--local-user")
        .arg(key_id)
        .arg("--output")
        .arg("-")
        .arg("-")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(SignerError::Spawn)?;

    if let Some(stdin) = child.stdin.as_mut() {
        stdin.write_all(text.as_bytes()).map_err(SignerError::Stdin)?;
    }

    let output = child.wait_with_output().map_err(SignerError::Spawn)?;

    if !output.status.success() {
        let status = output.status.code().unwrap_or(-1);
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        return Err(SignerError::GpgFailed { status, stderr });
    }

    String::from_utf8(output.stdout).map_err(SignerError::Utf8)
}

use std::fs;

use anyhow::{Context, Result};
use chrono::Utc;
use clap::{Parser, Subcommand};
use crypto_core::bundle::GlitchBundle;
use crypto_core::hasher::{sha256_bytes, sha256_text};
use crypto_core::signer::sign_text_detached_ascii;

#[derive(Debug, Parser)]
#[command(name = "glitchmao")]
#[command(about = "GlitchMao CLI for hashing and signing content")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Debug, Subcommand)]
enum Commands {
    Hash {
        #[arg(long)]
        text: Option<String>,
        #[arg(long)]
        file: Option<String>,
    },
    SignText {
        #[arg(long)]
        text: String,
        #[arg(long)]
        key_id: String,
    },
    SignFile {
        #[arg(long)]
        file: String,
        #[arg(long)]
        key_id: String,
    },
    Bundle {
        #[arg(long)]
        text: Option<String>,
        #[arg(long)]
        file: Option<String>,
        #[arg(long)]
        key_id: String,
        #[arg(long)]
        verification_url: String,
    },
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Hash { text, file } => {
            let hash = compute_hash(text, file)?;
            println!("{hash}");
        }
        Commands::SignText { text, key_id } => {
            let signature = sign_text_detached_ascii(&text, &key_id)?;
            println!("{signature}");
        }
        Commands::SignFile { file, key_id } => {
            let content = fs::read_to_string(&file).with_context(|| format!("failed to read file {file}"))?;
            let signature = sign_text_detached_ascii(&content, &key_id)?;
            println!("{signature}");
        }
        Commands::Bundle {
            text,
            file,
            key_id,
            verification_url,
        } => {
            let payload = resolve_payload(text, file)?;
            let content_hash = sha256_text(&payload);
            let signature = sign_text_detached_ascii(&content_hash, &key_id)?;
            let bundle = GlitchBundle {
                project: "GlitchMao".to_string(),
                version: "1.0.0".to_string(),
                content_hash,
                signature,
                timestamp: Utc::now(),
                verification_url,
            };
            println!("{}", serde_json::to_string_pretty(&bundle)?);
        }
    }

    Ok(())
}

fn resolve_payload(text: Option<String>, file: Option<String>) -> Result<String> {
    match (text, file) {
        (Some(value), None) => Ok(value),
        (None, Some(path)) => fs::read_to_string(&path).with_context(|| format!("failed to read file {path}")),
        _ => anyhow::bail!("exactly one of --text or --file must be provided"),
    }
}

fn compute_hash(text: Option<String>, file: Option<String>) -> Result<String> {
    match (text, file) {
        (Some(value), None) => Ok(sha256_text(&value)),
        (None, Some(path)) => {
            let bytes = fs::read(&path).with_context(|| format!("failed to read file {path}"))?;
            Ok(sha256_bytes(&bytes))
        }
        _ => anyhow::bail!("exactly one of --text or --file must be provided"),
    }
}

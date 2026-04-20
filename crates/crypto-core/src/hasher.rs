use sha2::{Digest, Sha256};

pub fn sha256_bytes(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    format!("{:x}", hasher.finalize())
}

pub fn sha256_text(text: &str) -> String {
    sha256_bytes(text.as_bytes())
}

#[cfg(test)]
mod tests {
    use super::sha256_text;

    #[test]
    fn hashes_text_with_sha256() {
        assert_eq!(
            sha256_text("glitchmao"),
            "1f818c58d4fec38f84a09b014e95f350f365f2a65d1392fbca5f2ebde960e18b"
        );
    }
}

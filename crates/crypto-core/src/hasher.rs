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
            "58f78ad7000ca021140fbd1a3951415aa6c5ca78428057256fd6fd7eaad631e7"
        );
    }
}

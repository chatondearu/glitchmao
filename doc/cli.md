# CLI Reference

The CLI binary is exposed as `glitchmao` from crate `glitchmao-cli`.

## Run with Nix

From repository root:

```bash
nix develop -c cargo run -p glitchmao-cli -- --help
```

## Commands

## `hash`

Compute SHA-256 from text or file.

Options:

- `--text <value>` (mutually exclusive with `--file`)
- `--file <path>` (mutually exclusive with `--text`)

Examples:

```bash
nix develop -c cargo run -p glitchmao-cli -- hash --text "hello"
nix develop -c cargo run -p glitchmao-cli -- hash --file ./document.pdf
```

## `sign-text`

Create an ASCII-armored detached signature from raw text.

Options:

- `--text <value>` (required)
- `--key-id <key>` (required)

Example:

```bash
nix develop -c cargo run -p glitchmao-cli -- sign-text --text "hello" --key-id "$GPG_KEY_ID"
```

## `sign-file`

Sign text content loaded from a file path.

Options:

- `--file <path>` (required)
- `--key-id <key>` (required)

Example:

```bash
nix develop -c cargo run -p glitchmao-cli -- sign-file --file ./message.txt --key-id "$GPG_KEY_ID"
```

## `bundle`

Create a JSON bundle including hash, signature, timestamp, and verification URL.

Options:

- `--text <value>` or `--file <path>` (exactly one required)
- `--key-id <key>` (required)
- `--verification-url <url>` (required)

Example:

```bash
nix develop -c cargo run -p glitchmao-cli -- bundle \
  --text "hello" \
  --key-id "$GPG_KEY_ID" \
  --verification-url "http://localhost:3000/verify?id=<PUBLIC_ID>"
```

## Error behavior

- `hash` and `bundle` fail when both `--text` and `--file` are provided, or when neither is provided.
- `sign-file` and file-based commands fail if the target path does not exist or is unreadable.

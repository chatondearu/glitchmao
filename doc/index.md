---
layout: home

hero:
  name: "GlitchMao"
  text: "Portable trust for digital content"
  tagline: "Sign, verify, and audit content authenticity with a Nuxt web app, a Rust signer service, and PostgreSQL persistence."
  actions:
    - theme: brand
      text: Self-hosting Guide
      link: /self-hosting
    - theme: alt
      text: API Reference
      link: /api
    - theme: alt
      text: CLI Reference
      link: /cli

features:
  - title: Creator-first signing
    details: Generate signatures from text and files with a streamlined UX while keeping cryptographic operations server-side.
  - title: Independent verification
    details: Verify by public ID, by hash, or by file upload through web UI, API, or CLI workflows.
  - title: Audit-ready architecture
    details: Keep signature metadata, onboarding state, and key lifecycle history in PostgreSQL for traceability over time.
  - title: Self-host friendly
    details: Run the complete stack using Docker Compose with dedicated development, test, and production-like modes.
---

## Quick navigation

- [Self-hosting](./self-hosting.md): deployment topology, env vars, and Docker Compose modes.
- [API reference](./api.md): endpoints, payloads, and response examples.
- [CLI reference](./cli.md): `glitchmao` command usage and examples.

## Architecture at a glance

GlitchMao separates responsibilities between services:

- `web` (Nuxt): UI, API orchestration, and persistence
- `signer` (Rust): key generation, signing, and verification
- `postgres`: signatures, profiles, and key metadata

This model keeps private key material in the signer service while preserving an auditable application trail in the database.

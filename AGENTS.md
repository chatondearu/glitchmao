# AGENTS Guidelines

## Scope

- This file defines project-level rules for human contributors and coding agents.
- Follow these conventions unless a task explicitly requests otherwise.

## Technical Stack

- Crypto/hash/signing engine: Rust workspace under `crates/`.
- Web application and API routes: Nuxt 4 under `apps/web-nuxt`.
- UI primitives in Nuxt app: Reka UI (`reka-ui` + `reka-ui/nuxt` module).
- Styling in Nuxt app: UnoCSS (`@unocss/nuxt` + `uno.config.ts`).
- Database: PostgreSQL.
- Development environment entrypoint: `nix develop`.

## Workflow

- Run commands from within `nix develop` to ensure consistent tool versions.
- Keep changes scoped: avoid mixing refactors with feature work in one commit.
- Update `README.md` and `.env.example` when runtime behavior or env variables change.
- For UI work in `apps/web-nuxt`, prefer extending components in `app/components/ui` before duplicating markup in pages.

## Code Standards

- Prefer strict typing in TypeScript and explicit error handling.
- Keep API handlers small; place reusable logic under `server/utils/`.
- In Rust, use typed errors (`thiserror`) for library code and contextual errors (`anyhow`) for binaries.
- Write code comments in English and only when they add non-obvious context.
- For Vue/Nuxt components, use `<script setup lang="ts">` and typed props/emits.
- Use Reka UI primitives for accessibility-sensitive controls (labels, dialogs, menus, etc.).
- Use UnoCSS utility classes instead of scoped CSS whenever practical.

## Commit Policy

- Use Conventional Commits.
- Recommended format: `type(scope): short summary`.
- Common types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `build`, `ci`.
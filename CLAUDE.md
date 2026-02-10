# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
# Install dependencies
pnpm install

# Development (runs both frontend dev server and Tauri)
pnpm tauri dev

# Build for production
pnpm tauri build

# Type checking
pnpm check
```

## Architecture

This is a **Tauri v2 desktop application** with a SvelteKit frontend.

### Stack
- **Frontend**: SvelteKit 2 + Svelte 5 + TypeScript, using adapter-static for SPA mode
- **Backend**: Rust with Tauri v2
- **Package Manager**: pnpm

### Project Structure
- `src/` - SvelteKit frontend (routes, components)
- `src-tauri/` - Rust backend
  - `src/lib.rs` - Tauri commands and app initialization
  - `src/main.rs` - Entry point
  - `Cargo.toml` - Rust dependencies
  - `tauri.conf.json` - Tauri configuration

### Frontend-Backend Communication
Svelte components call Rust functions via `invoke()` from `@tauri-apps/api/core`. Rust commands are defined with the `#[tauri::command]` attribute and registered in `tauri::Builder::default().invoke_handler()`.

### SvelteKit Configuration
SSR is disabled (`export const ssr = false` in `+layout.ts`) since Tauri runs in a webview without a Node.js server.

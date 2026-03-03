# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run src/index.ts        # start bot
bun --watch src/index.ts    # dev with hot reload
bun run lint                # lint (eslint src/)
bun run format              # format (prettier --write src/)
```

No test suite — this project has no tests.

## Architecture

This is a single-user Telegram bot that wraps the Lunch Money API v2.
The bot is gated by `ALLOWED_USER_ID` via auth middleware, so all handlers assume a trusted user.

**Startup sequence** (`src/index.ts`): middleware chain → `conversations()` plugin → `registerMenu` (must precede `createConversation` so `/menu`/`/start`/`/help` can exit active conversations) → `createConversation(addTransaction)` → `registerMenuCallbacks`.

**Layer map:**

| Layer | Path | Role |
|---|---|---|
| HTTP client | `src/core/httpClient.ts` | Single `apiClient` for all Lunch Money requests (auth + logging) |
| API modules | `src/api/*.ts` | One file per resource; each validates response with zod |
| Core services | `src/core/` | `db.ts` (SQLite prefs), `cache.ts` (in-memory TTL), `logger.ts` |
| Bot handlers | `src/bot/handlers/` | Simple command/callback handlers (balance, list, menu) |
| Conversation | `src/bot/conversations/addTransaction/` | Multi-step add-transaction flow |
| Keyboards | `src/bot/keyboards*.ts` | Inline keyboard builders |
| Constants | `src/bot/constants/callbacks.ts` | All callback data strings as `const` objects |

**The `addTransaction` conversation** is the core feature. Its structure:

- `flowContext.ts` — shared types (`FlowContext`, `FlowData`, `TransactionDraft`, `Conv`)
- `index.ts` — orchestrates the outer amount loop and inner edit loop, dispatches to step handlers
- `steps/` — one file per field (amount, account, category, currency, date, payee, notes, save)
- `preview.ts` — renders and restores the transaction preview message
- `helpers/` — category frequency sorting, text input utilities

**Key constraint:** Any I/O inside a conversation must be wrapped in `conversation.external()` — grammy replays the entire function on each update, so side effects outside `external()` run multiple times.

**State persistence:** `src/core/db.ts` exposes a simple key-value `prefs` table in `data/bot.db`. User preferences (last-used currency, account, category) are read/written via `src/bot/userState.ts`.

**In-memory cache:** `src/core/cache.ts` provides `withCache(key, fetcher, ttlMs)`. Currencies and categories are warmed at startup.

**Path aliases:** `@/*` maps to `./src/*` (configured in `tsconfig.json`).

## Code style

- No banner-style section dividers. Use plain `// comment` or whitespace only.
- Comments only for non-obvious *why*, not *what*.
- Always use curly braces after `if`/`else`/`for`/`while`, even for single-line bodies.
- Prefer declarative over imperative code.
- No abbreviated variable names (use `category`, not `cat` or `c`).
- Avoid nested `if` chains — flatten logic.
- All callback data strings live in `src/bot/constants/callbacks.ts` as `const` objects — never inline string literals for callbacks.

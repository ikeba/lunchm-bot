# lunchm_bot

Personal Telegram bot for Lunch Money API v2.

## Stack

- **Runtime:** Bun
- **Bot:** grammy v1 + @grammyjs/conversations v2
- **Validation:** zod v4
- **Language:** TypeScript
- **Persistence:** `bun:sqlite` — `data/bot.db` (key-value prefs table)

## Running

```bash
bun run src/index.ts        # start
bun --watch src/index.ts    # with hot reload
```

## Environment variables (.env)

```
TELEGRAM_BOT_TOKEN=     # from @BotFather
LUNCH_MONEY_API_KEY=    # my.lunchmoney.app/developers
ALLOWED_USER_ID=        # your Telegram ID (from @userinfobot)
LUNCH_MONEY_BASE_URL=   # optional, default: https://api.lunchmoney.dev/v2
```

## Structure

```
src/
├── index.ts                      # entry point, wires everything together
├── config.ts                     # zod validates .env
├── api/
│   ├── client.ts                 # base fetch client (headers, baseUrl, get/post/put/delete)
│   ├── types.ts                  # zod schemas + TypeScript types (Transaction, Account)
│   ├── transactions.ts           # getTransactions, getTransactionById, createTransaction
│   ├── accounts.ts               # getAccounts
│   └── me.ts                     # getMe
├── bot/
│   ├── context.ts                # MyContext = Context & ConversationFlavor<Context>
│   ├── middleware.ts             # authMiddleware — blocks everyone except ALLOWED_USER_ID
│   ├── keyboards.ts              # confirmKeyboard (Confirm/Cancel)
│   ├── userState.ts              # getLastUsed / setLastUsed — DB-backed, persists across restarts
│   ├── handlers/
│   │   ├── start.ts              # /start, /help
│   │   ├── listTransactions.ts   # /transactions
│   │   └── balance.ts            # /balance
│   └── conversations/
│       └── addTransaction.ts     # /add — multi-step dialog (grammy conversations)
├── core/
│   ├── db.ts                     # bun:sqlite wrapper — getPref / setPref / deletePref
│   ├── cache.ts                  # in-memory API cache — withCache(key, ttlMs, fetcher)
│   └── logger.ts                 # logger → console + logs/YYYY-MM-DD.log
└── utils/
    ├── formatTransaction.ts      # formatTransaction, formatTransactionList
    └── formatAccount.ts          # formatAccount, formatAccountList

data/
└── bot.db                        # SQLite, gitignored — persisted prefs (last used account/category/currency)
```

## Bot commands

| Command           | Description                                                 |
|-------------------|-------------------------------------------------------------|
| `/start`, `/help` | List of commands                                            |
| `/transactions`   | Last 20 transactions                                        |
| `/add`            | Add a transaction (dialog: amount → payee → note → confirm) |
| `/balance`        | Manual account balances                                     |

## Architecture decisions

- **One file = one responsibility** (SRP)
- `api/client.ts` is the single place that owns baseUrl and auth headers
- Auth middleware is first in the chain — unauthorized updates are silently ignored
- grammy conversations v2 manages sessions internally, no standalone `session()` needed
- All API responses are validated through zod schemas before use
- Persistent user preferences live in `src/core/db.ts` (SQLite key-value, `data/bot.db`)
- Any I/O inside a conversation must be wrapped in `conversation.external()` — grammy replays the entire function on each update, so side effects outside `external()` run multiple times

## Code style

- Do **not** use banner-style section divider comments like:
  ```ts
  // ---------------------------------------------------------------------------
  // Section title
  // ---------------------------------------------------------------------------
  ```
  Use a single plain comment `// Section title` or just rely on whitespace between logical blocks.
- Do not add obvious comments that explain what the code does. Instead, prefer self-explanatory code and
  function/variable names. Comments should only be used to explain *why* something is done a certain way, or to clarify
  non-obvious intent.
- Always use curly braces after `if`, `else`, `for`, `while` — even for single-line bodies:
  ```ts
  // ✗
  if (x) doSomething()

  // ✓
  if (x) {
    doSomething()
  }
  ```


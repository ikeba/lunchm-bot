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
- always try to use declarative, not imperative code
- NEVER use single line vars, e.g. not 'c', 'cat' - better 'category'
- avoid spagetti code with nested if-s
- avoid inline strings like 'category:skip', better create 'const {} as const' and use them

## Pre-Implementation Risk Analysis

Before ANY non-trivial code changes, you MUST:


**Present your plan** to the operator:
   a. What will be done, which files, which approach
   b. **Risks → Mitigations table** (mandatory):

      | # | Risk | Mitigation | Where in Plan |
      |---|------|-----------|---------------|
      | R1 | Concrete failure mode | Concrete prevention | Step N |
      | R2 | ... | ... | Step N |
      | R3 | ... | ... | Step N |

      Minimum 3 rows. Each row must be:

**Risk**: specific failure mode, not vague ("token expiry" not "something breaks")
**Mitigation**: specific action, not vague ("add refresh logic in Step 3" not "be careful")
**Where in Plan**: reference to the step where this mitigation is applied


   c. Present the complete plan with the table to the operator
   d. Wait for explicit approval ("yes", "go", "ok").
      Silence ≠ approval. Your own "Fixing now." ≠ approval.


Only after explicit approval → proceed with implementation


### Definition of Done for Plans

A plan is INVALID without a visible `## Risks → Mitigations` section.
Risks MUST appear in the table — not silently baked into the plan text.
If you "accounted for" a risk but it's not in the table, it doesn't count.

### Failure Mode Categories

When analyzing your plan, check each category:


**Misinterpretation**: Am I understanding the requirements correctly?
  What if the operator means something different?

**Hallucination**: Am I referencing APIs/methods/params that actually exist?
  Did I verify from docs, not from training data?

**Edge cases**: What inputs/states break this? Empty data? Concurrent access?
  Network failure? Large payloads?

**Side effects**: What else does this change affect? Other files?
  Other features? Performance? Security?

**Missing constraints**: What platform/version/environment limitations apply?
  What assumptions am I making that might be wrong?

## Knowledge Capture

When you discover something important during code exploration or implementation — a non-obvious constraint, a hidden dependency, a footgun, or a pattern that future-you needs to know — **you MUST add it to this file** (in the relevant section, or create a new one).

Examples of what to capture:
- grammy conversations replay gotchas you encountered
- Non-obvious ordering requirements (e.g. "registerMenu must precede createConversation")
- Telegram API quirks (rate limits, message edit restrictions, callback data size limits)
- SQLite/bun:sqlite behavioral nuances
- Anything that cost you time to figure out and would cost time again

---
name: testing
description: Testing patterns for real-behavior coverage — minimal mocks, real HTTP/DB, file naming, folder structure, and the required coverage comment block. Read before writing any test suite or deciding between mocks and real infrastructure.
---

## Philosophy

Test real behavior, not implementation details. Every test should exercise code the way the system actually uses it — real HTTP, real DB, real module wiring. Mocks are the exception, not the default.

---

## File naming — split by type

| Suffix | What it covers |
|---|---|
| `.unit.test.ts` | Pure logic — no I/O, no framework, no DB |
| `.integration.test.ts` | Real HTTP + real DB + real module wiring |
| `.e2e.test.ts` | Full stack end-to-end (browser, extension, or CLI-driven) |

One file per type per domain. Do not mix unit and integration tests in the same file.

---

## Folder structure

Tests live in a `__tests__/` subfolder inside the domain they cover:

```
src/domains/message/
  message.service.ts
  message.controller.ts
  __tests__/
    message.service.unit.test.ts
    message.integration.test.ts
```

---

## Required: test coverage comment block

Every test file must start with a comment block listing every scenario it tests — before any imports or `describe` blocks. Detailed enough that the user never has to read the test body to understand coverage.

```typescript
// Tests: MessageService flow selection
//
// Unit:
//   - returns rejection response when status = rejected
//   - calls backup flow when status = null
//   - calls backup flow when status = pending
//   - calls backup flow when status = processing
//   - calls beats flow when status = analyzed and video_beats row exists
//   - calls backup flow when status = analyzed and video_beats row is missing
//   - never calls LlmService in the beats flow path
//   - passes correct sourceId and chunkIndex to beats lookup
```

No scenario is implied. If it's tested, it's listed. If it's not listed, it's not tested.

---

## Test naming

Describe blocks: name the thing under test.
`it` / `test` blocks: describe the scenario and expected outcome — not the implementation.

```typescript
// Good
it('returns 401 when Authorization header is missing')
it('falls through to backup flow when video_beats row does not exist')

// Bad
it('calls authGuard')
it('checks video_beats')
```

---

## Mocking rules

**Mock external third-party services** (LLM providers, SponsorBlock, PostHog, Sentry). These have network cost, rate limits, and non-deterministic output.

**Never mock internal infrastructure** in integration tests:
- No mock DB — use a real test database
- No mock HTTP — use supertest against a real NestJS app instance
- No mock queue — use a real pg-boss instance or a real in-process handler

**When you mock something, comment why:**
```typescript
// mocking Gemini — real calls are non-deterministic and cost money
jest.mock('../llm/llm.service');
```

---

## Integration tests — HTTP

Spin up a real NestJS app instance. Send real HTTP requests via supertest. Assert on response shape, status codes, and DB state.

```typescript
const app = await Test.createTestingModule({ imports: [AppModule] })
  .compile()
  .then(m => m.createNestApplication().init());

const res = await request(app.getHttpServer())
  .post('/v1/message')
  .set('Authorization', `Bearer ${token}`)
  .send(payload);

expect(res.status).toBe(200);
```

---

## Database

Use a dedicated test database — never production. Configure the connection in `.env.test`.

Clean state between test suites. Strategy is project-level choice (truncate tables, rollback transactions, reset sequences) — pick one and apply it consistently. The important rule: tests must not depend on data left by previous tests.

---

## Independence

- No shared mutable state between tests
- Each test sets up its own data
- Each test cleans up after itself (or relies on suite-level cleanup)
- A test must pass whether run alone or in a full suite

---

## What to test

| Test type | Cover |
|---|---|
| Unit | Pure functions, decision trees, business logic, state machines, validators |
| Integration | HTTP endpoints, DB queries, queue dispatch, auth guards, streaming responses |
| E2E | Critical user flows end-to-end — the minimum set that proves the system works as a whole |

**Skip:** simple pass-through controllers, trivial getters, framework boilerplate, generated code.

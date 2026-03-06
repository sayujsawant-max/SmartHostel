# Code Review: Story 1.4 - Seed Script & Demo Data

**Reviewer:** Claude Opus 4.6
**Date:** 2026-03-06
**Verdict:** PASS (minor issues noted)

---

## Files Reviewed

| File | Status |
|------|--------|
| `server/src/models/faq-entry.model.ts` | OK |
| `server/src/models/fee.model.ts` | OK |
| `server/src/models/category-default.model.ts` | OK |
| `server/src/scripts/seed.ts` | OK (minor notes) |
| `server/src/scripts/seed-data/faqs.json` | OK |
| `server/src/scripts/seed-data/category-defaults.json` | OK |
| `server/src/scripts/seed-data/fees.json` | OK |

---

## AC Verification

### AC-1: npm run seed populates users (all roles with block/floor/room), FAQs, categories, fees
**PASS.** `seed.ts` seeds 4 users (STUDENT, WARDEN_ADMIN, GUARD, MAINTENANCE), 22 FAQ entries, 8 category defaults, and 3 fee records. The `npm run seed` script in `server/package.json` points to `seed.ts` via tsx. Note: only the STUDENT user has block/floor/roomNumber; other roles omit these fields. This is acceptable since block/floor/roomNumber are optional on the User model and only semantically required for students.

### AC-2: Login works for seeded users
**PASS.** All users are seeded with hashed password (`bcrypt.hash('password123', 10)`) and the `passwordHash` field is set via `$set`, ensuring it is always current. The upsert pattern with `findOneAndUpdate` on `email` ensures credentials are valid after seeding.

### AC-3: 20+ FAQ entries, category defaults with SLA, fee records exist
**PASS.** `faqs.json` contains 22 entries across 7 categories. `category-defaults.json` has 8 categories with `slaHours` and `defaultPriority`. `fees.json` has 3 fee records (HOSTEL_FEE, MESS_FEE, MAINTENANCE_FEE) with amounts, due dates, and statuses (UNPAID, PAID, OVERDUE).

### AC-4: Idempotent (safe to run multiple times)
**PASS.** All seed functions use `findOneAndUpdate` with `upsert: true`. Users keyed on `email`, FAQs on `question`, category defaults on `category`, fees on `{studentId, feeType, semester}`. Running twice produces no duplicates.

---

## Architecture Compliance

| Rule | Status |
|------|--------|
| camelCase everywhere (Mongo fields, payloads) | OK |
| `{ collection, timestamps, strict }` on every schema | OK - all three models |
| Model names: PascalCase singular | OK - FaqEntry, Fee, CategoryDefault |
| File names: kebab-case `.ts` | OK - faq-entry.model.ts, fee.model.ts, category-default.model.ts |
| Fees read-only in MVP | OK - seeded only, no PATCH endpoint |
| Seed data in `server/src/scripts/seed-data/` as JSON | OK |

---

## Issues

### Minor

1. **Duplicate user data between `seed.ts` and `seed-users.ts`.**
   The user array and seeding logic are copy-pasted from `seed-users.ts` into `seed.ts` rather than importing/reusing a shared function. Story says "reuses seed-users.ts logic inline" which was the chosen approach, but this creates a maintenance burden -- if user seed data changes, both files must be updated. Consider extracting to a shared module in a future story.

2. **`isNew` detection is fragile.**
   The pattern `result?.createdAt.getTime() === result?.updatedAt.getTime()` to detect whether a document was created vs. updated relies on Mongoose `timestamps` setting `createdAt === updatedAt` on insert. This works but could be unreliable if there is any clock skew or if Mongoose changes behavior. A more robust approach would be to check `result?.isNew` or use the `rawResult` option to check `upsertedId`. Low risk in practice for a seed script.

3. **CategoryDefault has redundant unique index.**
   The schema already specifies `unique: true` on the `category` field definition (line 18), and then a separate `categoryDefaultSchema.index({ category: 1 }, { unique: true })` is added (line 44). This creates the same unique index twice. Only one is needed -- either the schema-level `unique` or the explicit index call.

---

## Positive Observations

- Clean, well-structured seed script with clear 4-step progression and summary output.
- Proper `$setOnInsert` usage for fields that should only be set on creation (e.g., `refreshTokenJtis`, `failedLoginAttempts`).
- Fee seeding correctly looks up the student user by email first and gracefully handles the case where the student is not found.
- FAQ data is realistic and covers all expected categories with useful keywords for Fuse.js search.
- Category defaults match the exact SLA values specified in the story tasks (ELECTRICAL 12h CRITICAL, PLUMBING 24h HIGH, etc.).

---

## Summary

Implementation is solid and meets all acceptance criteria. The three new Mongoose models follow architecture conventions correctly. The seed script is idempotent, produces good console output, and handles edge cases. The only substantive concern is the duplicated user seed data between `seed.ts` and `seed-users.ts`, which is a minor maintainability issue rather than a correctness problem.

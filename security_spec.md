# Firestore Security Specification (Zero-Trust Hardening)

## 1. Data Invariants
- **Products**: A product cannot be modified unless the user is authenticated. Lock UID/Timestamp updates are strictly transactional to prevent lock cannibalization.
- **PendingTasks**: Only the system (via service worker/batch process) or the owner of the local device instance should interact with the sync queue. PII (if any) is isolated, but here it's mainly sync payloads.

## 2. The "Dirty Dozen" Payloads (Examples of attacks to block)
1. **Unauth Write**: Anonymous user attempting `setDoc` on `/products/aspirina`.
2. **Ghost Field Mutation**: User attempts `updateDoc` on `/products/aspirina` adding `{ admin_override: true }`.
3. **ID Poisoning**: User attempts `createDoc` on `/products/!@#$%^&*()_+=`.
4. **Lock Cannibalization**: User A attempts to overwrite `lock_uid` of an active analysis by User B.
5. **Schema Invariant Violation**: Updating `synergy_analyzed` to string 'true'.
6. **Orphaned Write**: Creating a product document without essential fields.
7. **Type Poisoning**: Updating `vectores` (array of numbers) with a string array.
8. **Lock Shortcutting**: Updating `lock_uid` without the `lock_timestamp` transaction logic.
9. **Terminal State Manipulation**: Attempting to revert `synergy_analyzed` to false after it has been finished.
10. **Shadow Field Injection**: Adding a `verified_by` field when not authorized.
11. **PII Scope Expansion**: Attempting to read `/products` via a blanket `list` rule that doesn't respect query filtering.
12. **Sync Queue Hijacking**: User B attempts to read/write User A's `pending_tasks`.

## 3. Test Runner Plan
`firestore.rules.test.ts` will use `@firebase/rules-unit-testing` to emulate these 12 scenarios.
- Require setting up Firestore emulator.
- Use `assertFails` for all 12 cases.

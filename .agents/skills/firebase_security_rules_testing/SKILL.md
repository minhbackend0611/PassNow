---
name: firebase-security-rules-testing
description: |
  Guides the writing, reviewing, and automated testing of Firebase Firestore security rules using the Local Emulator Suite and Vitest/Jest. Use this when the user asks to write security rules, debug a "Missing or insufficient permissions" error, or test firestore.rules locally.
  Do NOT use for writing general React application code.
version: 1.0.0
license: MIT
---

# Firebase Security Rules Testing

## When to use
- Writing new `firestore.rules`.
- Debugging access control issues (e.g. `FirebaseError: Missing or insufficient permissions`).
- Setting up the Firebase Local Emulator Suite to test rules in a CI environment.
- Authoring unit tests for Firestore rules using `@firebase/rules-unit-testing`.

## When NOT to use
- Writing React UI components.
- Designing Firestore document schemas (refer to the project spec instead).

## Workflow
1. **Analyze Rule Requirements**:
   - Understand the resource being accessed (e.g., `transactions`, `reviews`).
   - Identify who can `read`, `create`, `update`, `delete`.
   - Consider `request.auth.uid` validation and data validation (`request.resource.data`).

2. **Write the Rule**:
   - Edit the `firestore.rules` file in the project root.
   - Example structure:
     ```javascript
     match /transactions/{transactionId} {
       allow read: if request.auth != null && (resource.data.sellerId == request.auth.uid || resource.data.buyerId == request.auth.uid);
       allow create: if request.auth != null;
     }
     ```

3. **Author Tests**:
   - Write tests using `@firebase/rules-unit-testing` in a `tests/` or `__tests__/` directory.
   - See `examples/rules.test.ts` for a template.
   - Ensure tests cover both "allow" scenarios (positive cases) and "deny" scenarios (negative cases).

4. **Run Tests via Emulator**:
   - Start the Firebase emulator using the provided script in `scripts/run_emulator.sh`.
   - Execute the test suite against the running emulator.
   - After testing, clean up the emulator environment.

## Critical Guidelines
- **Always Deny by Default**: Ensure `match /{document=**} { allow read, write: if false; }` is present at the top level or implicitly understood.
- **Resource vs. Request.Resource**: Remember that `resource.data` refers to the EXISTING document in the database, while `request.resource.data` refers to the INCOMING data payload.
- **Batched Writes**: Ensure rules account for batched writes if your application uses them.

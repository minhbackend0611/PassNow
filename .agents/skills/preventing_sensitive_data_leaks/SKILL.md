---
name: preventing-sensitive-data-leaks
description: |
  Enforces secure development practices to prevent leaking sensitive information (API keys, credentials, private tokens, passwords) during development and commits. Use this when writing configurations, setting up environment variables, running git commits, reviewing security rules, or handling keys.
  Do NOT use for creating build manifests or editing release scripts.
version: 1.0.0
license: MIT
---

# Preventing Sensitive Data Leaks

## When to use
- Staging or committing code changes using Git.
- Adding API integrations or setting up Firebase/third-party configurations.
- Defining local environment variables (`.env`, `.env.local`, etc.).
- Reviewing security warnings from pre-commit hooks or static analysis tools (Semgrep, etc.).

## When NOT to use
- Modifying general CSS styles or UI layout components.
- Standard route definitions and non-security state management.

## Workflow

### 1. Zero-Hardcoding Rule
- Never insert raw API keys, private keys, database passwords, client secrets, or authentication tokens directly into any code files (including tests, comments, and config files).
- **Correct Pattern**:
  ```typescript
  // src/lib/firebase.ts
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };
  ```

### 2. Environment Configuration
- Save all secrets and runtime configurations in `.env.local` or `.env` files.
- Verify that these environment files are explicitly listed in `.gitignore` so they are never tracked or committed to git.
- **Verification**: Check `.gitignore` contains `.env`, `.env.local`, `.env.*.local`, etc.

### 3. Pre-Commit Verification Loop
Always run and verify local pre-commit checks before pushing code.
1. **Stage changes**: `git add .`
2. **Execute checks**: Run tests and lint checks (`npm run test`, `npm run lint`).
3. **Handle pre-commit alerts**:
   - If a pre-commit hook (like Semgrep or Git hooks) alerts on "Hardcoded Secret" or "API Key leak":
     - Identify the offending file and line.
     - Move the secret to `.env.local`.
     - Replace the hardcoded string with the corresponding env variable import (e.g. `import.meta.env.VITE_...`).
     - Re-stage and re-commit the change.

### 4. Input Sanitization
- Enforce input verification gates (using Zod schemas and TypeScript interfaces) for all user inputs at application boundaries to prevent prompt or payload injection attacks.

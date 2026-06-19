# PassNow Project-Scoped Agent Guidelines (AGENTS.md)

These guidelines govern all AI agent behaviors, coding patterns, and security constraints for the PassNow project.

---

## 1. Core Principles

- **Spec is the source of truth**: Refer to [passnow-spec.md](../specs/passnow-spec.md) for all architecture, schemas, and BDD scenarios.
- **TDD Planning Gate**: Propose changes and define security boundaries before editing code.
- **Incremental changes**: Write code and corresponding tests together. Do not clean up unrelated code during a bug fix or feature implementation.
- **Style consistency**: Match the design guidelines in [CONTEXT.md](CONTEXT.md).

---

## 2. Secure Development Rules (STRIDE & Input Gating)

1. **Input Validation**: Always sanitize and validate all user inputs. Use Zod schemas and TypeScript interfaces to enforce safety constraints.
2. **Access Control**: Enforce authorization gates. Ensure only resource owners can update or delete listings and profiles. Check Firestore Security Rules.
3. **No Hardcoded Credentials**: Never commit or hardcode Firebase API keys, private tokens, or secrets. Use environment variables (from `.env.local`).
4. **Safety Hooks**: All commands and tool calls must comply with `.agents/hooks.json` and pass validation in `.agents/validate_tool_call.py`.

---

## 3. TDD Loop & pre-commit

- Run tests before staging.
- Resolve any linter or spelling errors immediately when pre-commit hook alerts occur.
- Write failing tests first for any bug fix request to reproduce the issue.

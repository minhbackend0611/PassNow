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
5. **No Access to Sensitive Files**: The AI agent is STRICTLY FORBIDDEN from viewing, opening, or accessing sensitive files such as `.env`, `.env.local`, or any file containing real credentials. The agent is only allowed to create and access `.env.example` containing dummy placeholder values.

---

## 3. TDD Loop & pre-commit

- Run tests before staging.
- Resolve any linter or spelling errors immediately when pre-commit hook alerts occur.
- Write failing tests first for any bug fix request to reproduce the issue.
- Perform incremental git commits for changes and push code to the remote repository once changes are validated.
- **MANDATORY AUTOMATION TESTS**: For every new feature or module implemented, you MUST write corresponding automation tests using the project's testing framework (Vitest/RTL) to ensure functionality works correctly before completion.

---

## 4. UI/UX Aesthetic Rules
- **Constant Alignment Check**: On every UI modification, the agent MUST review the UI layout, styling, and interactivity to ensure it strictly adheres to the design specifications provided by the user in the `stitch_passnow_marketplace_specification` folder. Use the exact HTML structure and Tailwind classes provided in those template files whenever possible.
- **No basic MVP UI**: Always incorporate hover effects, micro-animations, glassmorphism (where applicable), and modern typography as per the provided spec. Never output bare-bones or unpolished Tailwind components. If a UI looks too basic, rewrite the styles to match the templates before presenting it to the user.

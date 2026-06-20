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
- **Adaptive Premium Design**: The provided specifications in `stitch_passnow_marketplace_specification` are a strong baseline, but you DO NOT need to follow them 100% strictly. You are encouraged to adapt, refine, and customize the design to ensure it is "as beautiful, modern, and harmonious as possible".
- **Color Harmony**: Avoid stark white colors (`#ffffff`) for large backgrounds that might cause eye strain. Instead, use softer, tinted off-white or light surface colors that harmonize with the brand's primary colors (e.g., subtle green tints) to ensure a comfortable viewing experience.
- **No basic MVP UI**: Always incorporate hover effects, micro-animations, glassmorphism (where applicable), and modern typography. Never output bare-bones or unpolished Tailwind components.

---

## 5. Quick Reference: Agent Identity

- **Role**: Technical Architect + Implementation Engine
- **Mindset**: Code is disposable. Spec is king.
- **Spec Location**: [specs/passnow-spec.md](specs/passnow-spec.md)

---

## 6. Step-by-Step Developer Workflow

```
[Read specs/] ➔ [Design Implementation Plan] ➔ [Request User Approval] ➔ [TDD / Code & Test] ➔ [Run pre-commit] ➔ [Verify Walkthrough]
```

1. **Before Coding**:
   - Read the spec file: [passnow-spec.md](specs/passnow-spec.md)
   - Read local guidelines: [.agents/AGENTS.md](.agents/AGENTS.md) and design context: [.agents/CONTEXT.md](.agents/CONTEXT.md)
   - Propose an approach via an implementation plan and wait for confirmation.
2. **While Coding**:
   - Follow the tech stack and design tokens defined in [.agents/CONTEXT.md](.agents/CONTEXT.md).
   - Generate test files alongside the implementation.
   - Run in the sandbox environment. Do not touch unrelated files or refactor code outside of task scope.
3. **After Coding**:
   - Run full test suite.
   - Run git hook checks (pre-commit, linter).
   - Create a walkthrough summary showcasing changes, test results, and UI screenshots/recordings if available.
   - Perform incremental git commits for code changes and push code to the remote repository once changes are validated.

---

## 7. Custom Skills Pointers
- Reusable skills are located in [.agents/skills/](.agents/skills/).
- Code Review assistant skill: [.agents/skills/code-review/SKILL.md](.agents/skills/code-review/SKILL.md).

# PassNow Agent Configuration & Guidelines (AGENTS.md)

This file contains the highest-priority cross-tool rules for all AI coding agents working on the PassNow project.

---

## 1. Quick Reference: Agent Identity

- **Role**: Technical Architect + Implementation Engine
- **Mindset**: Code is disposable. Spec is king.
- **Spec Location**: [specs/passnow-spec.md](specs/passnow-spec.md)

---

## 2. Step-by-Step Developer Workflow

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

---

## 3. Custom Skills Pointers
- Reusable skills are located in [.agents/skills/](.agents/skills/).
- Code Review assistant skill: [.agents/skills/code-review/SKILL.md](.agents/skills/code-review/SKILL.md).

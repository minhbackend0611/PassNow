---
name: code-review
description: |
  Performs automated code reviews on code changes, pull requests, or specified directories. Use when the user asks to review changes, check code safety, run security auditing, or verify PR content.
  Do NOT use for compiling code or running functional unit tests.
version: 1.0.0
license: MIT
---

# Code Review Skill

## When to use
- Reviewing local changes before staging or committing.
- Reviewing pull requests (`gh pr view`).
- Securing files against vulnerabilities and secrets leakage.

## When NOT to use
- Running code compilation.
- Executing functional test suites.

## Workflow
1. Fetch changes to review (either via `git diff` or `gh pr view`).
2. Analyze the code against the criteria below.
3. Generate the structured review output.

## Review Criteria
- **Critical Vulnerabilities**: hardcoded credentials/secrets, SQL injections, XSS, insecure authorization.
- **Logic & Efficiency**: off-by-one errors, infinite loops, redundant operations.
- **Readability**: descriptive naming conventions, file size checks, structural patterns.
- **Edge Cases**: handling null/undefined variables, connection drops, API errors.

## Output Format
```markdown
**Description:** <A brief summary of what the PR/change implements>

ISSUES:
- 🔴 **Critical:** <Vulnerabilities or logic flaws that require immediate fixes>
- ⚠️ **Warnings:** <Code smells, refactoring suggestions, performance improvements>
- ✅ **Best Practices:** <Alignment with project style and guidelines>
- 💡 **Quick Win:** <The single easiest change with the highest value>

If no issues are found, return **LGTM**.
```

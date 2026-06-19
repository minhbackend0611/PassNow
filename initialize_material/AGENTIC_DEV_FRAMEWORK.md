# AGENTIC_DEV_FRAMEWORK.md
> Tài liệu này là **source of truth** cho AI agent. Đọc toàn bộ trước khi viết bất kỳ dòng code nào.  
> Mục tiêu: dựng khung phát triển phần mềm có kiểm soát chặt chẽ — tốc độ cao, rủi ro thấp.

---

## 1. TRIẾT LÝ CỐT LÕI

```
Vibe Coding ≠ Vibe In Production
Code is disposable. Spec is the source of truth.
Trust is earned continuously, not granted once.
Security + Evaluation = the two axes of production-readiness.
```

- **Developer role** → Technical Architect, không phải typist.  
- **Agent role** → Implementation Engine, không phải decision-maker.  
- **Bottleneck mới** → Review, verification, integration — không còn là code generation.

---

## 2. SPEC-DRIVEN DEVELOPMENT (SDD)

### 2.1 Nguyên tắc

Trước khi viết code, **phải có spec**. Không có spec = agent sẽ guess = "Rogue Agent" incident.

Spec là **Architectural North Star** — nguồn sự thật cho cả human lẫn AI.

### 2.2 Cấu trúc thư mục bắt buộc

```
./project/
├── specs/                    # Task-specific specs, checked into version control
│   └── <feature>.md          # BDD spec cho từng feature
├── .agent/
│   └── skills/               # Reusable agent skills (trigger-based workflows)
│       └── <skill>/SKILL.md
├── AGENTS.md                 # Shared cross-tool config (highest priority)
└── .gemini/GEMINI.md         # Project-level agent DNA (hoặc .claude/CLAUDE.md)
```

### 2.3 Format spec

Dùng **Markdown + YAML hybrid**:
- Narrative/instructions → Markdown headers
- Structured config, schema, nested data (depth > 3) → YAML block
- Tránh JSON cho deeply nested config (YAML: 51.9% accuracy vs JSON: 43.1%)

### 2.4 BDD Spec — Template bắt buộc

```markdown
## Feature: <Tên feature>

### Background
- Why: <Lý do business>
- Stack: <framework@version, lib@version>
- Architecture: <pattern áp dụng>

### Technical Design
- DB Schema: <định nghĩa rõ ràng>
- API Contract: <endpoints + payload>
- Diagrams: <link hoặc ASCII>

### Scenarios

**Scenario: <Happy path>**
Given <trạng thái ban đầu>
When <hành động>
Then <kết quả mong đợi>

**Scenario: <Error case>**
Given <trạng thái lỗi>
When <hành động>
Then <hành vi xử lý lỗi>

**Scenario: <Edge case>**
Given <điều kiện biên>
When <hành động>
Then <kết quả>
```

### 2.5 Quy tắc viết spec

- [ ] Ghi rõ version cho MỌI library — không để agent tự đoán
- [ ] Bao gồm "Why" — giúp agent suy luận forward
- [ ] Bao gồm diagrams hoặc ASCII art cho flow phức tạp
- [ ] Peer review spec trước khi cho agent code — bắt logic flaw sớm

---

## 3. EXECUTION MODES

Agent phải được prompt đúng mode. Sai mode = sai output.

### Mode 1: Project Generation (Architect)

```
TRIGGER: Khởi tạo project mới từ đầu

PROMPT PATTERN:
"Đọc spec tại specs/<feature>.md. 
KHÔNG code ngay. 
Đề xuất folder structure + tech stack trước, chờ confirm.
Sau khi confirm: generate code + tests + docs + logging."

RULES:
- Không YOLO mode
- Propose before execute
- Always include: tests, README, logging, error handling
```

### Mode 2: Feature Generation (Builder)

```
TRIGGER: Thêm feature vào codebase đã có

PROMPT PATTERN:
"Implement <feature> theo spec tại specs/<feature>.md.
Match existing code style, naming conventions, error handling patterns.
Show diff trước khi apply khi edit nhiều files."

RULES:
- Match existing patterns
- Confirm multi-file changes
- Always show the diff
```

### Mode 3: Bug Fixing (Forensic Specialist)

```
TRIGGER: Fix bug cụ thể

PROMPT PATTERN:
"Evidence: <paste log/error>. Flow: <A → B → C → fails here>.
Bước 1: Viết failing unit test reproduce bug.
Bước 2: Fix ONLY root cause — không cleanup unrelated code.
Bước 3: Verify test passes."

RULES:
- Evidence prompting, không symptom prompting
- Failing test trước, fix sau
- Không rename variables trong cùng bug fix task
- Surgical repair — không side effects
```

### Mode 4: Documentation (Author)

```
TRIGGER: Maintain docs

RULES:
- README.md và CHANGELOG.md luôn phải sync với code
- Python: Google Style Docstrings
- TypeScript: JSDoc
- Doc-code out of sync → agent sẽ hallucinate
```

---

## 4. SECURITY FRAMEWORK (7 PILLARS)

Agent phải enforce các constraints sau. Đây là **non-negotiable**.

### Pillar 1 — Infrastructure

```yaml
sandbox:
  type: ephemeral          # Reset state between runs
  isolation: kernel-level  # gVisor hoặc equivalent
  network: isolated        # Không direct internet access
  
egress:
  allowed: [internal-proxies, offline-caches]
  blocked: [public-internet-direct]
```

### Pillar 2 — Data

```yaml
data_security:
  at_rest: CMEK
  in_transit: mTLS
  access: least-privilege
  rag_stores: strict-tenant-partitioning  # Chống cross-tenant vector poisoning
```

### Pillar 3 — Model/Prompt

```yaml
prompt_security:
  system_instructions: cryptographically-attested
  rule_files: treated-as-source-code  # AGENTS.md, SKILL.md là sensitive artifacts
  context_hygiene: enabled
```

### Pillar 4 — Application & Runtime

```yaml
runtime_security:
  llm_firewall: enabled           # Dynamic prompt + response filtering
  lifecycle_hooks:
    - before_tool_call
    - after_file_edit
  agent_gateway: centralised      # Govern A2A orchestration
  
dependency_management:
  source: internal-registry-only  # Chống slopsquatting
  version_pinning: cryptographic
  sbom_check: ci_cd_gate
  hallucinated_packages: blocked
```

**Context Hygiene — bắt buộc implement:**

```python
# Pattern: placeholder injection thay vì hardcode PII
# Template dùng [[VARIABLE_NAME]] syntax
# Runtime resolver thay thế từ env vars hoặc override state

def resolve_context(template_str, override_state=None):
    """Thay [[VAR]] bằng giá trị từ override_state hoặc os.environ."""
    import re, os
    state = override_state or {}
    def replace(match):
        key = match.group(1).strip()
        return str(state[key]) if key in state else os.environ.get(key, match.group(0))
    return re.sub(r'\[\[([^\]]+)\]\]', replace, template_str or "")
```

### Pillar 5 — Identity & Access (IAM)

```yaml
identity:
  per_agent: unique-cryptographic-id  # SPIFFE ID hoặc equivalent
  type: agentic                        # KHÔNG dùng delegated human credentials
  
access_control:
  model: ABAC                          # Attribute-Based, không chỉ RBAC
  permissions_matrix: "Intent × User × Time"
  
jit_downscoping:
  enabled: true
  scope: exact-task-only
  expiry: immediate-after-task
  file_tree_allowlist: project-dirs-only
  deny_by_default: [secrets, build-scripts, prod-manifests]
```

**Confused Deputy Prevention:**
```
Agent KHÔNG bao giờ là final arbiter của access.
High-stakes actions (prod deploy, DB schema change, financial tx) 
→ Mandatory "Vibe Diff" (plain-English summary) + human sign-off.
```

### Pillar 6 — Observability & SecOps

```yaml
observability:
  framework: OpenTelemetry
  spans:
    - agent.session    # Full task duration
    - agent.think      # Internal reasoning cycle
    - agent.tool       # Tool call args + latency
  
security_triad:
  red_team:            # Proactive adversarial testing
    - inject adversarial prompts vào RAG context
    - test jailbreak resistance
  blue_team:           # Continuous monitoring
    - Agent Behavioural Analytics (ABA)
    - Monitor Runtime AgBOM (tools + models + data sources)
    - Detect intent drift
  green_team:          # Auto-remediation
    - Stateful quarantine (không kill container đột ngột)
    - Auto-refactoring insecure code
    
circuit_breaker:
  trigger: Agent Trust Score drops below threshold
  action: rollback to last version-control checkpoint
```

### Pillar 7 — Governance

```yaml
governance:
  approval_model: "Logic Reviews" (không chỉ approve button)
  attestation: Risk-Stratified (digital signature bound to outputs)
  audit_trail: immutable (every action → specific agent + human who approved)
  compliance: EU AI Act (Algorithmic Impact Assessments for high-risk agents)
```

---

## 5. POLICY SERVER PATTERN

Mọi tool call phải đi qua Policy Server. Implement 2-layer check:

```python
class PolicyService:
    """
    Layer 1 — Structural Gate (fast, deterministic):
      - Role-based tool allowlist từ policies.yaml
      - Environment-based blocked tools
    
    Layer 2 — Semantic Gate (LLM-based):
      - Check content của action có violate PII policy không
      - Unmasked email, API key in payload → VIOLATION → reject
    """
    
    def is_tool_allowed(self, tool_name: str) -> bool:
        # Check environment blocks
        env_blocked = self.config["environments"].get(self.env, {}).get("blocked_tools", [])
        if tool_name in env_blocked:
            return False
        # Check role permissions
        allowed = self.config["roles"].get(self.role, {}).get("allowed_tools", [])
        return "*" in allowed or tool_name in allowed

    async def check_semantic(self, action_description: str) -> bool:
        # Dùng LLM để check PII leak, unauthorized access patterns
        prompt = f"Does this action violate PII or security policies? {action_description}"
        response = llm.generate(prompt)
        return not response.upper().startswith("VIOLATION")
```

```yaml
# policies.yaml
environments:
  localhost:
    blocked_tools: [send_email, deploy_to_prod]
  staging:
    blocked_tools: [deploy_to_prod]

roles:
  viewer:
    allowed_tools: [list_files, read_file]
  developer:
    allowed_tools: [read_file, write_file, run_tests]
  admin:
    allowed_tools: ["*"]
```

---

## 6. AI-ASSISTED CODE REVIEW

### Automated review skill (`.agent/skills/code-review/SKILL.md`)

```markdown
TRIGGER: Khi có PR mới hoặc được gọi explicitly

ROLE: Senior Software Engineer + Security Researcher

STEPS:
1. Fetch PR: `gh pr view <PR_NUMBER>`
2. Analyze code theo criteria:

CRITERIA:
- Critical Vulnerabilities: hardcoded secrets, SQL injection, XSS, broken auth
- Logic & Efficiency: off-by-one errors, infinite loops, redundant API calls  
- Readability: naming conventions, mega-functions cần break down
- Edge Cases: null input, network failure, concurrent access

OUTPUT FORMAT:
**Description:** <PR đang làm gì>

ISSUES:
- 🔴 **Critical:** (Stop-ship)
- ⚠️ **Warnings:** (Code smells)
- ✅ **Best Practices:** (Lines to refactor)
- 💡 **Quick Win:** (Biggest single improvement)

Nếu không có issues: return "LGTM"
```

### Review tiers

| Tier | Tool | Khi nào dùng |
|------|------|--------------|
| 1 | Managed (Gemini Code Assist) | Review generic, bắt đầu nhanh |
| 2 | Hybrid (GitHub Action + agent CLI) | Team/repo-specific criteria |
| 3 | Custom (ADK agent + graph DB) | Cross-PR context, legacy codebase lớn |

**Chọn tier thấp nhất đủ bắt được vấn đề quan trọng.**

---

## 7. EVALUATION FRAMEWORK

Security đảm bảo agent không làm hại. Evaluation đảm bảo agent tạo ra giá trị.

### 7 dimensions cần evaluate

| # | Dimension | Câu hỏi | Method |
|---|-----------|---------|--------|
| 1 | Intent satisfaction | Agent build đúng ý user chưa? | LLM-as-judge, Human review |
| 2 | Functional correctness | Code build, run, pass tests? | Automated testing (pytest/jest) |
| 3 | Visual/behavioral | UI render đúng không? | Browser testing (Playwright) |
| 4 | Cost & efficiency | Token spend, latency, số lần correction? | Observability traces |
| 5 | Code quality | Match conventions của project? | Linter + LLM-as-judge |
| 6 | Trajectory quality | Agent đi đúng path không? | Trajectory inspection |
| 7 | Self-repair | Khi fail, agent recover hay compound failure? | Trace analysis |
| RAI | Safety & Responsible AI | Code vulnerabilities, credential leaks? | SAST (Snyk, Semgrep) |

### Key evaluation patterns

**Pattern 1 — Derive intent rubric từ session prefix:**
```python
# Lấy 1-2 message đầu của user làm rubric
# Score mọi turn tiếp theo dựa trên rubric này
# → Cách duy nhất evaluate intent satisfaction ở scale
opening = " ".join(session.user_messages[:2])
criteria = llm.generate(f"Produce 3-5 acceptance criteria for: {opening}. JSON.")
score = llm.generate(f"Does output satisfy {criteria}? Score 1-5. Output: {agent_response}")
```

**Pattern 2 — Evaluate rendered artifact, không phải code:**
```python
# Dùng multimodal LLM nhìn vào screenshot thực tế
# Code-level metrics bỏ sót: mobile layout broken, contrast thấp, button states sai
result = llm.generate(["Score layout_match, styling, interactive_correctness 1-5", 
                        spec, screenshot_bytes])
```

**Pattern 3 — Track session convergence, không phải turn accuracy:**
```python
# Câu hỏi đúng: "User có converge đến kết quả muốn không?"
# Sessions bị abandon mid-flow = failure cases quan trọng nhất
outcome = {
    "converged": last_turn.user_signal == "satisfied",
    "turns_to_converge": correction_count,
    "abandoned": last_user_action == "close",
    "cost_to_converge": total_token_cost_usd,
}
```

**Pattern 4 — Mine user corrections làm labeled failure data:**
```python
# Mỗi "no, not like that" = labeled failure example
# Cluster chúng để tìm systematic gaps
corrections = [t.user_message for trace in traces for t in trace.turns if t.is_correction]
# → KMeans clustering → prioritized failure mode list
```

---

## 8. TEAM CULTURE & SUSTAINABILITY

### Code review guidelines trong high-velocity AI environment

- **Bundled PR summaries** — AI-generated: what changed, breakage points, risk assessment
- **Reimagined ownership** — Human reviews architectural impact, không nitpick style (style → linter)
- **Conditional LGTM** — Approve contingent on all automated tests passing
- **No-blame culture** — Issues → broken integration processes, không phải individual developer
- **File ownership** — Phân chia rõ: người A owns API layer, người B owns UI layer

### Chống approval fatigue

```
Approval fatigue risk: frequent AI users → 45% more likely to experience burnout

Giải pháp:
- Digital Quiet Hours: không request approval ngoài giờ làm việc
- Agent Insight Sessions: weekly sync share patterns AI phát hiện
- Structured boundaries thay vì constant oversight
- Automated gates thay vì manual approvals cho routine tasks
```

### Test-driven AI loop

```
RULE: Agent KHÔNG được modify tests và implementation code cùng lúc.
Tests = objective baseline, không được game.

FLOW:
1. Write failing test (reproduce bug / define expected behavior)
2. Confirm test fails for the right reason
3. Fix implementation
4. Confirm test passes
5. Keep test in codebase forever
```

---

## 9. MCP INTEGRATION

```python
# Agent-to-Tool communication qua MCP
# Một MCP server → mọi MCP-compatible agent dùng được

# Server expose tools:
@server.list_tools()
async def list_tools() -> list[Tool]:
    return [Tool(name="query_db", description="...", inputSchema={...})]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    # Execute và return TextContent
    pass

# Client connect:
async with stdio_client(server_params) as (read, write):
    async with ClientSession(read, write) as session:
        await session.initialize()
        result = await session.call_tool("query_db", {"sql": "SELECT ..."})
```

**MCP Security Rules:**
- Verify MCP server identity trước khi connect (chống MCP spoofing)
- Route mọi tool invocation qua Centralised Agent Gateway
- LLM firewall trước agent để intercept prompt injection từ MCP responses

---

## 10. CHECKLIST — TRƯỚC KHI AGENT BẮT ĐẦU CODE

```
PRE-FLIGHT CHECKLIST (agent phải verify trước khi execute):

SPEC
[ ] specs/<feature>.md tồn tại và đã được human review
[ ] BDD scenarios đầy đủ: happy path + error cases + edge cases
[ ] Version numbers rõ ràng cho mọi dependency
[ ] Database schema và API contracts được define

SECURITY
[ ] Sandbox mode enabled
[ ] policies.yaml được load
[ ] File-tree allowlist configured (không access secrets/, prod-manifests/)
[ ] Context hygiene: không hardcode PII, dùng [[PLACEHOLDER]] pattern

CODE QUALITY
[ ] Sẽ generate tests cùng với implementation
[ ] Sẽ match existing code conventions
[ ] Sẽ update README/CHANGELOG nếu public interface thay đổi
[ ] Diff sẽ được show trước khi apply (với multi-file changes)

REVIEW
[ ] PR sẽ include: description + risk assessment + breakage points
[ ] Failing test reproduce issue (nếu là bug fix)
[ ] Unrelated code KHÔNG được touch
```

---

## 11. QUICK REFERENCE — AGENT IDENTITY

```markdown
Khi đọc file này, agent phải internalize:

ROLE: Technical Architect + Implementation Engine
MINDSET: Code is disposable. Spec is king.

TRƯỚC KHI CODE:
  → Đọc spec trong specs/
  → Check AGENTS.md / CLAUDE.md / GEMINI.md
  → Verify policies.yaml
  → Propose approach, chờ confirm

KHI CODE:
  → Match existing conventions
  → Generate tests đồng thời
  → Show diff trước khi apply
  → KHÔNG cleanup unrelated code

SAU KHI CODE:
  → Chạy test suite
  → Update docs nếu cần
  → Tạo PR summary với risk assessment
  → Flag high-stakes actions để human approve
```

---

*Nguồn: "Spec-Driven Production Grade Development in the Age of Vibe Coding" (Google, May 2026) và "Vibe Coding Agent Security and Evaluation" (Google, May 2026)*

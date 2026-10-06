# ChangeScope

> **Understand what new power a software change gives the system.**

ChangeScope is a GitHub-native capability intelligence project.

Its first question is deliberately narrow:

> **When a pull request is merged, what can the software do that it could not do before?**

ChangeScope detects meaningful **capability changes** between a repository's base state and a proposed change, explains the evidence, evaluates the change against declared project boundaries, and presents a concise decision aid inside GitHub.

---

## Status

**Stage:** V0 empirical validation

**Implementation status:** Not started

**Repository:** `greenbasket-labs/ChangeScope`

The repository is intentionally starting from an empty implementation. V0 empirical validation is now underway: real GitHub pull requests are being studied before substantial code is written. See `VALIDATION.md` for recorded observations.

---

# 1. Product thesis

Modern software is increasingly assembled from:

- human-written code
- AI-generated code
- GitHub Actions
- agents
- MCP/tool integrations
- packages
- cloud SDKs
- external APIs
- deployment automation
- scripts
- infrastructure

A pull request can therefore change much more than lines of code.

It can give a system new abilities:

- access a database
- write to cloud storage
- call an external service
- execute shell commands
- deploy infrastructure
- read secrets
- modify GitHub resources
- export data
- trigger another system

Existing developer tools are generally optimized around individual concerns such as code review, security findings, dependencies, tests, or architecture.

ChangeScope focuses on a different object:

> **The capability delta of the software.**

---

# 2. Core concept: Capability Delta

For a repository state **B** (base) and a proposed state **H** (head):

`CapabilityDelta(B,H) = Capabilities(H) - Capabilities(B)`

In plain language:

> **What meaningful powers were added, removed, or materially changed?**

Example:

### Before

```text
Application
├── read PostgreSQL
├── write PostgreSQL
└── call internal API
```

### After

```text
Application
├── read PostgreSQL
├── write PostgreSQL
├── call internal API
├── call Stripe              ← NEW
├── write AWS S3             ← NEW
└── execute shell commands   ← NEW
```

ChangeScope should report:

```text
CAPABILITY DELTA: HIGH

+ External payment API access
+ Cloud storage write access
+ Shell execution

New external systems: 2
New execution paths: 1

Blast radius: HIGH
```

The product is **not** saying that the PR is bad.

It is saying that the software's power changed and giving humans evidence to decide whether that change is intended.

---

# 3. What ChangeScope is NOT

These boundaries are part of the product contract.

ChangeScope is **not**:

- a generic AI code reviewer
- a replacement for GitHub CodeQL
- a vulnerability scanner
- a dependency scanner
- an MCP marketplace
- an agent marketplace
- an agent registry
- a generic architecture diagram tool
- an AI coding assistant
- a generic PR summarizer
- a replacement for CI
- a claim that code is "secure"
- an autonomous merge authority

If a proposed feature mainly duplicates one of those categories, it must be rejected or reconsidered before implementation.

---

# 4. Primary user

The first target is:

> **Developers and small/medium engineering teams using GitHub and increasingly using AI-assisted or automated development.**

The initial product should work without requiring an enterprise security team.

The first useful moment should happen directly on a pull request.

---

# 5. First user promise

The first version should make one promise extremely well:

> **"Know what new capabilities every pull request gives your software."**

Example PR output:

```text
CHANGE SCOPE

Capability Delta
HIGH

New capabilities
+ AWS S3 WRITE
+ STRIPE API ACCESS
+ SHELL EXECUTION

Changed boundaries
⚠ payment-service → external API
⚠ worker → cloud storage

Blast radius
Data             HIGH
Infrastructure   HIGH
External systems MEDIUM
Autonomy         HIGH

Evidence
src/payments/stripe.ts
src/storage/s3.ts
.github/workflows/deploy.yml

Recommendation
REVIEW REQUIRED
```

---

# 6. Evidence-first principle

ChangeScope must **not rely on an LLM as the source of truth** for capability detection.

The core pipeline is:

```text
GitHub PR
   ↓
changed files
   ↓
parsing / static evidence
   ↓
dependency + configuration evidence
   ↓
repository history
   ↓
capability extraction
   ↓
base vs head comparison
   ↓
boundary evaluation
   ↓
blast-radius analysis
   ↓
human-readable explanation
```

AI may eventually help explain or correlate evidence.

AI must not be the only reason ChangeScope claims:

> "This repository can now do X."

Every meaningful finding should have inspectable evidence.

---

# 7. Initial capability vocabulary

The first implementation should use a small, explicit vocabulary.

### Data

- `READ_FILE`
- `WRITE_FILE`
- `READ_DATABASE`
- `WRITE_DATABASE`
- `DELETE_DATABASE`
- `READ_ENVIRONMENT`
- `READ_SECRET`

### Network

- `EXTERNAL_HTTP`
- `INTERNAL_HTTP`
- `WEBHOOK`
- `SOCKET`

### Cloud

- `AWS_READ`
- `AWS_WRITE`
- `AWS_DEPLOY`
- `GCP_READ`
- `GCP_WRITE`
- `GCP_DEPLOY`
- `AZURE_READ`
- `AZURE_WRITE`
- `AZURE_DEPLOY`

### GitHub

- `REPOSITORY_READ`
- `ISSUE_WRITE`
- `PR_WRITE`
- `PR_MERGE`
- `RELEASE_CREATE`
- `WORKFLOW_TRIGGER`

### Execution

- `SHELL_EXECUTION`
- `DOCKER_EXECUTION`
- `CI_EXECUTION`
- `DEPLOYMENT`

### Data movement

- `EXPORT_DATA`
- `UPLOAD_DATA`
- `SEND_EXTERNAL_DATA`

The vocabulary is expected to grow from observed real-world needs, not from speculative feature expansion.

---

# 8. Supported inputs for the first implementation

Start narrow:

- TypeScript / JavaScript
- Python
- GitHub Actions YAML
- `package.json`
- common lockfiles
- Dockerfiles
- common configuration files

The goal is not language coverage.

The goal is **reliable capability detection**.

More languages are added only when real repositories demonstrate demand.

---

# 9. Architecture rules

Repositories may declare intended boundaries using:

`.changescope.yml`

Example:

```yaml
rules:

  - name: no-frontend-database
    from: frontend
    deny:
      - database

  - name: payment-boundary
    from: frontend
    deny:
      - stripe

  - name: production-deploy
    capability:
      - deployment
    require:
      human_approval: true
```

Rules should initially be advisory.

ChangeScope should not silently block development.

---

# 10. Blast radius

Capability changes should be described by consequence dimensions rather than one mysterious score.

Initial dimensions:

- Data
- Infrastructure
- External systems
- Execution
- Autonomy

Possible levels:

- LOW
- MEDIUM
- HIGH
- CRITICAL

A finding should explain why it received a level.

Example:

```text
AWS_S3_WRITE

Data: HIGH
Infrastructure: MEDIUM
External systems: HIGH
Execution: LOW
Autonomy: MEDIUM
```

No score should be presented without evidence.

---

# 11. Repository history

Later versions may connect current changes to:

- ADRs
- documentation
- previous PRs
- commits
- existing architecture rules

Example:

```text
⚠ Possible architecture conflict

ADR-12:
"Payment writes must go through PaymentService."

Current PR:
frontend → Stripe directly

Evidence:
ADR-12
PR #184
src/payment/*
```

Historical intelligence is a future layer, not a reason to make V1 dependent on AI memory.

---

# 12. GitHub integration

The primary integration is a GitHub App.

Expected initial flow:

```text
Developer opens PR
        ↓
GitHub webhook
        ↓
ChangeScope receives PR metadata
        ↓
Compare base and head
        ↓
Analyze changed/relevant files
        ↓
Calculate Capability Delta
        ↓
Publish GitHub check / concise PR result
```

The first app should request the minimum permissions necessary.

It should prefer read access to repository contents and metadata and narrowly scoped ability to publish checks/results.

---

# 13. Privacy principle

For private repositories:

> **Do not retain source code unless there is a clear product requirement.**

Prefer:

```text
GitHub
 ↓
fetch relevant content
 ↓
analyze
 ↓
store capability facts / evidence references
 ↓
discard unnecessary source
```

Long-term storage should favor:

- capability facts
- commit SHA
- file/path evidence
- rule results
- analysis metadata

rather than full source code.

This is a product principle, not merely an implementation detail.

---

# 14. Repository structure

The intended structure is:

```text
ChangeScope/
├── README.md
├── SPEC.md
├── .changescope.yml.example
├── packages/
│   ├── capability-core/
│   ├── parser/
│   └── github/
├── apps/
│   └── github-app/
└── tests/
    └── fixtures/
```

### Responsibilities

**`packages/capability-core/`**

The domain model and capability reasoning.

This package must not depend on GitHub-specific APIs.

**`packages/parser/`**

Extract evidence from supported source/configuration formats.

**`packages/github/`**

GitHub-specific adapters and data retrieval.

**`apps/github-app/`**

The GitHub App boundary: webhooks, checks, configuration and presentation.

**`tests/fixtures/`**

Small representative repositories/files used to prove capability detection.

---

# 15. Source-of-truth hierarchy

This project must follow a strict hierarchy:

### 1. `SPEC.md`

**Normative engineering specification.**

If implementation disagrees with SPEC.md, the implementation is wrong unless the specification is intentionally changed.

### 2. `README.md`

**Public product contract and project guide.**

It explains the same rules in accessible form and must not contradict SPEC.md.

### 3. Tests

**Executable evidence of the specification.**

Tests prove behavior.

### 4. Implementation

**The current realization of the specification.**

Code does not redefine the product by accident.

### 5. Issues / discussions

**Proposals only.**

An issue does not change the product contract until the relevant specification is intentionally updated.

---

# 16. Development rule

Every meaningful feature follows:

```text
PROPOSE
   ↓
REVIEW
   ↓
APPROVE
   ↓
SPECIFY
   ↓
IMPLEMENT
   ↓
TEST
   ↓
VALIDATE
   ↓
FREEZE
   ↓
NEXT
```

No feature should enter the codebase merely because it sounds useful.

---

# 17. Validation before implementation

Before substantial implementation:

1. Inspect real GitHub repositories.
2. Study real pull requests.
3. Identify genuine capability-changing changes.
4. Test whether the proposed model detects them.
5. Compare against existing products.
6. Kill overlapping ideas.
7. Record findings.
8. Only then expand the implementation.

The first validation target is approximately **50–100 real public repositories**, with a smaller manually reviewed sample used for detailed analysis.

The purpose is not to manufacture a benchmark that makes ChangeScope look good.

The purpose is to discover whether the problem is real.

---

# 18. V0 validation questions

Before V1 is considered successful, we must answer:

### Detection

Can ChangeScope reliably detect meaningful capability changes?

### Precision

Does it avoid flooding developers with trivial findings?

### Evidence

Can a developer understand why a capability was detected?

### Novelty

Is the product materially different from existing GitHub/security/agent tooling?

### Usefulness

Does the result change a developer's decision?

### Retention

Would a developer keep it installed after trying it?

The strongest validation signal is:

> **"I didn't realize this PR gave the application that capability."**

---

# 19. Version roadmap

## V0 — Capability Detector

Input:

> repository / changed files

Output:

> detected capabilities + evidence

---

## V1 — Capability Delta

Input:

> base + PR head

Output:

> added / removed / materially changed capabilities

---

## V2 — Boundary Intelligence

Input:

> Capability Delta + repository rules

Output:

> boundary changes and policy conflicts

---

## V3 — Historical Intelligence

Input:

> current change + repository history

Output:

> relevant previous decisions and possible conflicts

---

## V4 — Impact Intelligence

Input:

> capability change + repository graph

Output:

> affected systems and blast radius

---

## V5 — Decision Intelligence

Input:

> all evidence

Output:

> explainable recommendation:

- review
- acceptable
- exceptional
- blocked by policy

The recommendation must remain explainable.

---

## V6 — Organization Capability Map

Across repositories:

> What can our software currently access, modify, execute or trigger?

---

# 20. Non-goals

The project must resist these temptations unless the specification is deliberately changed:

- becoming a general-purpose AI platform
- becoming an agent marketplace
- becoming an MCP marketplace
- becoming a security company
- replacing CodeQL
- replacing GitHub Actions
- replacing CI
- generating code
- automatically approving arbitrary PRs
- collecting repository source unnecessarily
- adding AI merely because AI is fashionable
- building dashboards before the core detection works

---

# 21. Design principles

### Evidence over opinion

Every meaningful result should be traceable.

### Capability over code volume

Ten changed lines can introduce more power than 10,000 refactoring lines.

### Delta over snapshot

The first question is what changed, not merely what exists.

### Explain over alarm

A useful warning explains itself.

### Minimal permissions

The product should practice the security principles it recommends.

### Minimal data retention

Do not collect what the product does not need.

### Language-agnostic domain model

The capability model must not be tied to one programming language.

### GitHub-native first

The first useful experience belongs inside the pull request.

### Originality over feature count

A smaller original product is better than a large collection of copied features.

### Validation before expansion

Real repository evidence outranks assumptions.

---

# 22. What success looks like

The first successful version does **one thing extremely well**:

> A developer opens a PR and immediately understands what new power that PR gives the software.

If we achieve that reliably, everything else becomes possible.

If we cannot achieve that reliably, we do not build the larger platform.

---

# 23. Product thesis in one sentence

> **ChangeScope is a GitHub-native capability intelligence layer that shows how a proposed software change expands, reduces, or alters what the system can do.**

---

# 24. Final guardrail

**Do not implement beyond this specification without changing the specification first.**

When a new idea appears, ask:

1. Does it solve the core capability-delta problem?
2. Is the pain demonstrated by real repositories?
3. Is it materially different from existing tools?
4. Can it be explained with evidence?
5. Does it preserve ChangeScope's boundaries?
6. Is it necessary now?

If the answer is no, defer or reject it.

**The specification is the guard.**


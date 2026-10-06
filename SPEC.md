# ChangeScope Specification

**Status:** Normative  
**Version:** 0.2.0  
**Scope:** Product, domain model, behavior and architectural boundaries

> This document is the engineering source of truth for ChangeScope.

If implementation, README text, or an issue conflicts with this document, this document wins until deliberately amended.

---

# 1. Purpose

ChangeScope determines how a proposed repository change alters the **capabilities of the resulting software system**.

The first supported workflow is a GitHub pull request.

The system compares:

- a base repository state, and
- a proposed head state.

It identifies meaningful capability additions, removals and material changes, associates each finding with evidence, evaluates declared repository boundaries, and produces an explainable result.

ChangeScope does not decide whether a developer is good or whether code is generally high quality.

It analyzes **system capability change**.

---

# 2. Core definition

Let:

- `B` = base repository state
- `H` = proposed head repository state
- `C(S)` = normalized capability set derived from repository state `S`

Then:

```
CapabilityDelta(B,H) = C(H) - C(B)
```

The implementation must also be able to report:

- capabilities removed
- capabilities whose properties materially changed
- evidence supporting each result

A capability is not merely a library name.

A capability describes a meaningful power or access path available to the software.

---

# 3. Capability requirements

Every capability record MUST contain:

- stable capability identifier
- capability category
- normalized capability name
- state: added / removed / changed / unchanged
- evidence references
- confidence/evidence quality information
- affected scope where known

Example conceptual record:

```json
{
  "id": "AWS_S3_WRITE",
  "category": "cloud",
  "state": "added",
  "evidence": [
    {
      "path": "src/storage/s3.ts",
      "reason": "S3 PutObject operation detected"
    }
  ]
}
```

The exact implementation type may evolve, but these semantics must remain.

---

# 4. Capability categories

The initial vocabulary is intentionally limited.

## 4.1 Data

- `READ_FILE`
- `WRITE_FILE`
- `READ_DATABASE`
- `WRITE_DATABASE`
- `DELETE_DATABASE`
- `READ_ENVIRONMENT`
- `READ_SECRET`

## 4.2 Network

- `EXTERNAL_HTTP`
- `INTERNAL_HTTP`
- `WEBHOOK`
- `SOCKET`

## 4.3 Cloud

- `AWS_READ`
- `AWS_WRITE`
- `AWS_DEPLOY`
- `GCP_READ`
- `GCP_WRITE`
- `GCP_DEPLOY`
- `AZURE_READ`
- `AZURE_WRITE`
- `AZURE_DEPLOY`

## 4.4 GitHub

- `REPOSITORY_READ`
- `REPOSITORY_WRITE`
- `ISSUE_WRITE`
- `PR_WRITE`
- `PR_MERGE`
- `RELEASE_CREATE`
- `WORKFLOW_TRIGGER`

## 4.5 Execution

- `SHELL_EXECUTION`
- `DOCKER_EXECUTION`
- `CI_EXECUTION`
- `DEPLOYMENT`

## 4.6 Data movement

- `EXPORT_DATA`
- `UPLOAD_DATA`
- `SEND_EXTERNAL_DATA`

New capabilities require a demonstrated need or validation evidence. Do not expand the vocabulary speculatively.

---

# 5. Evidence model

A capability finding MUST be explainable by one or more inspectable evidence records.

The evidence layer answers:

> **What observable repository fact supports this finding?**

The capability layer answers:

> **What system capability does that evidence represent?**

These are separate responsibilities.

## 5.1 Evidence record

The normative evidence record contains:

- stable evidence identifier
- repository-relative path or artifact identifier
- source kind
- location when available
- observed pattern or normalized fact
- candidate capability or capability transition when known
- detector identifier
- confidence
- evidence quality
- concise explanation

Conceptual form:

```json
{
  "id": "ev_001",
  "path": ".github/workflows/publish.yml",
  "kind": "permission",
  "location": {"startLine": 5, "endLine": 5},
  "pattern": "contents: write",
  "capability": "REPOSITORY_WRITE",
  "detector": "github-actions.permissions",
  "confidence": "HIGH",
  "quality": "DIRECT",
  "explanation": "Workflow grants GITHUB_TOKEN write access to repository contents."
}
```

The exact serialization may evolve, but the semantics are normative.

## 5.2 Evidence kinds

Initial evidence kinds are:

- `source`
- `ast_pattern`
- `import`
- `call`
- `configuration`
- `dependency`
- `lockfile`
- `dockerfile`
- `permission`
- `secret_reference`
- `command`
- `infrastructure`
- `history`
- `rule`

New evidence kinds should be added only when real validation requires them.

## 5.3 Location

Evidence SHOULD include a precise source location whenever the artifact supports one:

- start line
- end line
- optionally start/end column

For structured artifacts without stable line information, the evidence may identify the relevant key, field, or artifact path instead.

A finding without a precise location MAY be valid when the underlying artifact itself is the evidence, but the result must explain why.

## 5.4 Evidence quality

Initial evidence quality levels are:

- `DIRECT`: the observed fact directly expresses the relevant capability, such as a permission, explicit command, or known API operation.
- `STRONG`: the observed fact strongly indicates the capability but requires a small amount of interpretation, such as a known SDK abstraction.
- `INDIRECT`: the fact is relevant but does not independently establish the capability.
- `AMBIGUOUS`: multiple plausible interpretations remain.

Evidence quality MUST NOT be silently upgraded by an LLM.

## 5.5 Confidence

Confidence describes the detector's conclusion from the available evidence:

- `HIGH`
- `MEDIUM`
- `LOW`

Confidence is not a security guarantee and MUST be explainable from the evidence records.

## 5.6 Evidence rules

The following are normative:

1. A PR title, commit message, filename, or prose description alone MUST NOT establish a capability.
2. An LLM response alone MUST NOT establish a capability.
3. Capability findings MUST reference their supporting evidence records.
4. Evidence MUST be inspectable by a human from the repository artifact and location where possible.
5. A detector MUST NOT claim provider-specific capability from generic protocol syntax alone. For example, an S3-compatible URL does not by itself prove AWS access.
6. A permission that grants a broader access level MUST be represented by the actual permission semantics, not by a guessed downstream action. For example, GitHub Actions `contents: write` is repository-content write access; it MUST NOT be normalized to `PR_WRITE` unless separate evidence establishes pull-request write capability.
7. A write permission includes read access at the GitHub Actions permission level, but the delta MUST report the materially new write capability rather than duplicating an already-present read capability.
8. Evidence records SHOULD preserve commit SHA or equivalent repository version context when stored outside the analyzed run.

An LLM may summarize, correlate, or explain existing evidence, but it remains downstream of the evidence layer.

---

# 6. Base/head analysis

For pull requests, ChangeScope MUST analyze the difference between the base and head states.

It SHOULD avoid analyzing the entire repository unnecessarily.

The initial implementation should prioritize:

1. changed files
2. directly affected configuration
3. relevant dependency manifests
4. relevant neighboring files
5. repository rules

Broader repository analysis can be introduced when necessary to avoid false conclusions.

---

# 7. Capability states

Each detected capability may have one of these states:

### Added

Capability exists in head but not base.

### Removed

Capability exists in base but not head.

### Changed

Capability exists in both, but a material property changed.

Examples:

- read → write
- internal → external
- staging → production
- no deployment → deployment
- scoped access → broader access

### Unchanged

Present in both with no material change.

Unchanged capabilities generally should not dominate PR output.

---

# 8. Materiality

ChangeScope must prioritize changes that alter real system power.

Examples of material changes:

```
database READ → database WRITE
internal API → external API
no cloud access → cloud WRITE
manual deployment → autonomous deployment
read-only GitHub token → merge-capable token
local file access → production filesystem access
```

Examples that are usually non-material:

- formatting
- variable renaming
- comments
- documentation-only changes
- pure refactoring with no capability change

The implementation must avoid treating code volume as capability importance.

---

# 9. Capability graph

The domain model should support a graph representation.

Nodes may represent:

- application/module
- capability
- data store
- external service
- cloud service
- execution environment
- repository automation

Edges may represent:

- READ
- WRITE
- CALL
- EXECUTE
- DEPLOY
- TRIGGER
- EXPORT
- SEND

The graph is an internal model first.

A visual graph UI is not required for V1.

---

# 10. Blast radius

ChangeScope may calculate consequence dimensions:

- data
- infrastructure
- external systems
- execution
- autonomy

Each dimension may be:

- LOW
- MEDIUM
- HIGH
- CRITICAL

A blast-radius result MUST have explainable inputs.

The system must not expose a single unexplained numerical risk score as the primary result.

---

# 11. Repository rules

A repository may contain:

`.changescope.yml`

Rules are advisory in the first implementation.

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

The schema may evolve, but rules must remain:

- explicit
- reviewable
- deterministic where possible
- repository-local
- version controlled

---

# 12. Rule behavior

A rule violation must identify:

- rule name
- detected capability/path
- relevant evidence
- affected files or scope
- recommended action

Example:

```
Rule:
payment-boundary

Violation:
frontend → Stripe

Evidence:
src/frontend/checkout.ts:42

Recommendation:
route payment operations through PaymentService
```

ChangeScope should not automatically modify code.

---

# 13. GitHub integration

The first product surface is a GitHub App.

Expected lifecycle:

```
pull_request event
      ↓
identify base/head
      ↓
collect relevant repository content
      ↓
parse evidence
      ↓
derive base capabilities
      ↓
derive head capabilities
      ↓
calculate delta
      ↓
evaluate rules
      ↓
calculate blast radius
      ↓
publish GitHub check/result
```

The GitHub adapter must remain separate from the capability domain model.

---

# 14. Domain isolation

`packages/capability-core/` MUST NOT depend on GitHub APIs.

The core model must be usable with:

- a local repository
- a future Git provider
- tests
- offline analysis

GitHub is the first adapter, not the definition of the domain.

---

# 15. Parser boundary

`packages/parser/` converts repository artifacts into evidence.

It should not make product-level decisions.

Conceptually:

```
Parser
  ↓
Evidence
  ↓
Capability Core
  ↓
Capability
```

This separation prevents language-specific parsing logic from becoming the product's decision engine.

---

# 16. Initial supported technologies

The initial parser scope is:

- TypeScript
- JavaScript
- Python
- GitHub Actions YAML
- package.json
- common lockfiles
- Dockerfiles
- common configuration formats

Support for additional technologies requires evidence from real repositories or a clear product requirement.

---

# 17. AI boundary

AI is optional to the core detector.

Permitted AI uses:

- explain findings in natural language
- correlate evidence
- summarize historical decisions
- help produce human-readable reports

Not permitted as the sole mechanism for:

- deciding that a capability exists
- assigning arbitrary permissions
- claiming a security guarantee
- blocking a PR without deterministic/evidence-backed reason

The system must degrade gracefully when no AI model is available.

---

# 18. Privacy

The system should minimize source retention.

Preferred model:

```
retrieve
→ analyze
→ store normalized facts
→ discard unnecessary source
```

Stored evidence SHOULD reference:

- repository
- commit SHA
- path
- line/range when available
- rule
- detector

Private source code should not be retained merely for convenience.

---

# 19. Security

ChangeScope must follow least privilege.

The GitHub integration should request only permissions necessary for:

- reading repository metadata
- reading relevant contents
- receiving pull-request events
- publishing analysis results

It should not request broad write permissions unless a future feature has a documented requirement.

---

# 20. Output contract

The first PR result should answer four questions:

### 1. What changed?

Capability additions/removals/material changes.

### 2. Why do you believe that?

Evidence.

### 3. What boundary or system could be affected?

Blast radius and rule context.

### 4. What should the developer do?

A concise recommendation.

Example:

```
CAPABILITY DELTA: HIGH

NEW
+ AWS_S3_WRITE
+ EXTERNAL_HTTP

EVIDENCE
src/storage/s3.ts
src/payment/client.ts

BOUNDARY
payment-service → external network

BLAST RADIUS
Data: HIGH
External systems: HIGH

RECOMMENDATION
REVIEW REQUIRED
```

---

# 21. Severity semantics

Severity must describe capability significance, not code quality.

### LOW

No meaningful expansion of system power.

### MEDIUM

Meaningful new capability with limited scope.

### HIGH

Capability materially expands access, execution, data movement, infrastructure or external-system interaction.

### CRITICAL

Capability creates or materially expands high-consequence access such as production deployment, broad data access, destructive operations, or equivalent organization-defined boundaries.

Severity rules must remain explainable.

---

# 22. False-positive policy

False positives are a primary product risk.

The system should prefer:

> "Possible new external network capability detected."

over:

> "This application is now insecure."

When evidence is incomplete, state the uncertainty.

Never manufacture certainty.

---

# 23. Tests

Tests must be fixture-driven where possible.

Each fixture should demonstrate:

- repository input
- expected capabilities
- expected delta
- expected evidence
- expected rule result where applicable

Example:

```
tests/fixtures/
  stripe-added/
  s3-write-added/
  shell-added/
  no-capability-change/
  database-read-to-write/
```

A test is not merely a unit test of implementation.

It is executable evidence of product behavior.

---

# 24. Validation protocol

Before declaring V1:

1. Select 50–100 real public GitHub repositories.
2. Select representative pull requests.
3. Manually identify capability-changing PRs.
4. Run ChangeScope.
5. Compare detected results with manual findings.
6. Record false positives and false negatives.
7. Compare the product behavior against existing GitHub and third-party tools.
8. Remove or redesign overlapping functionality.
9. Document results.
10. Only then expand the product.

Validation must be empirical.

---

# 25. Non-goals

The following are explicitly outside the initial scope:

- generic AI code review
- code generation
- autonomous PR merging
- MCP marketplace
- agent marketplace
- tool directory
- general vulnerability scanner
- dependency scanner
- generic SAST replacement
- generic CI platform
- full enterprise governance suite
- source-code storage platform
- general project-management tool

---

# 26. Source-of-truth hierarchy

Order of authority:

1. `SPEC.md`
2. tests
3. `README.md`
4. implementation
5. issues/discussions

If implementation and specification disagree:

> Stop and resolve the specification first.

If a feature is not specified:

> It is not automatically approved.

---

# 27. Change control

A change to this specification MUST include:

- reason
- problem evidence
- affected scope
- compatibility consideration
- implementation impact
- test plan

Major product changes should be reviewed before implementation.

---

## 27.1 Evidence-model amendment record

This 0.2.0 amendment was made before implementing capability-core.

**Reason:** the repository had fixture evidence but the specification did not define a sufficiently precise, inspectable evidence record.

**Problem evidence:** validation fixtures already use imports, calls, permissions, configuration, and infrastructure as evidence, while some fixture expectations were too coarse. In particular, the GitHub Actions `contents: write` fixture incorrectly mapped repository-content write permission to `PR_WRITE`.

**Affected scope:** evidence records, initial GitHub capability vocabulary, fixture expectations, and capability-core domain types. No GitHub App or parser behavior is introduced by this amendment.

**Compatibility:** existing capability states and categories remain valid. The vocabulary gains `REPOSITORY_WRITE`; existing consumers of `REPOSITORY_READ` remain valid.

**Implementation impact:** capability-core will model evidence as first-class data and will not depend on GitHub APIs or parser implementations.

**Test plan:** update the affected fixture and add deterministic domain tests for evidence validation, capability records, and base/head delta behavior.

# 28. Development sequence

```
PROPOSE
  ↓
REVIEW
  ↓
APPROVE
  ↓
UPDATE SPEC IF NEEDED
  ↓
IMPLEMENT
  ↓
TEST
  ↓
REAL-REPOSITORY VALIDATION
  ↓
FREEZE
```

Skipping specification because a feature is "small" is discouraged when the feature changes product behavior or boundaries.

---

# 29. Definition of V0

V0 is complete when:

- repository structure exists
- capability vocabulary exists
- capability evidence model exists
- representative fixtures exist
- base/head delta model is defined
- README and SPEC agree
- no major implementation is built on unvalidated assumptions

---

# 30. Definition of V1

V1 is complete only when:

- GitHub PRs can be analyzed
- supported capability changes are detected
- evidence is shown
- capability delta is calculated
- basic rules work
- output appears in GitHub
- false-positive behavior has been evaluated on real repositories
- the result is useful enough that developers understand what new power a PR introduces

---

# 31. Ultimate product direction

The long-term system may evolve from:

```
PR capability detection
        ↓
capability delta
        ↓
boundary intelligence
        ↓
historical decision context
        ↓
impact intelligence
        ↓
repository capability map
        ↓
organization capability intelligence
```

But future layers must not be assumed to exist until the preceding layer is useful.

---

# 32. Final guardrail

The project exists to answer one question first:

> **What new capability does this software change introduce?**

Everything else is subordinate.

If a proposed feature does not strengthen that mission, it should be deferred or rejected unless this specification is deliberately changed.

**Build the smallest evidence-backed capability intelligence system first.**

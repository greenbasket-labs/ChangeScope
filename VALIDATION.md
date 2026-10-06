# ChangeScope V0 Validation Log\n\n**Status:** Initial empirical validation  \n**Purpose:** Test whether real GitHub pull requests contain meaningful capability changes that can be represented as a Capability Delta.\n\n> This document is evidence, not product specification. It does not override `SPEC.md`.\n\n---\n\n## 1. What we are testing\n\nThe core hypothesis is:\n\n> A meaningful number of real pull requests change what a software system can access, execute, trigger, modify, or communicate with, and that change is not adequately expressed by ordinary line-level diff summaries.\n\nThe first validation question is **not** whether developers will pay.\n\nIt is:\n\n> Can we observe the problem clearly in real repositories, and can we describe it consistently without merely duplicating security scanning or code review?\n\n---\n\n## 2. Initial sample\n\nThe first sample was selected from real public GitHub pull requests covering several capability-changing patterns:\n\n| Repository | PR | Change observed | Candidate capability |\n|---|---:|---|---|\n| GenerateNU/tomoji | #73 | Private media uploads through AWS S3; new S3 presigning and storage paths | `AWS_WRITE`, `UPLOAD_DATA`, `EXTERNAL_HTTP` |\n| getsentry/sentry-python | #7888 | New S3 extension / cloud integration | `AWS_READ` / `AWS_WRITE` depending on implementation path |\n| Skittels05/FoodService | #49 | Stripe payment integration | `EXTERNAL_HTTP`, payment-provider access |\n| padoa/vault-secrets-operator | #28 | GitHub Actions workflow permissions explicitly changed, including `contents: write` where required | `WORKFLOW_TRIGGER`, repository write capability |\n| aws/agentcore-cli | #2548 | Interactive shell capability added to the AgentCore CLI | `SHELL_EXECUTION` |\n\nThese are deliberately different types of change. The purpose is to test whether the same capability model can describe them.\n\n---\n\n## 3. Observation: S3/media integration\n\n**Repository:** GenerateNU/tomoji  \n**PR:** #73  \n**URL:** https://github.com/GenerateNU/tomoji/pull/73\n\nThe PR introduces AWS S3 request-presigning and new media upload/read/write paths.\n\nThe important product observation is not simply:\n\n> A new dependency was added.\n\nThe meaningful system change is:\n\n> The application gains a new cloud-storage interaction path, including uploads and signed access.\n\nA useful ChangeScope representation is therefore:\n\n```text\nNEW\n+ AWS S3 interaction\n+ cloud object upload\n+ external data movement\n\nPotential consequence:\napplication data can now leave the application boundary\nand be stored in an external cloud service.\n```\n\nThis is exactly the type of distinction the Capability Delta model is intended to capture.\n\n---\n\n## 4. Observation: GitHub Actions permissions\n\n**Repository:** padoa/vault-secrets-operator  \n**PR:** #28  \n**URL:** https://github.com/padoa/vault-secrets-operator/pull/28\n\nThe PR adds explicit GitHub Actions permissions. Some workflows receive `contents: read`; the Helm workflow requires `contents: write`.\n\nThe code change is small.\n\nThe capability change can be significant.\n\n```text\nBEFORE\nworkflow token permissions inherited / less explicit\n\nAFTER\nworkflow explicitly receives:\ncontents: write\n```\n\nThis demonstrates an important property of the idea:\n\n> **Capability magnitude is not proportional to diff size.**\n\nA small YAML change can materially alter what automation is permitted to do.\n\nThis is a strong candidate for ChangeScope because the relevant object is the **power granted to the workflow**, not the number of changed lines.\n\n---\n\n## 5. Observation: interactive shell capability\n\n**Repository:** aws/agentcore-cli  \n**PR:** #2548  \n**URL:** https://github.com/aws/agentcore-cli/pull/2548\n\nThe PR adds interactive shell support to an AgentCore harness.\n\nThe meaningful capability is:\n\n```text\nNEW\n+ SHELL_EXECUTION\n```\n\nThis is especially relevant to ChangeScope's future because AI/agent systems can turn a capability such as shell execution into a much larger action surface.\n\nThe important question for ChangeScope is not whether shell support is bad.\n\nIt is:\n\n> **What new execution power entered the system, where can it be reached from, and what existing boundary does it cross?**\n\n---\n\n## 6. Observation: external payment integration\n\n**Repository:** Skittels05/FoodService  \n**PR:** #49  \n**URL:** https://github.com/Skittels05/FoodService/pull/49\n\nThe PR adds Stripe payment integration.\n\nThe capability representation is:\n\n```text\nNEW\n+ EXTERNAL_HTTP\n+ PAYMENT_PROVIDER_ACCESS\n```\n\nThe product should eventually be able to distinguish this from an ordinary external API call because payment-provider access has materially different consequences.\n\nThis points toward a future rule:\n\n> Capability categories should remain general enough for the core engine, while repository policies can attach organization-specific importance.\n\n---\n\n## 7. Initial finding: capability changes are real\n\nThe sample provides multiple concrete forms:\n\n```text\nCloud storage\n      ↓\nAWS capability\n\nPayment integration\n      ↓\nExternal financial capability\n\nWorkflow permissions\n      ↓\nAutomation privilege\n\nInteractive shell\n      ↓\nExecution capability\n```\n\nThese are all ordinary software-development changes.\n\nThey can be represented using a common abstraction:\n\n> **The resulting system has a different set of powers than the base system.**\n\nThis supports continuing the V0 investigation.\n\nIt does **not** yet prove product-market fit.\n\n---\n\n## 8. Important distinction from existing GitHub review\n\nGitHub's pull-request experience already provides:\n\n- Conversation\n- Commits\n- Checks\n- Files changed\n- Findings\n- merge requirements\n\nGitHub also has agentic Copilot code review capabilities that gather broader project context. Therefore ChangeScope must not become a generic "better PR summary" or generic code reviewer.\n\nThe differentiation being tested is:\n\n```text\nTraditional review:\n"What changed in the code?"\n\nChangeScope:\n"What new power does the resulting software have?"\n```\n\nThe second question must remain the center of the product.\n\n---\n\n## 9. What we need to test next\n\nThe first five examples are only a starting point.\n\nNext validation should deliberately seek:\n\n### Capability additions\n\n- database access\n- secret access\n- cloud deployment\n- external APIs\n- file-system access\n- shell execution\n- GitHub write permissions\n- data export\n- webhooks\n- container execution\n\n### Capability reductions\n\n- removing credentials\n- removing external access\n- read/write → read-only\n- removing deployment paths\n\n### Material changes\n\n- staging → production\n- internal → external\n- read → write\n- manual → autonomous\n- narrow → broad permission\n\n### Negative cases\n\nWe must also collect PRs where:\n\n- thousands of lines change but capabilities do not\n- dependencies are upgraded without new capability\n- documentation changes only\n- pure refactoring occurs\n\nThese negative cases are essential.\n\nIf ChangeScope flags everything, the product fails.\n\n---\n\n## 10. Validation scorecard\n\nFor each sampled PR we should record:\n\n| Dimension | Question |\n|---|---|\n| Capability exists | Did the PR actually change system capability? |\n| Detectability | Can evidence reveal it without guessing? |\n| Delta | Can we distinguish base from head? |\n| Materiality | Does the capability matter? |\n| Evidence | Can the result point to why? |\n| Boundary | Is there an architectural/policy consequence? |\n| Existing coverage | Is this already solved adequately elsewhere? |\n| User value | Would a developer make a different decision? |\n\n---\n\n## 11. Current conclusion\n\n### Supported\n\n**The underlying phenomenon is real.**\n\nReal PRs can introduce substantial new system capabilities through relatively small or ordinary code/configuration changes.\n\n### Not yet proven\n\nWe have **not** yet proven:\n\n- that developers want a standalone product for this\n- that existing GitHub features cannot adequately expose it\n- that our detection can reach high precision\n- that the capability vocabulary generalizes well\n- that developers would install and retain the GitHub App\n\nTherefore:\n\n> **Do not build the full product yet. Continue validation.**\n\n---\n\n## 12. V0 exit condition\n\nV0 should not end because we have inspected enough repositories.\n\nIt ends when we can answer:\n\n1. How frequently do meaningful capability changes occur?\n2. Which capability categories occur most often?\n3. Which are currently difficult for developers to see?\n4. Which existing GitHub features already solve parts of the problem?\n5. Can ChangeScope detect the difference with strong precision?\n6. Do developers understand the output?\n7. Does the output influence a real review decision?\n\nOnly then should V1 implementation begin.\n\n---\n\n## 13. Guardrail\n\nDo not convert observations in this document into product features automatically.\n\nThe flow remains:\n\n```text\nOBSERVATION\n    ↓\nPROPOSAL\n    ↓\nSPEC REVIEW\n    ↓\nSPEC CHANGE (if necessary)\n    ↓\nIMPLEMENTATION\n```\n\n`SPEC.md` remains authoritative.

---

## 14. Second validation batch

Additional real PRs reinforce the range of capability-changing patterns.

### AWS deployment workflow

**Repository:** thecourseforum/theCourseForum2  
**PR:** #1310  
**URL:** https://github.com/thecourseforum/theCourseForum2/pull/1310

The PR introduces/changes AWS deployment infrastructure and a GitHub Actions deployment path. The diff includes:

- AWS OIDC permission via `id-token: write`
- AWS credential assumption
- ECR login
- image publishing
- ECS task definition changes
- production deployment execution

A useful capability representation is:

```text
NEW / MATERIAL CHANGE
+ AWS_DEPLOY
+ CI_EXECUTION
+ CLOUD_WRITE
+ PRODUCTION_DEPLOYMENT
```

This is an especially strong example because the capability change is spread across workflow configuration and infrastructure rather than one application function.

### Database integration candidate

**Repository:** kalviumcommunity/Backend-Web-Development  
**PR:** #329  
**URL:** https://github.com/kalviumcommunity/Backend-Web-Development/pull/329

The search result describes the PR as a database integration, but inspection of the returned diff showed substantial unrelated training/repository changes rather than a clean database-capability example.

**Validation lesson:** search-result titles are not sufficient evidence. ChangeScope must inspect the actual patch before assigning a capability.

This is exactly why evidence-first detection is required.

### Refactor candidate

**Repository:** mupen64/mupen64-rr-lua  
**PR:** #1067  
**URL:** https://github.com/mupen64/mupen64-rr-lua/pull/1067

The PR is explicitly described as a general Lua refactor. Its patch reorganizes Lua-related classes, helpers and managers.

This is a useful negative-case candidate:

> Large architectural-looking refactors must not automatically become capability changes.

The detector must distinguish **structural reorganization** from **new system power**.

---

## 15. Stronger V0 hypothesis

The evidence now suggests a more precise hypothesis:

> **Capability changes frequently occur through configuration, permissions, integrations, infrastructure and automation—not only through application code.**

Therefore ChangeScope cannot be a source-code-only analyzer.

Its initial evidence model must include:

```
source code
+
configuration
+
dependencies
+
GitHub Actions
+
infrastructure
+
permissions
```

This strengthens the case for a repository-level Capability Delta rather than a traditional code-review product.

---

## 16. New guardrail: no title-based detection

A PR title such as:

```
"add AWS integration"
```

is not evidence.

A PR title such as:

```
"refactor"
```

is not evidence either.

Capability findings MUST be derived from the repository state/diff and supporting evidence.

PR descriptions can provide context, but cannot alone establish a capability.

---

## 17. New validation priority

The next sample should intentionally contain:

### High-value capability changes

- read → write
- internal → external
- no cloud → cloud write
- no deployment → deployment
- no shell → shell
- no secret access → secret access
- no database → database
- manual → automated deployment

### Large non-capability changes

- refactors
- dependency sweeps
- generated documentation
- formatting
- test additions
- code movement
- renames

### Ambiguous cases

- SDK upgrades
- framework migrations
- infrastructure refactors
- permission tightening
- new abstractions

The ambiguous cases are especially valuable because they will define the limits of the detector.

---

## 18. Current V0 status

**Problem phenomenon:** supported by initial evidence.

**Common capability patterns:** beginning to emerge.

**Evidence-first requirement:** confirmed as necessary.

**Source-code-only model:** rejected.

**Title/description-only model:** rejected.

**Product-market fit:** not tested.

**Implementation:** still intentionally deferred.

**Next step:** expand the empirical sample and build a small fixture corpus from the observed patterns.


---

## 19. Third validation batch: permissions, deployment, external storage, and negative cases

The next sample was chosen to test whether the emerging model survives outside the first examples.

### Deployment permission grant

**Repository:** davidcollom/vcc-ical  
**PR:** #74  
**URL:** https://github.com/davidcollom/vcc-ical/pull/74

The inspected patch adds:

```yaml
permissions:
  contents: read
  deployments: write
```

The important observation is that this is not application logic. It changes the authority of the GitHub Actions workflow.

Candidate representation:

```text
ADDED / MATERIAL
+ REPOSITORY_READ
+ DEPLOYMENT_WRITE
```

The exact capability vocabulary should remain aligned with `SPEC.md`; the validation result here is the evidence pattern: a three-line workflow change can create a meaningful automation privilege.

### Production deployment path

**Repository:** Patheya-express/patheya-express-platform  
**PR:** #28  
**URL:** https://github.com/Patheya-express/patheya-express-platform/pull/28

The inspected patch adds a production ECS deployment workflow. Evidence includes:

- `id-token: write`
- AWS OIDC role assumption
- ECR login
- ECS task-definition revision
- migration task execution
- API and worker service updates
- production GitHub Environment

Candidate representation:

```text
ADDED
+ AWS_DEPLOY
+ CI_EXECUTION
+ CLOUD_WRITE
+ PRODUCTION_DEPLOYMENT
```

This is a strong repository-level example because no single application function explains the new power. The capability is distributed across workflow configuration, cloud identity, deployment commands, and environment configuration.

### External S3 media integration

**Repository:** langfuse/langfuse  
**PR:** #18320  
**URL:** https://github.com/langfuse/langfuse/pull/18320

The inspected patch adds a project-scoped external media storage integration with S3/S3-compatible storage.

Evidence includes:

- a new database model for external media storage integrations
- S3/S3-compatible configuration
- external endpoint validation
- MCP tools for lookup/configure/delete/test
- signed media/object handling in the broader PR

Candidate representation:

```text
ADDED
+ EXTERNAL_HTTP
+ AWS_WRITE / external object-storage write
+ UPLOAD_DATA / external data movement
```

The exact AWS-vs-generic-S3 classification needs evidence from the concrete provider path; the fixture should not infer AWS merely because the protocol is S3-compatible.

This is another reason the capability engine needs **evidence references plus confidence**, rather than a single opaque label.

### CI database write and secret privilege

**Repository:** MattyBalaam/shorpin  
**PR:** #120  
**URL:** https://github.com/MattyBalaam/shorpin/pull/120

The inspected patch changes a scheduled GitHub Actions keepalive from an anonymous/read-only Supabase request to a service-role write:

```text
BEFORE
anon/publishable key
database read

AFTER
SUPABASE_SERVICE_ROLE_KEY
database INSERT
database DELETE
```

Candidate representation:

```text
MATERIAL CHANGE
+ READ_DATABASE -> WRITE_DATABASE
+ READ_ENVIRONMENT / READ_SECRET
+ CI_EXECUTION
```

This is a particularly valuable example for the delta model because the meaningful change is a **privilege transition**, not simply a new API call.

### Large S3/storage refactor — negative case

**Repository:** fitzroywright/Common.Storage  
**PR:** #7  
**URL:** https://github.com/fitzroywright/Common.Storage/pull/7

The inspected patch replaces the implementation of an existing Amazon S3 adapter with delegation to a provider-neutral implementation and adds tests/configuration coverage.

This is useful as a negative or ambiguous case.

The patch is large and touches cloud-storage code, but the evidence shown does not establish that the resulting system gained a new external capability. It may instead preserve an existing capability behind a refactored implementation.

Validation classification:

```text
LIKELY NO NEW CAPABILITY
or
MATERIALITY = UNCHANGED
```

This guards against the naive rule:

> "Cloud-related code changed" => "new cloud capability."

### Shell runner feature — changed capability semantics, not automatically added power

**Repository:** Falconiere/toolu-ghrunner  
**PR:** #141  
**URL:** https://github.com/Falconiere/toolu-ghrunner/pull/141

The inspected patch adds custom shell-template support, interpreter resolution, quoting behavior, and container/host shell routing.

This is not automatically an `SHELL_EXECUTION` **addition**, because the runner already executed shell commands.

It is better treated as:

```text
CAPABILITY = existing
STATE = CHANGED
```

Possible materiality depends on what execution paths were reachable before and after the patch.

This reinforces the SPEC requirement that ChangeScope report **added, removed, and materially changed** capabilities rather than only additions.

---

## 20. Third-batch findings

The new evidence strengthens several conclusions.

### 20.1 Configuration is first-class evidence

The deployment and permission examples show that capability changes can be introduced almost entirely through YAML and environment/configuration.

### 20.2 Capability delta must model privilege transitions

The Supabase example demonstrates that:

```text
read -> write
anonymous -> service-role
manual -> automated
```

can be more meaningful than the number of changed files.

### 20.3 Existing capability vs new capability must be distinguished

The storage refactor and shell-runner examples show why "feature-looking" PRs cannot all be classified as additions.

### 20.4 Evidence must remain provider-specific

S3 protocol support does not prove AWS specifically. A capability finding must identify the concrete provider/path when the evidence supports it and otherwise remain generic.

### 20.5 Repository-level analysis is now strongly justified

Across the third batch, meaningful evidence appears in:

```text
source code
configuration
GitHub Actions permissions
environment variables
cloud deployment workflows
database migrations
MCP/tool policy
infrastructure documentation
```

The V0 model therefore remains repository-level and evidence-first.

---

## 21. Updated sample matrix

The empirical set currently covers at least these categories:

| Pattern | Example | Preliminary classification |
|---|---|---|
| External cloud storage | tomoji #73 | capability added |
| S3/cloud integration | sentry-python #7888 | capability added |
| Payment provider | FoodService #49 | capability added |
| GitHub workflow write permission | vault-secrets-operator #28 | capability added/material |
| Shell execution | agentcore-cli #2548 | capability added |
| AWS production deployment | theCourseForum2 #1310 | capability added |
| Deployment permission | vcc-ical #74 | capability added/material |
| Production ECS deployment | patheya-express #28 | capability added |
| External S3 media | langfuse #18320 | capability added |
| Database read -> write + service role | shorpin #120 | material capability change |
| Storage implementation refactor | Common.Storage #7 | likely no new capability |
| Shell runner semantics | toolu-ghrunner #141 | changed capability / ambiguous materiality |
| Refactor | mupen64 #1067 | likely no new capability |
| Misleading database title | Backend-Web-Development #329 | ambiguous / no clean evidence |

This is still a small empirical set relative to the planned 50–100 PR V0 sample.

---

## 22. Decision after third batch

**Do not build the GitHub App yet.**

The evidence is now strong enough to justify building only the smallest validation artifact needed next:

1. a representative fixture corpus;
2. a capability-core data model;
3. deterministic evidence-to-capability tests;
4. no GitHub webhook/app/presentation layer yet.

The fixture corpus should preserve the observed distinction between:

```text
CAPABILITY ADDED
CAPABILITY REMOVED
CAPABILITY CHANGED
NO CAPABILITY CHANGE
AMBIGUOUS / NEEDS MORE EVIDENCE
```

Implementation beyond those validation artifacts remains deferred until the larger sample is evaluated.

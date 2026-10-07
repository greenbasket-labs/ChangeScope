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


---

## 23. Validation fixture corpus created

A first fixture corpus has now been added under `tests/fixtures/`.

It deliberately contains both positive and negative cases:

- AWS S3 write
- GitHub Actions repository write permission
- AWS OIDC + ECS production deployment
- external S3/media HTTP integration
- database read -> write plus service-role secret
- existing S3 capability preserved through refactoring
- existing shell execution with changed semantics
- documentation-only change

Each fixture includes an expected classification and inspectable evidence patterns.

The corpus is intentionally small and representative. It is **not** being treated as proof of detector precision yet.

Next validation work is to expand the real-PR sample and use these fixtures to formalize the evidence model before implementing a production detector.

---
## 24. Evidence model and capability-core implemented

The next validation artifact is now implemented without adding the GitHub App or parser.

### Normative model

SPEC.md v0.2.0 now defines:

- first-class evidence records;
- evidence kinds;
- source locations;
- evidence quality;
- confidence;
- detector identity;
- provider-specific evidence requirements;
- the rule that titles, filenames, prose, and LLM output alone cannot establish a capability.

The specification also corrected the GitHub Actions fixture semantics: "contents: write" is represented as REPOSITORY_WRITE, not PR_WRITE. GitHub documents contents: write as write access to repository contents, with write including read at the permission level.

### Capability-core boundary

The first core implementation now contains:

- normalized capability vocabulary;
- evidence construction and validation;
- capability record construction and validation;
- stable capability identity;
- base/head delta calculation;
- added, removed, and changed capability states.

It has no GitHub API dependency and no parser dependency.

### Deterministic tests

tests/capability-core.test.mjs covers:

- first-class inspectable evidence;
- invalid evidence rejection;
- evidence requirement for non-unchanged findings;
- repository-write permission semantics;
- added capability detection;
- material capability change detection;
- unchanged capability producing no delta.

The GitHub-connected environment used to edit the repository does not provide a local repository checkout for executing node --test, so runtime execution remains a local validation step rather than being claimed here as passed.

The project therefore remains at V0 empirical validation. The next gate is to execute the deterministic tests locally, reconcile any failures, then expand the real-PR sample toward the planned 50–100 cases.

---

## 25. Capability removal through operation removal

A targeted validation case was added to test the opposite direction of capability change: a powerful permission/access path exists in the base system, but the reachable operation is removed in the head.

### Docker socket control removed

**Repository:** sosjalapeno/alacarte  
**PR:** #34  
**URL:** https://github.com/sosjalapeno/alacarte/pull/34

The patch removes the web container's direct Docker daemon path.

Direct patch evidence includes:

- `docker-compose.yml` removes the `/var/run/docker.sock` bind mount from the web service.
- `backend/lib/wrapperLogin.mjs` removes the `dockerode` dependency and Docker container creation/inspection/control logic.
- The replacement path uses an internal HTTP supervisor instead of direct Docker daemon operations.

The relevant transition is:

```text
BASE
web container
  ↓
host Docker socket
  ↓
Docker daemon control
  ↓
arbitrary container lifecycle operations

HEAD
web container
  ↓
internal HTTP supervisor
  ↓
wrapper-specific control
```

### Preliminary classification

```text
CAPABILITY_REMOVED / RESTRICTED

Existing Docker control capability
        ↓
direct host Docker-daemon control removed

Boundary:
web container → host Docker daemon
        ↓
web container → internal supervisor
```

This is stronger evidence than the PR title or security description because the repository diff itself removes the socket mount and the Docker API control path.

### Validation lesson

A detector must not conclude:

> `docker.sock` is still somewhere in the repository, therefore Docker control still exists.

It must evaluate the **reachable operation path**.

This strengthens the current effective-capability model:

```text
AUTHORITY
+
OPERATION
+
REACHABILITY
+
SCOPE
=
EFFECTIVE CAPABILITY
```

It also provides a direct negative-direction test for the existing Capability Delta model: capability removal/restriction is as important as capability addition.

### V0 decision

No SPEC change is justified by this case.

The existing specification already requires:

- removed capabilities to be reported;
- evidence-backed findings;
- scope/boundary consideration;
- repository-level analysis.

The case should therefore remain validation evidence and become a fixture candidate only after the broader sample supports the pattern.

---

## 26. Permission scope narrowing without losing the capability

A second targeted case tests whether ChangeScope can distinguish a **capability restriction** from a capability removal when the operation remains reachable but authority is narrowed to the job that actually needs it.

### Release workflow write permission narrowed

**Repository:** pickforge/pickcheck  
**PR:** #22  
**URL:** https://github.com/pickforge/pickcheck/pull/22

The merged PR changes the release workflow so that:

- the workflow defaults to `contents: read`;
- only the `host` release job receives `contents: write`;
- the two build jobs no longer receive the write-capable `GH_TOKEN`;
- `plan` and `announce` retain read-only access;
- the `host` job still performs the release/upload operations.

GitHub's workflow model confirms that `permissions` can be scoped at workflow or job level, and that specifying permissions changes the effective `GITHUB_TOKEN` access for the relevant job. `contents: write` permits repository-content writes, while unspecified permissions become `none` when permissions are explicitly defined. citeturn0search4

### Preliminary classification

```text
CAPABILITY_CHANGED

BEFORE
multiple release-related jobs receive write authority

AFTER
only the reachable release host job receives write authority

Capability authority remains for release execution,
but its scope is narrowed.
```

This is not correctly classified as `NO_CAPABILITY_CHANGE` merely because the final release job still has `contents: write`, and it is not correctly classified as complete `REPOSITORY_WRITE` removal because the release operation remains reachable.

### Validation lesson

ChangeScope must model **scope** as part of effective capability:

```text
AUTHORITY + OPERATION + REACHABILITY + SCOPE
= EFFECTIVE CAPABILITY
```

A useful detector should therefore distinguish:

```text
capability removed
        ≠
capability retained but restricted
```

This is particularly important for CI because GitHub permits permissions at workflow and job scope. citeturn0search8

### V0 decision

No SPEC change is justified by this case. The existing `CHANGED` state, affected scope, evidence references, and blast-radius model already provide the required concepts.

Source: the merged PR's description and workflow-scope change. The PR itself states that a real tag run was still pending, so this validation records the authorization-scope transition rather than claiming a successful release execution.

---

## 27. Unreachable capability-looking workflow removal

**Repository:** Zenimac021/Zenimac021  
**PR:** #11  
**URL:** https://github.com/Zenimac021/Zenimac021/pull/11

The PR deletes an AWS ECS deployment workflow that looked capability-significant on inspection:

- AWS credential configuration using repository secrets
- ECR login
- Docker build and push
- ECS task-definition rendering
- ECS deployment
- production environment

At first glance this could be classified as removal of AWS_DEPLOY, CI_EXECUTION, and related cloud capabilities.

However, the repository and workflow context show an important counterexample:

- the workflow was the unedited GitHub ECS template;
- AWS region, ECR repository, ECS service, cluster, task-definition and container-name values were still placeholders;
- the repository had no Dockerfile, ECS task definition, or other deployment assets;
- the PR description states the workflow failed immediately and had no usable deployment path.

### Validation result

**NO_CAPABILITY_CHANGE for the effective system capability model.**

The workflow contained capability-looking operations, but the deployment path was not actually reachable/configured in the repository.

This validates an important guard:

> **A capability-looking artifact is not enough. ChangeScope must evaluate effective reachability before reporting a capability delta.**

This strengthens the distinction:

artifact contains operation

does not imply

effective capability exists

This is a useful false-positive test because a naive detector that maps AWS/ECS workflow syntax directly to AWS_DEPLOY would incorrectly report a capability removal.

**No SPEC change proposed.** This is already consistent with the existing authority + operation + reachability + scope model.

---

## 28. Trigger-context changes alter effective capability

**Repository:** iory/rcb4  
**PR:** #230  
**URL:** https://github.com/iory/rcb4/pull/230

This merged PR changes a hardware-test workflow from `pull_request_target` to `pull_request` and explicitly sets `contents: read`. It also separates privileged post-processing into a `workflow_run` workflow that uploads artifacts to Google Drive and comments on the PR.

The important capability change is not simply the YAML permission line. The trigger context changes what fork PR code can reach:

- the previous `pull_request_target` path could expose a write-capable repository token and a Google Drive service-account secret to the test job if unsafe checkout was enabled;
- the new `pull_request` path runs fork code with a read-only token and no repository secrets;
- the privileged `workflow_run` path does not check out or execute PR code and performs the external upload separately.

### Validation result

**CAPABILITY_CHANGED / RESTRICTED**

The effective boundary for untrusted fork code is materially reduced even though the repository still contains privileged automation elsewhere.

This validates another guard:

> **Effective capability depends on trigger context as well as declared permissions.**

A detector that only compares `permissions:` blocks would miss this material boundary change.

GitHub documents that workflow permissions are affected by repository defaults, workflow-level permissions, job-level permissions, and fork-trigger behavior; fork PR workflows normally have write permissions reduced to read-only unless the repository explicitly enables write tokens.

**No SPEC change proposed.** The case fits the existing authority + operation + reachability + scope model.

---

## 29. Compound add/remove delta in one PR

**Repository:** Heathton/ScrollKeeper  
**PR:** #11  
**URL:** https://github.com/Heathton/ScrollKeeper/pull/11

This merged PR changes several capability boundaries at once:

- removes the Docker CLI and Docker-socket manager from the bot deployment;
- changes local inference to OpenAI-compatible HTTP endpoints for chat, embeddings, and speech-to-text;
- adds a tagged GitHub Actions workflow that builds and pushes images to GHCR;
- adds `packages: write` to the publishing workflow.

### Validation result

**COMPOUND CAPABILITY DELTA**

At least one existing execution boundary is removed/restricted while other capabilities are added or changed. The current vocabulary supports reporting the external HTTP and execution-related evidence, while `packages: write` remains an authorization surface outside the current vocabulary and should not be invented into another capability.

This is an important V0 test because the analyzer must not collapse the PR into a single label such as `security change` or `deployment change`.

Expected reasoning:

```text
remove/restrict Docker control
        +
add external HTTP inference paths
        +
add CI image publishing path
        ↓
multiple independent capability deltas
```

The case also reinforces that one PR can contain additions, removals and material changes simultaneously.

**No SPEC change proposed.**

---

## 30. Dependency exposes capability but repository does not consume it

**Repository:** Trustroots/trustroots  
**PR:** #3023  
**URL:** https://github.com/Trustroots/trustroots/pull/3023

This Dependabot PR upgrades `actions/github-script` from v8 to v9. The release notes describe a new `getOctokit` factory that can create additional authenticated clients with different tokens, including GitHub App tokens and cross-organization access.

However, inspection of the actual PR diff shows only action-version changes. The repository does not add a call to the new `getOctokit` API in this PR.

### Validation result

**NO_CAPABILITY_CHANGE**

The dependency/action now exposes a more powerful API surface, but that power is not consumed by the repository's changed workflow code.

This validates the dependency guard:

> **A dependency's available capability is not automatically the application's effective capability.**

Required evidence remains:

```text
dependency/API availability
        +
actual repository consumption
        +
reachable operation
        +
authority
        ↓
effective capability
```

GitHub's dependency-review documentation separately identifies dependency additions, removals, and updates; ChangeScope's job is different: determine whether the resulting software has a materially different effective capability. citeturn0search0turn0search7

**No SPEC change proposed.**


---

## 31. Gated deployment path with disabled activation

**Repository:** Jesssullivan/jesssullivan.github.io  
**PR:** #263  
**URL:** https://github.com/Jesssullivan/jesssullivan.github.io/pull/263

This draft PR adds a dedicated Cloudflare Pages shadow-publish workflow triggered only by `repository_dispatch`. The workflow contains deployment logic and a Cloudflare credentialed publish stage, but it explicitly fails closed unless `BLOG_TSS_PUBLISH_ENABLED=true`; the repository variable is currently absent, so the default is false. The workflow also has no automatic trigger.

### Validation result

**AMBIGUOUS / NOT EFFECTIVE YET**

The PR introduces deployment machinery, but the repository state shown in the PR does not establish an active deployment capability: activation requires an external repository variable and an explicit dispatch.

This is a new validation boundary:

> **A reachable workflow definition is not necessarily an effective capability when an explicit activation gate and required external configuration are both absent.**

ChangeScope should preserve the evidence for the deployment path and its gate, but should not report an unconditional `DEPLOYMENT` delta from the workflow code alone.

**No SPEC change proposed.**


---

## 32. Workflow gains conditional PR merge authority

**Repository:** framerslab/agentos-extensions  
**PR:** #56  
**URL:** https://github.com/framerslab/agentos-extensions/pull/56

The PR changes Dependabot automation from a `pull_request` workflow that could not merge with its read-only token to a `workflow_run` workflow on the default branch. The new workflow explicitly requests `contents: write` and `pull-requests: write`, verifies the exact tested head, checks Dependabot authorship/update type/reviews/checks, then executes `gh pr merge --match-head-commit`.

### Validation result

**CAPABILITY_ADDED**

Relevant capabilities:

- `PR_MERGE`
- `REPOSITORY_WRITE` as supporting authorization/effective repository write authority
- `CI_EXECUTION` as the automation path

The important new boundary is not merely the permission declaration. The workflow contains a reachable merge operation and uses the granted authority to perform it.

This validates a distinct case:

> **Automation can gain a capability by changing the execution context in which an existing operation becomes authorized and reachable.**

The capability is conditional and constrained by exact-head, authorship, update-type, review, and check gates, but the resulting system can now autonomously merge qualifying pull requests.

GitHub documents `workflow_run` as a workflow event that can run after another workflow completes; this PR uses that context to move the merge decision to the default-branch workflow. citeturn0search4

**No SPEC change proposed.**


---

## 33. Release creation becomes reachable only after successful package publication

**Repository:** Leechael/pi-famulus  
**PR:** #44  
**URL:** https://github.com/Leechael/pi-famulus/pull/44

The PR changes an existing npm release workflow so that, after a successful non-dry-run package publish, it creates a Git tag and GitHub Release. The release job changes `contents: read` to `contents: write` and the new step uses `GH_TOKEN` with GitHub API/tag/release operations. The step is explicitly gated by `DRY_RUN == false`.

### Validation result

**CAPABILITY_ADDED / CAPABILITY_CHANGED**

Relevant capabilities:

- `RELEASE_CREATE`
- `REPOSITORY_WRITE`
- `CI_EXECUTION`

The new capability is not established by `contents: write` alone. The decisive evidence is the combination of the permission, the reachable GitHub API/tag operations, and the non-dry-run trigger condition.

This validates a distinct **post-success chained capability**:

> A workflow can acquire a new external/repository capability only on a later stage whose execution is conditional on an earlier successful operation.

The dry-run gate also means the capability's reachability depends on execution mode; ChangeScope should preserve that scope rather than describing every workflow invocation as a release creation.

**No SPEC change proposed.**


---

## 34. Deployment authority split from artifact-building authority

**Repository:** Jahid11978/jahid.ai  
**PR:** #10  
**URL:** https://github.com/Jahid11978/jahid.ai/pull/10

The PR replaces a direct Cloudflare deployment workflow with a multi-stage promotion workflow. The new design separates build/attestation from the later promotion stage, with production requiring configured approvals and verified provenance/signature/SBOM evidence. The workflow also supports development, staging, canary, and production targets.

### Validation result

**CAPABILITY_CHANGED**

The important change is the **authority boundary between build and promotion**, not simply the addition of deployment-related YAML.

The resulting system can promote an already-built artifact through a controlled promotion path rather than directly deploying from the build job. Production promotion is additionally gated.

This validates a new boundary:

> **Capability scope can change when authority is moved between workflow stages, even when both the old and new workflows perform deployment-related work.**

ChangeScope should therefore compare not only whether `DEPLOYMENT` exists, but **which stage holds the authority, what artifact it can act on, and what gates control that authority**.

**No SPEC change proposed.**


---

## 35. Scheduled automation gains issue-writing capability without deployment authority

**Repository:** clearmeasure-aisf-sample-apps/basic-environment-octopus-codefresh  
**PR:** #92  
**URL:** https://github.com/clearmeasure-aisf-sample-apps/basic-environment-octopus-codefresh/pull/92

The PR adds a scheduled/manual GitHub Actions workflow that reads release pin history and opens, comments on, or closes GitHub Issues. Its token has `contents: read` and `issues: write`; it has no secrets and no deployment/cloud credentials.

### Validation result

**CAPABILITY_ADDED**

Relevant capabilities:

- `ISSUE_WRITE`
- `CI_EXECUTION`

The workflow deliberately has no deployment path. Its new power is the ability for scheduled automation to mutate GitHub Issues.

This validates a distinct **side-effect capability**:

> Automation that only reports or reconciles state can still introduce a material external write capability even when it cannot deploy or modify repository contents.

**No SPEC change proposed.**


---

## 36. Reusable workflow grants side-effect authority to the caller job

**Repository:** riles22/wow-class-tracker  
**PR:** #93  
**URL:** https://github.com/riles22/wow-class-tracker/pull/93

The PR adds a reusable `workflow_call`-style alert workflow and caller jobs that request `issues: write` only for the final alert step. The alert workflow has top-level empty permissions and performs the issue comment using the caller's granted authority.

### Validation result

**CAPABILITY_CHANGED**

The important boundary is **permission inheritance into a reusable workflow**: the reusable workflow itself does not independently create broad authority; the caller job supplies the issue-writing permission.

This validates a distinct composition case:

> **Effective capability can emerge at the boundary between a caller job's permissions and a reusable workflow's operation.**

ChangeScope must follow permission context across reusable-workflow boundaries rather than analyzing the called workflow in isolation.

**No SPEC change proposed.**


---

## 36. GitHub Pages deployment capability via Pages-specific authorization

**Repository:** uptide-dev/uptide-dev.github.io  
**PR:** #1  
**URL:** https://github.com/uptide-dev/uptide-dev.github.io/pull/1

The merged PR introduces a GitHub Actions Pages deployment workflow using `upload-pages-artifact` and `deploy-pages`, triggered on changes to `main`. The deployment job uses `pages: write` and `id-token: write`; CI itself remains `contents: read`.

### Validation result

**CAPABILITY_ADDED**

The meaningful delta is a new reachable **DEPLOYMENT** path to GitHub Pages, with Pages-specific authorization and an OIDC token for the deployment action.

This is distinct from the AWS deployment cases: deployment authority can be introduced through a hosting-platform-specific permission and deployment action without AWS credentials or repository-content write access.

**No SPEC change proposed.**


---

## 37. Workflow-dispatch authority requires Actions write permission

**Repository:** projectbluefin/utah-packages  
**PR:** #378

The PR adds `actions: write` to the bot import/buildroot workflow and uses that authority to dispatch validation against the proposed PR head. The dispatched validation then runs with read-only contents/PR permissions; a separate reporting job can comment with `pull-requests: write`.

### Validation result

**CAPABILITY_ADDED — WORKFLOW_TRIGGER**

The capability is established by the combination of:

- `actions: write` authorization;
- a reachable workflow-dispatch operation;
- validation targeted at the newly opened bot PR.

This distinguishes **workflow trigger authority** from the permissions of the workflow being triggered. The triggered workflow can remain read-only while the caller gains authority to start it.

**No SPEC change proposed.**


---

## 38. Trusted publishing creates a new external release/deployment path

**Repository:** BasileChretien/manuscript-guard  
**PR:** #186

The merged PR adds an automated PyPI publishing workflow. The publish job uses GitHub OIDC via `id-token: write`, a protected `pypi` environment, and uploads the built distribution through PyPI trusted publishing. The release job separately gets `contents: write` to create the tag and GitHub Release.

### Validation result

**CAPABILITY_ADDED — DEPLOYMENT / SEND_EXTERNAL_DATA**

The important evidence is the complete reachable chain:

`push/version change → build → protected publish job → OIDC authorization → PyPI upload`.

This is stronger than detecting `id-token: write` alone: the token permission is supporting evidence, while the actual external publishing operation establishes the capability.

It also validates that one PR can create **two distinct external side effects**: GitHub release creation and package publication.

**No SPEC change proposed.**

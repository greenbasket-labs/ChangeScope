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

# ChangeScope Fixture Corpus

These fixtures are validation evidence, not production detector logic.

| Fixture | Expected classification | Main evidence |
|---|---|---|
| aws-s3-upload | capability added | S3 client + object upload |
| github-actions-write | capability added/material | contents: write |
| production-aws-oidc-ecs | capability added | OIDC + AWS role + ECS deployment |
| external-s3-media | capability added | external HTTP + object-storage configuration |
| database-read-to-write | capability changed | service-role secret + POST/DELETE |
| storage-refactor | no capability change | existing S3 adapter delegated to new implementation |
| shell-semantics | changed/ambiguous | existing shell execution behavior changed |
| docs-only | no capability change | documentation only |

Classification vocabulary: CAPABILITY_ADDED, CAPABILITY_REMOVED, CAPABILITY_CHANGED, NO_CAPABILITY_CHANGE, AMBIGUOUS.

The fixture corpus is evidence-first. A filename, PR title, or prose label is never sufficient to establish a capability.

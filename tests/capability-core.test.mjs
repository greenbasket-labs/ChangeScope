import test from "node:test";
import assert from "node:assert/strict";
import {
  createEvidence,
  createCapability,
  calculateDelta
} from "../packages/capability-core/src/index.mjs";

const evidence = createEvidence({
  id: "ev_001",
  path: ".github/workflows/publish.yml",
  kind: "permission",
  location: { startLine: 5, endLine: 5 },
  pattern: "contents: write",
  capability: "REPOSITORY_WRITE",
  detector: "github-actions.permissions",
  confidence: "HIGH",
  quality: "DIRECT",
  explanation:
    "Workflow grants GITHUB_TOKEN write access to repository contents."
});

test("evidence is first-class and inspectable", () => {
  assert.equal(evidence.kind, "permission");
  assert.equal(evidence.capability, "REPOSITORY_WRITE");
  assert.deepEqual(evidence.location, {
    startLine: 5,
    endLine: 5
  });
  assert.equal(evidence.quality, "DIRECT");
});

test("unsupported evidence kinds are rejected", () => {
  assert.throws(
    () =>
      createEvidence({
        id: "ev_bad",
        path: "workflow.yml",
        kind: "guess",
        pattern: "contents: write",
        detector: "test",
        confidence: "HIGH",
        quality: "DIRECT",
        explanation: "invalid"
      }),
    /Unsupported evidence kind/
  );
});

test("non-unchanged capability findings require evidence", () => {
  assert.throws(
    () =>
      createCapability({
        id: "repo-content",
        category: "github",
        name: "REPOSITORY_WRITE",
        state: "added",
        confidence: "HIGH",
        quality: "DIRECT",
        evidence: []
      }),
    /require evidence/
  );
});

test("contents: write is repository write, not PR write", () => {
  const capability = createCapability({
    id: "repo-content",
    category: "github",
    name: "REPOSITORY_WRITE",
    state: "added",
    confidence: "HIGH",
    quality: "DIRECT",
    evidence: [evidence]
  });

  assert.equal(capability.name, "REPOSITORY_WRITE");
  assert.notEqual(capability.name, "PR_WRITE");
});

test("capability records carry confidence and evidence quality", () => {
  const capability = createCapability({
    id: "repo-content",
    category: "github",
    name: "REPOSITORY_WRITE",
    state: "added",
    confidence: "HIGH",
    quality: "DIRECT",
    evidence: [evidence]
  });

  assert.equal(capability.confidence, "HIGH");
  assert.equal(capability.quality, "DIRECT");
});

test("invalid capability evidence records are rejected", () => {
  assert.throws(
    () =>
      createCapability({
        id: "repo-content",
        category: "github",
        name: "REPOSITORY_WRITE",
        state: "added",
        confidence: "HIGH",
        quality: "DIRECT",
        evidence: [{ id: "fake-evidence" }]
      }),
    /evidence/
  );
});

test("base/head delta detects an added capability", () => {
  const added = createCapability({
    id: "s3-write",
    category: "cloud",
    name: "AWS_WRITE",
    state: "added",
    confidence: "HIGH",
    quality: "DIRECT",
    evidence: [
      createEvidence({
        id: "ev_s3",
        path: "storage.ts",
        kind: "call",
        pattern: "PutObjectCommand",
        capability: "AWS_WRITE",
        detector: "aws.s3",
        confidence: "HIGH",
        quality: "DIRECT",
        explanation: "S3 object write operation detected."
      })
    ]
  });

  const delta = calculateDelta([], [added]);

  assert.deepEqual(
    delta.map((x) => x.state),
    ["added"]
  );
  assert.equal(delta[0].name, "AWS_WRITE");
});

test("base/head delta detects a material capability change", () => {
  const base = createCapability({
    id: "database-access",
    category: "data",
    name: "READ_DATABASE",
    state: "unchanged",
    confidence: "HIGH",
    quality: "DIRECT",
    evidence: [
      createEvidence({
        id: "ev_read",
        path: "keepalive.mjs",
        kind: "call",
        pattern: "SELECT",
        capability: "READ_DATABASE",
        detector: "database.sql",
        confidence: "HIGH",
        quality: "DIRECT",
        explanation: "Database read operation detected."
      })
    ]
  });

  const head = createCapability({
    id: "database-access",
    category: "data",
    name: "WRITE_DATABASE",
    state: "unchanged",
    confidence: "HIGH",
    quality: "DIRECT",
    properties: {
      operation: "write"
    },
    evidence: [
      createEvidence({
        id: "ev_write",
        path: "keepalive.mjs",
        kind: "call",
        pattern: "POST",
        capability: "WRITE_DATABASE",
        detector: "database.sql",
        confidence: "HIGH",
        quality: "DIRECT",
        explanation: "Database write operation detected."
      })
    ]
  });

  const delta = calculateDelta([base], [head]);

  assert.equal(delta.length, 1);
  assert.equal(delta[0].state, "changed");
  assert.equal(delta[0].previous.name, "READ_DATABASE");
  assert.equal(delta[0].name, "WRITE_DATABASE");
});

test("unchanged capability produces no delta", () => {
  const unchanged = createCapability({
    id: "existing-http",
    category: "network",
    name: "EXTERNAL_HTTP",
    state: "unchanged",
    confidence: "HIGH",
    quality: "DIRECT",
    evidence: [
      createEvidence({
        id: "ev_http",
        path: "client.ts",
        kind: "call",
        pattern: "fetch(url)",
        capability: "EXTERNAL_HTTP",
        detector: "network.http",
        confidence: "HIGH",
        quality: "DIRECT",
        explanation: "Existing external HTTP call."
      })
    ]
  });

  assert.deepEqual(
    calculateDelta([unchanged], [unchanged]),
    []
  );
});

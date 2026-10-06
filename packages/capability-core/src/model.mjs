export const CAPABILITY_NAMES = Object.freeze([
  "READ_FILE","WRITE_FILE","READ_DATABASE","WRITE_DATABASE","DELETE_DATABASE",
  "READ_ENVIRONMENT","READ_SECRET","EXTERNAL_HTTP","INTERNAL_HTTP","WEBHOOK",
  "SOCKET","AWS_READ","AWS_WRITE","AWS_DEPLOY","GCP_READ","GCP_WRITE","GCP_DEPLOY",
  "AZURE_READ","AZURE_WRITE","AZURE_DEPLOY","REPOSITORY_READ","REPOSITORY_WRITE",
  "ISSUE_WRITE","PR_WRITE","PR_MERGE","RELEASE_CREATE","WORKFLOW_TRIGGER",
  "SHELL_EXECUTION","DOCKER_EXECUTION","CI_EXECUTION","DEPLOYMENT","EXPORT_DATA",
  "UPLOAD_DATA","SEND_EXTERNAL_DATA"
]);

export const EVIDENCE_KINDS = Object.freeze([
  "source","ast_pattern","import","call","configuration","dependency","lockfile",
  "dockerfile","permission","secret_reference","command","infrastructure","history","rule"
]);

export const EVIDENCE_QUALITIES = Object.freeze(["DIRECT","STRONG","INDIRECT","AMBIGUOUS"]);
export const CONFIDENCE_LEVELS = Object.freeze(["HIGH","MEDIUM","LOW"]);

const CAPABILITY_STATES = new Set(["added","removed","changed","unchanged"]);
const CAPABILITY_SET = new Set(CAPABILITY_NAMES);
const EVIDENCE_KIND_SET = new Set(EVIDENCE_KINDS);
const QUALITY_SET = new Set(EVIDENCE_QUALITIES);
const CONFIDENCE_SET = new Set(CONFIDENCE_LEVELS);

function requiredString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value;
}

export function createEvidence(input) {
  const evidence = {
    id: requiredString(input.id, "evidence.id"),
    path: requiredString(input.path, "evidence.path"),
    kind: input.kind,
    pattern: requiredString(input.pattern, "evidence.pattern"),
    detector: requiredString(input.detector, "evidence.detector"),
    confidence: input.confidence,
    quality: input.quality,
    explanation: requiredString(input.explanation, "evidence.explanation")
  };

  if (!EVIDENCE_KIND_SET.has(evidence.kind)) throw new TypeError(`Unsupported evidence kind: ${evidence.kind}`);
  if (!QUALITY_SET.has(evidence.quality)) throw new TypeError(`Unsupported evidence quality: ${evidence.quality}`);
  if (!CONFIDENCE_SET.has(evidence.confidence)) throw new TypeError(`Unsupported evidence confidence: ${evidence.confidence}`);

  if (input.location !== undefined) {
    if (!Number.isInteger(input.location.startLine) || input.location.startLine < 1) {
      throw new TypeError("evidence.location.startLine must be a positive integer");
    }
    if (input.location.endLine !== undefined &&
        (!Number.isInteger(input.location.endLine) || input.location.endLine < input.location.startLine)) {
      throw new TypeError("evidence.location.endLine must be >= startLine");
    }
    evidence.location = {
      startLine: input.location.startLine,
      ...(input.location.endLine === undefined ? {} : { endLine: input.location.endLine }),
      ...(input.location.startColumn === undefined ? {} : { startColumn: input.location.startColumn }),
      ...(input.location.endColumn === undefined ? {} : { endColumn: input.location.endColumn })
    };
  }

  if (input.capability !== undefined) {
    if (!CAPABILITY_SET.has(input.capability)) throw new TypeError(`Unsupported capability: ${input.capability}`);
    evidence.capability = input.capability;
  }

  if (input.commitSha !== undefined) evidence.commitSha = requiredString(input.commitSha, "evidence.commitSha");
  return Object.freeze(evidence);
}

export function createCapability(input) {
  const capability = {
    id: requiredString(input.id, "capability.id"),
    category: requiredString(input.category, "capability.category"),
    name: input.name,
    state: input.state,
    evidence: Array.isArray(input.evidence) ? input.evidence : [],
    ...(input.scope === undefined ? {} : { scope: input.scope }),
    ...(input.properties === undefined ? {} : { properties: input.properties })
  };

  if (!CAPABILITY_SET.has(capability.name)) throw new TypeError(`Unsupported capability name: ${capability.name}`);
  if (!CAPABILITY_STATES.has(capability.state)) throw new TypeError(`Unsupported capability state: ${capability.state}`);
  if (capability.evidence.length === 0 && capability.state !== "unchanged") {
    throw new TypeError("Non-unchanged capabilities require evidence");
  }
  for (const evidence of capability.evidence) {
    if (!evidence || typeof evidence.id !== "string") throw new TypeError("capability evidence must contain evidence records");
  }
  return Object.freeze(capability);
}

export function capabilityKey(capability) {
  return capability.id;
}

function comparable(capability) {
  return JSON.stringify({
    category: capability.category,
    name: capability.name,
    scope: capability.scope ?? null,
    properties: capability.properties ?? null
  });
}

export function calculateDelta(baseCapabilities, headCapabilities) {
  const base = new Map(baseCapabilities.map((capability) => [capabilityKey(capability), capability]));
  const head = new Map(headCapabilities.map((capability) => [capabilityKey(capability), capability]));
  const delta = [];

  for (const [id, headCapability] of head) {
    const baseCapability = base.get(id);
    if (!baseCapability) {
      delta.push({ ...headCapability, state: "added" });
    } else if (comparable(baseCapability) !== comparable(headCapability)) {
      delta.push({ ...headCapability, state: "changed", previous: baseCapability });
    }
  }

  for (const [id, baseCapability] of base) {
    if (!head.has(id)) delta.push({ ...baseCapability, state: "removed" });
  }
  return delta;
}

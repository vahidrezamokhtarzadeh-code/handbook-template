#!/usr/bin/env node
/**
 * Fill-handbook pipeline entrypoint.
 *
 * This is a prompt-generation pipeline, not an LLM call.
 * It reads a bootstrapped project's mining package + fill plan + existing handbook
 * state, then writes a staged prompt package that an AI agent (e.g. Freebuff) can
 * follow to fill the handbook.
 *
 * Usage:
 *   node docs/project/runbooks/fill-handbook-pipeline.mjs [--target <dir>]
 *
 * Output:
 *   docs/project/runbooks/fill-prompts.json        — machine-readable prompt package
 *   docs/project/runbooks/fill-prompts.md           — human-readable staged prompts
 *   docs/project/runbooks/fill-summary.md           — updated or newly created run summary
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SCRIPT_NAME = path.basename(SCRIPT_PATH);
const SCRIPT_DIR = path.dirname(SCRIPT_PATH);

const DEFAULT_TARGET = path.resolve(SCRIPT_DIR, "..", "..", "..");

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { target: DEFAULT_TARGET };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--target") {
      args.target = argv[++i] ?? DEFAULT_TARGET;
    } else if (a === "--help") {
      args.help = true;
    } else if (a.startsWith("-")) {
      console.error(`Unknown flag: ${a}`);
      process.exit(1);
    } else {
      // Allow positional target for convenience.
      args.target = path.resolve(a);
    }
  }
  return args;
}

function printUsage() {
  console.log(`Generate staged fill prompts for a bootstrapped handbook.

Usage:
  node ${SCRIPT_NAME} [--target <dir>]

Defaults:
  --target defaults to the repository root this script lives in.

Output:
  docs/project/runbooks/fill-prompts.json
  docs/project/runbooks/fill-prompts.md
  docs/project/runbooks/fill-summary.md (updated or created)

This script does not call an LLM. It only assembles the prompt package.
`);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readMarkdown(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
}

function writeFile(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Context loading
// ---------------------------------------------------------------------------

function loadContext(target) {
  const miningPackagePath = path.join(target, "docs", "project", "runbooks", "mining-package.json");
  const fillPlanPath = path.join(target, "docs", "project", "runbooks", "handbook-fill-plan.md");
  const compassPath = path.join(target, "docs", "PROJECT-COMPASS.md");
  const startHerePath = path.join(target, "docs", "START-HERE.md");
  const latestStatePath = path.join(target, "docs", "LATEST-STATE.md");
  const decisionTracePath = path.join(target, "docs", "DECISION-TRACE.md");
  const projectNarrativePath = path.join(target, "docs", "PROJECT-NARRATIVE.md");
  const contextCoveragePath = path.join(target, "docs", "CONTEXT-COVERAGE.md");
  const exDesignIndexPath = path.join(target, "docs", "EXECUTABLE-DESIGN-INDEX.md");
  const sourceHandoffPath = path.join(target, "docs", "SOURCE-HANDOFF.md");
  const changelogPath = path.join(target, "docs", "CHANGELOG.md");
  const agentsPath = path.join(target, "AGENTS.md");
  const decisionIndexPath = path.join(target, "docs", "project", "decisions", "DECISION-INDEX.md");

  const miningPackage = fs.existsSync(miningPackagePath) ? readJson(miningPackagePath) : null;
  const fillPlan = readMarkdown(fillPlanPath);
  const compass = readMarkdown(compassPath);
  const startHere = readMarkdown(startHerePath);
  const latestState = readMarkdown(latestStatePath);
  const decisionTrace = readMarkdown(decisionTracePath);
  const projectNarrative = readMarkdown(projectNarrativePath);
  const contextCoverage = readMarkdown(contextCoveragePath);
  const exDesignIndex = readMarkdown(exDesignIndexPath);
  const sourceHandoff = readMarkdown(sourceHandoffPath);
  const changelog = readMarkdown(changelogPath);
  const agents = readMarkdown(agentsPath);
  const decisionIndex = readMarkdown(decisionIndexPath);

  const existingArtifacts = {
    stories: listDir(path.join(target, "docs", "project", "stories")),
    decisions: listDir(path.join(target, "docs", "project", "decisions")),
    domain: listDir(path.join(target, "docs", "project", "domain")),
    architecture: listDir(path.join(target, "docs", "project", "architecture")),
    technology: listDir(path.join(target, "docs", "project", "technology")),
    dataModel: listDir(path.join(target, "docs", "project", "data-model")),
    contracts: listDir(path.join(target, "docs", "project", "contracts")),
    openDecisions: listDir(path.join(target, "docs", "project", "open-decisions")),
    implementation: listDir(path.join(target, "docs", "project", "implementation")),
    runbooks: listDir(path.join(target, "docs", "project", "runbooks")),
    principles: listDir(path.join(target, "docs", "architect-journal", "principles")),
    patterns: listDir(path.join(target, "docs", "architect-journal", "patterns")),
    heuristics: listDir(path.join(target, "docs", "architect-journal", "heuristics")),
    mistakes: listDir(path.join(target, "docs", "architect-journal", "mistakes")),
  };

  return {
    target,
    miningPackage,
    fillPlan,
    compass,
    startHere,
    latestState,
    decisionTrace,
    projectNarrative,
    contextCoverage,
    exDesignIndex,
    sourceHandoff,
    changelog,
    agents,
    decisionIndex,
    existingArtifacts,
  };
}

function listDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => !f.startsWith("_TEMPLATE")).sort();
}

// ---------------------------------------------------------------------------
// Prompt package assembly
// ---------------------------------------------------------------------------

function buildPromptPackage(ctx) {
  const mp = ctx.miningPackage;

  const project = mp?.projectName || path.basename(ctx.target);
  const version = mp?.handbookVersion || "v0.1.0";
  const date = mp?.snapshotDate || today();

  const projectTypeHint =
    mp?.projectTypeHint ||
    (ctx.miningPackage?.detected?.seemsBookProject ? "possible-book-project" :
      ctx.miningPackage?.detected?.seemsCodeRepo ? "likely-code-project" :
        "unrecognized");

  const existingDocCount = [
    ctx.latestState,
    ctx.decisionTrace,
    ctx.projectNarrative,
    ctx.startHere,
    ctx.contextCoverage,
    ctx.exDesignIndex,
    ctx.sourceHandoff,
    ctx.changelog,
    ctx.compass,
    ctx.decisionIndex,
  ].filter(Boolean).length;

  const artifactCounts = Object.entries(ctx.existingArtifacts).map(([k, v]) => ({
    area: k,
    count: v.length,
    files: v,
  }));

  const packageBody = {
    generatedBy: SCRIPT_NAME,
    generatedAt: today(),
    targetRoot: ctx.target,
    projectName: project,
    handbookVersion: version,
    snapshotDate: date,
    projectTypeHint,
    fillPlanAvailable: Boolean(ctx.fillPlan),
    compassAvailable: Boolean(ctx.compass),
    startHereAvailable: Boolean(ctx.startHere),
    existingDocCount,
    artifactCounts,
    miningPackage: mp
      ? {
          detected: mp.detected,
          placeholderCoverage: mp.placeholderCoverage,
          handbookInventory: mp.handbookInventory,
        }
      : null,
    existingEvidence: {
      hasChangelog: Boolean(ctx.changelog),
      hasAgents: Boolean(ctx.agents),
      hasExistingHandoffDocs: ctx.miningPackage?.detected?.existingHandoff?.length ??
        (ctx.miningPackage?.detected ? Object.keys(ctx.miningPackage.detected).length : 0) > 0,
    },
    instructions: {
      mandatoryRules: [
        "Do not invent Accepted decisions.",
        "Do not generalize one example into a platform rule unless a separate ADR explicitly does so.",
        "Keep status tags honest: Accepted only with real evidence; inferred content stays Candidate/Needs-confirmation.",
        "Keep DECISION-TRACE.md and PROJECT-NARRATIVE.md in sync with accepted decisions.",
        "Keep CONTEXT-COVERAGE.md and the index files in sync with what you write.",
        "Do not silently overwrite accepted content; patch or append and say what you changed.",
        "After any decision or change, update the relevant doc(s) and indexes. This rule is obligatory and lives in AGENTS.md.",
      ],
      citationRule: "Cite evidence where it exists: file path, git ref, existing doc, PR, issue, conversation. If there is no source, say 'no source — inferred.'",
      decisionRule: "A decision is Accepted only when there is real evidence.",
      statusVocab: [
        "Accepted / Confirmed — explicitly agreed for current scope.",
        "Candidate — concept not yet sufficiently proven by business evidence.",
        "Deferred — intentionally postponed, with a trigger to revisit.",
        "Open Decision — known unresolved question intentionally deferred.",
        "Explicitly-not-modeled — concept deliberately not created.",
      ],
    },
  };

  return packageBody;
}

function buildStagedPrompts(ctx, pkg) {
  const project = pkg.projectName;
  const version = pkg.handbookVersion;
  const date = pkg.snapshotDate;
  const projectTypeHint = pkg.projectTypeHint;

  return {
    header: `# Fill Handbook Prompts — ${project} ${version}

Generated by ${SCRIPT_NAME} on ${date}.

This is a staged prompt package for an AI agent (e.g. Freebuff) to fill the handbook
for **${project}**.

Read the files in this order before starting:
1. docs/PROJECT-COMPASS.md
2. docs/START-HERE.md
3. docs/project/runbooks/handbook-fill-plan.md
4. docs/project/runbooks/mining-package.json
5. this file: docs/project/runbooks/fill-prompts.md

Then work through the stages below in order.
`,
    meta: {
      projectName: project,
      handbookVersion: version,
      snapshotDate: date,
      projectTypeHint,
      existingDocCount: pkg.existingDocCount,
      artifactCounts: pkg.artifactCounts,
      note: "These prompts assume the handbook skeleton already exists. If it does not, run bootstrap first.",
    },
    stages: [
      {
        stage: 0,
        title: "Load context and confirm scope",
        filesToRead: [
          "docs/PROJECT-COMPASS.md",
          "docs/START-HERE.md",
          "docs/project/runbooks/handbook-fill-plan.md",
          "docs/project/runbooks/mining-package.json",
        ],
        optionalEvidence: [
          "README.md",
          "CONTRIBUTING.md",
          "AGENTS.md",
          "docs/README.md",
          "docs/CHANGELOG.md",
          "docs/project/decisions/DECISION-INDEX.md",
          "docs/project/decisions/ADR-*.md",
          "docs/project/stories/story-*.md",
          "any existing notes, chat exports, PR descriptions, issue text, or manuscript files",
        ],
        prompt: `You are filling the architecture handbook for **${project}** (${version}, snapshot ${date}).

First, determine what kind of project this is.
The mining package suggests: ${projectTypeHint}.
Verify that against the repo yourself. If it seems wrong, say so and explain why.

Then write a short context summary covering:
- what the project appears to be,
- what kind of project it seems to be,
- what evidence you found,
- what is missing,
- what you will infer versus what you found.

Do not assume purpose from a single file.
If no purpose is visible, say "purpose not yet established."
Record your project-type judgment and why.`,
        output: "docs/project/runbooks/fill-stage-0-context-summary.md",
      },
      {
        stage: 1,
        title: "Fill the truth layer",
        filesToRead: [
          "docs/LATEST-STATE.md",
          "docs/DECISION-TRACE.md",
          "docs/PROJECT-NARRATIVE.md",
          "docs/project/runbooks/mining-package.json",
          "docs/project/runbooks/fill-stage-0-context-summary.md",
        ],
        prompt: `Stage 1 — Fill the truth layer for **${project}**.

Files:
- docs/LATEST-STATE.md
- docs/DECISION-TRACE.md
- docs/PROJECT-NARRATIVE.md

Rules:
- Do not invent Accepted decisions.
- If there is no real evidence, leave a clearly marked placeholder and say why.
- Fill only what you can support.

LATEST-STATE.md:
- Fill Direction with a one-paragraph capability description if evidence supports it.
- Fill the Deployment row only if deployment is visible.
- Fill the Technology table only from observed facts.
- Leave Accepted sections empty unless there are real decisions.
- Set Current Phase honestly.

DECISION-TRACE.md:
- Add rows only for decisions that actually exist and have evidence.
- If there are none, leave the table and add a note: "No decisions captured yet."

PROJECT-NARRATIVE.md:
- Write "Why" sections only where there is a real causal story.
- Do not fabricate rationale.`,
        output: "docs/LATEST-STATE.md, docs/DECISION-TRACE.md, docs/PROJECT-NARRATIVE.md",
      },
      {
        stage: 2,
        title: "Fill the handoff surface",
        filesToRead: [
          "docs/START-HERE.md",
          "docs/CONTEXT-COVERAGE.md",
          "docs/EXECUTABLE-DESIGN-INDEX.md",
          "docs/SOURCE-HANDOFF.md",
          "docs/project/runbooks/mining-package.json",
          "docs/project/runbooks/fill-stage-0-context-summary.md",
        ],
        prompt: `Stage 2 — Fill the handoff surface for **${project}**.

Files:
- docs/START-HERE.md
- docs/CONTEXT-COVERAGE.md
- docs/EXECUTABLE-DESIGN-INDEX.md
- docs/SOURCE-HANDOFF.md

Rules:
- Keep the existing structure.
- Fill only what is real.
- If something is not established yet, leave a marked placeholder.

START-HERE.md:
- Set the current phase honestly.
- Set the current next action to one real sentence if possible.
- Add project-specific continuation rules only if there is a real basis.

CONTEXT-COVERAGE.md:
- Add rows only for discoveries that actually exist.
- Distinguish evidence from inference.

EXECUTABLE-DESIGN-INDEX.md:
- Point at files that actually exist.

SOURCE-HANDOFF.md:
- Fill the source checkpoint only if there is one.
- Keep caveats honest.`,
        output: "docs/START-HERE.md, docs/CONTEXT-COVERAGE.md, docs/EXECUTABLE-DESIGN-INDEX.md, docs/SOURCE-HANDOFF.md",
      },
      {
        stage: 3,
        title: "Fill first project body artifacts",
        filesToRead: [
          "docs/project/runbooks/mining-package.json",
          "docs/project/runbooks/handbook-fill-plan.md",
          "docs/project/runbooks/fill-stage-0-context-summary.md",
          "docs/project/decisions/DECISION-INDEX.md",
        ],
        prompt: `Stage 3 — Create and fill the first project body artifacts for **${project}**.

Do not create artifacts that have no basis. If there is nothing to say yet, create the skeleton and mark it as awaiting evidence.

Areas:
- docs/project/stories/
- docs/project/decisions/
- docs/project/domain/
- docs/project/architecture/
- docs/project/technology/
- docs/project/data-model/
- docs/project/contracts/
- docs/project/open-decisions/

Rules:
- Use the templates already in each folder.
- A story is evidence, not a universal template.
- Create the first ADR only if there is a real decision to record.
- Update docs/project/decisions/DECISION-INDEX.md when you create an ADR.
- Prefer observed facts from the repo for technology decisions.
- Do not invent decisions, domain concepts, boundaries, or contracts.

Artifact counts before this stage:
${artifactCountsTable(ctx.existingArtifacts)}

After creating or updating artifacts, record what you created in the fill summary.`,
        output: "docs/project/stories/*, docs/project/decisions/*, docs/project/domain/*, docs/project/architecture/*, docs/project/technology/*, docs/project/data-model/*, docs/project/contracts/*, docs/project/open-decisions/*",
      },
      {
        stage: 4,
        title: "Fill implementation and runbook skeletons",
        filesToRead: [
          "docs/project/implementation/implementation-plan.md",
          "docs/project/implementation/test-matrix.md",
          "docs/project/implementation/remaining-technical-gates.md",
          "docs/project/runbooks/new-chat-continuation.md",
          "docs/project/runbooks/mining-package.json",
          "docs/project/runbooks/fill-stage-0-context-summary.md",
        ],
        prompt: `Stage 4 — Fill implementation and runbook skeletons for **${project}**.

Files:
- docs/project/implementation/implementation-plan.md
- docs/project/implementation/test-matrix.md
- docs/project/implementation/remaining-technical-gates.md
- docs/project/runbooks/new-chat-continuation.md

Rules:
- Fill only what is real.
- Do not invent phases, deliverables, tests, or gates out of thin air.
- If something is not established yet, leave the skeleton and note it.

implementation-plan.md:
- Reflect an existing plan or obvious first slice if one exists.
- Otherwise leave the phase skeleton.

test-matrix.md:
- Add rows only for real invariants.

remaining-technical-gates.md:
- Fill only if there are real gates.

new-chat-continuation.md:
- Keep the handoff sequence.
- Fill current snapshot and reasoning checkpoints only if they are real.`,
        output: "docs/project/implementation/*.md, docs/project/runbooks/new-chat-continuation.md",
      },
      {
        stage: 5,
        title: "Close the loop",
        filesToRead: [
          "docs/project/decisions/DECISION-INDEX.md",
          "docs/CHANGELOG.md",
          "docs/PROJECT-COMPASS.md",
          "docs/project/runbooks/fill-stage-0-context-summary.md",
          "docs/project/runbooks/fill-summary.md",
        ],
        prompt: `Stage 5 — Close the loop for **${project}**.

Tasks:
- Update docs/project/decisions/DECISION-INDEX.md if you created or changed ADRs.
- Update docs/CHANGELOG.md only if the snapshot changed.
- Update docs/PROJECT-COMPASS.md if the truth layer changed materially.
- Write or update docs/project/runbooks/fill-summary.md.

The fill summary must say:
- what you filled in this run,
- what you inferred versus what you found in the repo,
- what you deliberately left as placeholder,
- what needs a human to confirm,
- what was already present before this run.

Then confirm:
- No Accepted decision was invented.
- Every inferred claim is marked Candidate/Needs-confirmation or otherwise flagged.
- Every index that should have changed was updated.
- The fill summary exists and is honest.
- AGENTS.md's mandatory doc-update rule is still intact.

If any of those is false, fix it or say explicitly what is wrong and why.`,
        output: "docs/project/decisions/DECISION-INDEX.md, docs/CHANGELOG.md, docs/PROJECT-COMPASS.md, docs/project/runbooks/fill-summary.md",
      },
      {
        stage: 6,
        title: "Optional orientation refresh",
        filesToRead: [
          "docs/PROJECT-COMPASS.md",
          "docs/LATEST-STATE.md",
          "docs/PROJECT-NARRATIVE.md",
          "docs/DECISION-TRACE.md",
          "docs/project/implementation/implementation-plan.md",
          "docs/START-HERE.md",
        ],
        optional: true,
        prompt: `Optional stage — Refresh docs/PROJECT-COMPASS.md for **${project}**.

PROJECT-COMPASS.md should be a short synthesis of:
- LATEST-STATE.md
- PROJECT-NARRATIVE.md
- DECISION-TRACE.md
- the implementation plan
- START-HERE.md

It should answer four questions:
- What is this project about?
- Where is it leading?
- What is the next step?
- How do I reach it?

Keep it short. If it grows long, fold the detail back into the files it summarizes.
If it conflicts with a detailed file, the detailed file is more authoritative.

Skip this stage if a short synthesis is not possible yet.`,
        output: "docs/PROJECT-COMPASS.md",
      },
    ],
  };
}

function artifactCountsTable(artifacts) {
  const rows = Object.entries(artifacts)
    .filter(([, files]) => files.length > 0 || true)
    .map(([area, files]) => `- ${area}: ${files.length} file(s)`);
  return rows.join("\n");
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

function buildSummary(ctx, pkg, staged) {
  const project = pkg.projectName;
  const version = pkg.handbookVersion;
  const date = pkg.snapshotDate;
  const projectTypeHint = pkg.projectTypeHint;

  return `# Fill Summary — ${project} ${version}

> This file is written or updated by the fill pipeline after a run.
> It is a reviewable record of what the agent did, what it inferred, and what still needs a human.

## Snapshot
- Project: ${project}
- Handbook version: ${version}
- Snapshot date: ${date}
- Project type hint: ${projectTypeHint}
- Generated by: ${SCRIPT_NAME}

## What this run prepared

The fill pipeline prepared staged prompts only. It did not execute them.

- docs/project/runbooks/fill-prompts.json
- docs/project/runbooks/fill-prompts.md
- docs/project/runbooks/fill-summary.md (this file)

## Current handbook state

- Core files exist
- Project body artifacts: see artifact counts below
- Indexes exist as skeletons unless filled

## Existing artifact counts

${artifactCountsTable(ctx.existingArtifacts)}

## Project-type note

The pipeline guessed: ${projectTypeHint}.
The agent should verify this itself before filling.

## Honesty reminders

- No Accepted decision should exist without real evidence.
- Inferred content should be marked Candidate/Needs-confirmation.
- If the project is fresh, much of the handbook will still be placeholder — that is expected.

## Next action

An agent should now follow the staged prompts in docs/project/runbooks/fill-prompts.md,
then review the resulting fill summary and the filled handbook.
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  const target = args.target;
  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
    console.error(`Target directory does not exist: ${target}`);
    process.exit(1);
  }

  const required = [
    path.join(target, "docs", "project", "runbooks", "mining-package.json"),
    path.join(target, "docs", "project", "runbooks", "handbook-fill-plan.md"),
  ];

  for (const f of required) {
    if (!fs.existsSync(f)) {
      console.error(`Required file not found: ${f}`);
      console.error("Run bootstrap-handbook.mjs first.");
      process.exit(1);
    }
  }

  const ctx = loadContext(target);
  const pkg = buildPromptPackage(ctx);
  const staged = buildStagedPrompts(ctx, pkg);
  const summary = buildSummary(ctx, pkg, staged);

  const promptPackage = {
    ...pkg,
    stages: staged.stages,
  };

  const promptsMd = [
    staged.header,
    "",
    "## Meta",
    "",
    "- Project: " + pkg.projectName,
    "- Handbook version: " + pkg.handbookVersion,
    "- Snapshot date: " + pkg.snapshotDate,
    "- Project type hint: " + pkg.projectTypeHint,
    "- Existing doc count: " + pkg.existingDocCount,
    "",
    "## Artifact counts",
    "",
    artifactCountsTable(ctx.existingArtifacts),
    "",
    "## Mandatory instructions",
    "",
    pkg.instructions.mandatoryRules.map((r) => "- " + r).join("\n"),
    "",
    "## Citation rule",
    "",
    pkg.instructions.citationRule,
    "",
    "## Status vocabulary",
    "",
    pkg.instructions.statusVocab.map((s) => "- " + s).join("\n"),
    "",
    "## Stages",
    "",
    staged.stages.map((s) => {
      const optional = s.optional ? " (optional)" : "";
      return [
        `### Stage ${s.stage}${optional} — ${s.title}`,
        "",
        "**Read first:**",
        s.filesToRead.map((f) => "- " + f).join("\n"),
        "",
        s.optionalEvidence ? [
          "**Optional evidence:**",
          s.optionalEvidence.map((f) => "- " + f).join("\n"),
          "",
        ].join("") : "",
        "**Prompt:**",
        "",
        s.prompt,
        "",
        "**Output:** " + s.output,
        "",
      ].filter(Boolean).join("\n");
    }).join("\n"),
  ].join("\n");

  const outDir = path.join(target, "docs", "project", "runbooks");
  writeFile(path.join(outDir, "fill-prompts.json"), JSON.stringify(promptPackage, null, 2) + "\n");
  writeFile(path.join(outDir, "fill-prompts.md"), promptsMd + "\n");
  writeFile(path.join(outDir, "fill-summary.md"), summary + "\n");

  console.log(`Fill prompt package generated for "${pkg.projectName}" (${pkg.handbookVersion}, ${pkg.snapshotDate}).`);
  console.log("Wrote:");
  console.log("  docs/project/runbooks/fill-prompts.json");
  console.log("  docs/project/runbooks/fill-prompts.md");
  console.log("  docs/project/runbooks/fill-summary.md");
  console.log("");
  console.log("Project type hint: " + pkg.projectTypeHint);
  console.log("Existing doc files found: " + pkg.existingDocCount);
  console.log("Staged prompts: " + staged.stages.length);
}

main();

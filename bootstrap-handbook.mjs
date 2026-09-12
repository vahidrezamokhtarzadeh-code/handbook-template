#!/usr/bin/env node
/**
 * Bootstrap the Architecture Handbook into a project.
 *
 * Copies the handbook template next to this script into a target project,
 * promotes agents.md -> AGENTS.md, stamps the project name/version, and
 * generates bootstrapped core files (LATEST-STATE, DECISION-TRACE,
 * PROJECT-NARRATIVE, START-HERE, CHANGELOG).
 *
 * Modes:
 *   --existing  project already created, mid-development (IMPLEMENTED)
 *   --new       brand-new project, start from scratch (not implemented yet)
 *
 * Usage:
 *   node bootstrap-handbook.mjs <project-name> [options]
 *   node bootstrap-handbook.mjs --project <name> [options]
 *
 * Options:
 *   --target <dir>   Project root to bootstrap into (default: current directory)
 *   --existing       Existing project, mid-development (default)
 *   --new            New project from scratch (not implemented yet)
 *   --version <ver>  Handbook version for this snapshot (default: v0.1.0)
 *   --force          Proceed even if AGENTS.md / START-HERE.md already exist
 *   --help           Show this help
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SCRIPT_NAME = path.basename(SCRIPT_PATH);
const SCRIPT_DIR = path.dirname(SCRIPT_PATH);

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    project: null,
    target: process.cwd(),
    mode: "existing",
    version: null,
    date: null,
    force: false,
    fresh: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--project":
        args.project = argv[++i] ?? null;
        break;
      case "--target":
        args.target = argv[++i] ?? process.cwd();
        break;
      case "--version":
        args.version = argv[++i] ?? "v0.1.0";
        break;
      case "--date":
        args.date = argv[++i] ?? null;
        break;
      case "--existing":
        args.mode = "existing";
        break;
      case "--fresh":
        args.mode = "fresh";
        args.fresh = true;
        break;
      case "--force":
        args.force = true;
        break;
      case "--help":
        args.help = true;
        break;
      default:
        if (a.startsWith("-")) {
          console.error(`Unknown flag: ${a}`);
          process.exit(1);
        }
        // First positional argument is the project name.
        if (!args.project) args.project = a;
    }
  }
  return args;
}  function printUsage() {
  console.log(`Bootstrap the Architecture Handbook into a project.

Usage:
  node ${SCRIPT_NAME} <project-name> [options]
  node ${SCRIPT_NAME} --project <name> [options]

Options:
  --target <dir>   Project root to bootstrap into (default: current directory)
  --existing       Existing project, mid-development (default; implemented)
  --fresh          Fresh/new/near-empty project (implemented)
  --version <ver>  Handbook version for this snapshot (default: inferred or v0.1.0)
  --date <date>    Handbook snapshot date YYYY-MM-DD (default: inferred or today)
  --force          Proceed even if AGENTS.md / START-HERE.md already exist
  --help           Show this help`);
  }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Recursively collect relative paths of all .md files under root. */
function walkMd(root, dir = "", out = []) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) walkMd(root, rel, out);
    else if (entry.isFile() && rel.endsWith(".md")) out.push(rel);
  }
  return out;
}

/** Stamp project name/version/date into every copied markdown file. */
function stampPlaceholders(target, project, version, date) {
  const stampDate = date || today();
  // Walk both the target root and the docs/ subdirectory.
  for (const dir of ["", "docs"]) {
    const root = dir ? path.join(target, dir) : target;
    if (!fs.existsSync(root)) continue;
    for (const rel of walkMd(root)) {
      const file = path.join(root, rel);
      const content = fs.readFileSync(file, "utf8");
      const updated = content
        .replaceAll("<version / slice>", `${version} — <slice>`)
        .replaceAll("<version + phase>", `${version} — <phase>`)
        .replaceAll("<Project Name>", project)
        .replaceAll("<v0.1.0>", version)
        .replaceAll("<version>", version)
        .replaceAll("<date>", stampDate);
      if (updated !== content) fs.writeFileSync(file, updated, "utf8");
    }
  }
}

// ---------------------------------------------------------------------------
// Project identity / version / date inference (no LLM)
// ---------------------------------------------------------------------------

/**
 * Infer a plausible project name from the target tree, in this order:
 *   1. package.json "name"  (if present and non-empty)
 *   2. git remote origin basename (if a git repo exists)
 *   3. target directory basename
 *
 * Returns null when nothing usable is found.
 */
function inferProjectName(target) {
  const trimmed = (s) => (s || "").trim();

  // 1. package.json
  try {
    const pkgPath = path.join(target, "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      const name = trimmed(pkg.name);
      if (name) return name;
    }
  } catch {}

  // 2. git remote
  try {
    if (fs.existsSync(path.join(target, ".git")) || fs.existsSync(path.join(target, ".git", "HEAD"))) {
      const remote = runSync("git", ["config", "--get", "remote.origin.url"]);
      if (trimmed(remote)) {
        // Strip common suffixes to get a repo-ish name.
        let name = path.basename(trimmed(remote));
        name = name.replace(/\.git$/i, "").replace(/[\.@].*$/, "");
        if (name) return name;
      }
    }
  } catch {}

  // 3. target directory basename
  const base = path.basename(path.resolve(target));
  if (base && base !== "." && base !== "..") return base;

  return null;
}

/**
 * Infer a handbook version from the target tree, in this order:
 *   1. --version (explicit)
 *   2. package.json "version"
 *   3. first entry in an existing docs/CHANGELOG.md
 *   4. default "v0.1.0"
 *
 * Returns { value, source }.
 */
function resolveVersion(args) {
  const trimmed = (s) => (s || "").trim();

  if (args.version !== null && trimmed(args.version)) {
    return { value: trimmed(args.version), source: "--version" };
  }

  try {
    const pkgPath = path.join(args.target, "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      const v = trimmed(pkg.version);
      if (v) return { value: "v" + v, source: "package.json version" };
    }
  } catch {}

  try {
    const changelogPath = path.join(args.target, "docs", "CHANGELOG.md");
    if (fs.existsSync(changelogPath)) {
      const text = fs.readFileSync(changelogPath, "utf8");
      // Grab the version token from the first entry heading, e.g. "## v0.7.3 — 2026-09-12".
      const match = text.match(/^##\s+([^\s—-]+)/m);
      if (match && trimmed(match[1])) {
        return { value: trimmed(match[1]), source: "docs/CHANGELOG.md latest entry" };
      }
    }
  } catch {}

  return { value: "v0.1.0", source: "default" };
}

/**
 * Infer a snapshot date from the target tree, in this order:
 *   1. --date
 *   2. date of the latest docs/CHANGELOG.md entry
 *   3. today
 *
 * Returns { value, source }.
 */
function resolveDate(args) {
  const trimmed = (s) => (s || "").trim();

  if (trimmed(args.date)) {
    // Accept bare YYYY-MM-DD; normalise to ISO date.
    const m = args.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`);
      if (!isNaN(d.getTime())) return { value: d.toISOString().slice(0, 10), source: "--date" };
    }
    // Fallback: treat as today if it looks like a label; do not guess.
    return { value: today(), source: "--date (normalised to today)" };
  }

  try {
    const changelogPath = path.join(args.target, "docs", "CHANGELOG.md");
    if (fs.existsSync(changelogPath)) {
      const text = fs.readFileSync(changelogPath, "utf8");
      const sep = String.fromCharCode(0x2014); // em dash
      const spaceClass = String.fromCharCode(0x5c, 0x73); // \s
      const nlClass = String.fromCharCode(0x5c, 0x6e); // \n
      const reSrc =
        "^##" + spaceClass + "+([^/" + spaceClass + sep + "-]+" + spaceClass + "+[" + sep + "-" + spaceClass + "+([^/" + nlClass + "+";
      const match = text.match(new RegExp(reSrc, "m"));
      if (match && trimmed(match[2])) {
        const d = new Date(trimmed(match[2]));
        if (!isNaN(d.getTime())) return { value: d.toISOString().slice(0, 10), source: "docs/CHANGELOG.md latest entry date" };
      }
    }
  } catch {}

  return { value: today(), source: "today" };
}

/**
 * Best-effort child process for non-sensitive sync inspection commands.
 * Intended for repo/tool detection only.
 */
function runSync(cmd, args) {
  try {
    const { execFileSync } = require("child_process");
    return execFileSync(cmd, args, { cwd: process.cwd(), encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// Generated core files (existing-project bootstrap)
// ---------------------------------------------------------------------------

function latestState(project) {
  return `# Latest State — ${project}

> Bootstrapped automatically for an existing project in mid-development.
> This file is the "what is true now" anchor. Fill it in as you capture decisions.

## Direction

<One paragraph: what the system is, expressed in capabilities, not tool names.>

### Deployment (current)
- <e.g. Docker Compose; Kubernetes outside MVP>

---

## Accepted — <Topic 1>

<Current decision in plain language. Add one section per Accepted decision you capture:
what it is responsible for, what it is explicitly NOT responsible for, and principles.>

## Accepted — <Topic 2>

...

---

## Explicitly NOT Accepted as Domain Concepts

- <Concept> — <why not modeled>

---

## Deferred / Open Decisions

- <item 1>
- <item 2>

(For a full per-item write-up, see \`project/open-decisions/\`.)

---

## Technology — Current Implementation Choices

| Concern | Choice | Status |
|---|---|---|
| <Runtime> | <e.g. Node.js + TypeScript> | Accepted |
| <Database> | <e.g. PostgreSQL> | Accepted |
| <Tool X> | <Name> | Candidate / needs validation |

---

## Current Phase

Existing project, mid-development — handbook bootstrapped. First task: capture decisions
already made (code, PRs, past chats) into \`DECISION-TRACE.md\` and \`PROJECT-NARRATIVE.md\`.

Next action: <one sentence>

For the *why* behind these decisions read \`PROJECT-NARRATIVE.md\` and \`DECISION-TRACE.md\` —
they are part of the official handoff.
`;
}

function decisionTrace() {
  return `# Decision Trace — Story/Evidence -> Decision -> Why

> Bootstrapped for an existing project. First job: add one row per decision the project has
> ALREADY made. The Evidence cell must point at something real (story, PR, incident,
> conversation) — never an invented one. The last column matters as much as the decision.

| Topic | Evidence / Story | Current Decision | Why | What we deliberately did NOT build |
|---|---|---|---|---|
| <first topic to capture> | <where the evidence lives, e.g. PR #12, story-001> | <decision as it stands in code today> | <rationale, even if reconstructed> | <rejected alternative, if known> |
| <...> | | | | |

## How to maintain

- Add a row whenever a decision is Accepted or an existing decision changes.
- For an existing project, mine git history, PRs, and past chats for decisions already made.
- If a decision needs more depth, write an ADR in \`project/decisions/\` and reference it here.
`;
}

function projectNarrative() {
  return `# Project Narrative — Why the architecture is shaped this way

> Bootstrapped for an existing project. This file preserves the *cause* of the architecture's
> shape, so a new engineer/chat does not redesign past decisions based only on how things look.

## How to write this file

- One numbered section per "why" question that has a real causal story.
- Reconstruct from existing evidence: code structure, PR descriptions, past decisions, incidents.
- Each section: triggering evidence → decision → reasoning → what was deliberately avoided.
- Reference the ADR/story/document where each decision lives.

## 1. Why <first big decision>

<Evidence that triggered it.>
<Why the alternative was rejected.>
<What was deliberately not built.>

## 2. Why <second big decision>

...

(Keep adding sections as you capture and as the project evolves.)
`;
}

function startHere(project, version) {
  return `# START HERE — ${project} Handbook ${version}

This file is written for a new Chat/Tool/Engineer continuing this project.

## Mandatory reading order

Reading only *what* was decided is not enough; the *why* is part of the architecture. Read in this order:

1. \`LATEST-STATE.md\` — what is true now: Accepted/Candidate/Deferred/Open.
2. \`PROJECT-NARRATIVE.md\` — the causal story behind the architecture's shape.
3. \`DECISION-TRACE.md\` — evidence/story → decision → why → deliberately-not-built.
4. \`CONTEXT-COVERAGE.md\` — which discoveries are preserved and where.
5. \`project/runbooks/new-chat-continuation.md\` — how to continue work.
6. \`SOURCE-HANDOFF.md\` and repository-root \`IMPLEMENTATION-STATUS.md\` if source accompanies the handbook.
7. The ADR relevant to whatever you are about to change.

## Before implementing, also read

- \`EXECUTABLE-DESIGN-INDEX.md\`
- <list the executable design docs: contracts, flows, data model, implementation plan, remaining gates>

## Rules for continuing the project

- Treat Accepted/Confirmed as current truth unless a new Story invalidates it.
- Do not unilaterally finalize Candidate/TBD/Open items.
- Before changing an Accepted decision, read the Context/Rationale in its ADR and the Decision Trace.
- Do not remove MVP simplifications: incomplete-looking things are often deliberately Deferred.
- No speculative abstraction: no generic rule engines, entities, microservices, or DSLs for future-proofing.
- Express domain/architecture in capabilities; keep tool names in technology decisions.
- <add project-specific continuation rules here>

## Current status of work

Phase: existing project, mid-development — handbook is being bootstrapped; decisions made before
this snapshot still need to be captured into \`DECISION-TRACE.md\`, \`PROJECT-NARRATIVE.md\`, and ADRs.

Current next action: <one sentence>

## Versioning

This handbook is snapshotted after each meaningful design block. Current version: ${version}. See \`CHANGELOG.md\`.
`;
}

function changelog(project, version, date) {
  return `# Changelog

Handbook + implementation snapshots, newest first. Snapshot after every meaningful design block.

## ${version} — ${date}

### Added
- Bootstrapped the architecture handbook for ${project} (existing project, mid-development).
- Handoff surface: AGENTS.md, START-HERE.md, EXECUTABLE-DESIGN-INDEX.md, SOURCE-HANDOFF.md.
- Truth + causal memory: LATEST-STATE.md, PROJECT-NARRATIVE.md, DECISION-TRACE.md, CONTEXT-COVERAGE.md.
- project/ body templates (stories, decisions, domain, architecture, technology, data-model, contracts, open-decisions, implementation, runbooks) and architect-journal/.

### Next
- Capture decisions already made into DECISION-TRACE.md and PROJECT-NARRATIVE.md.
- Fill LATEST-STATE.md with current Accepted/Deferred/Open items and the technology table.
`;
}

// ---------------------------------------------------------------------------
// Pre-flight inspection (observable facts only, no LLM)
// ---------------------------------------------------------------------------

const DETECTABLE_INFRA = [
  "docker-compose.yml",
  "docker-compose.yaml",
  "Dockerfile",
  "package.json",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "settings.gradle.kts",
  "Cargo.toml",
  "go.mod",
  "Gemfile",
  "Makefile",
  "pyproject.toml",
  "requirements.txt",
  "mvnw",
  "gradlew",
];

function inspectTarget(target, opts = {}) {
  const excludeHandbook = opts.excludeHandbook || false;
  const out = {
    hasGit: false,
    gitRemotes: [],
    recentActivity: [],
    packageJson: null,
    infraFiles: [],
    existingHandoff: [],
    readme: null,
    changelog: null,
    seemsCodeRepo: false,
    seemsBookProject: false,
  };

  // git
  try {
    if (fs.existsSync(path.join(target, ".git")) || fs.existsSync(path.join(target, ".git", "HEAD"))) {
      out.hasGit = true;
      const remote = runSync("git", ["config", "--get", "remote.origin.url"]);
      if (remote) out.gitRemotes.push(remote);
      try {
        const log = runSync("git", ["log", "--oneline", "-n", "8"]);
        if (log) out.recentActivity = log.split("\n").filter(Boolean).slice(0, 8);
      } catch {}
    }
  } catch {}

  // package.json
  try {
    const pkgPath = path.join(target, "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      if (pkg && typeof pkg === "object") {
        out.packageJson = {
          name: pkg.name,
          version: pkg.version,
          scripts: pkg.scripts ? Object.keys(pkg.scripts) : [],
        };
        out.seemsCodeRepo = true;
      }
    }
  } catch {}

  // infra / build files
  for (const f of DETECTABLE_INFRA) {
    if (fs.existsSync(path.join(target, f))) out.infraFiles.push(f);
  }
  if (out.infraFiles.length > 0) out.seemsCodeRepo = true;

  // existing handoff-like files
  const handoffCandidates = [
    "README.md",
    "CONTRIBUTING.md",
    "AGENTS.md",
    "CLAUDE.md",
    "Cursor.md",
    "GEMINI.md",
    "docs/README.md",
    "docs/START-HERE.md",
    "docs/LATEST-STATE.md",
    "docs/PROJECT-NARRATIVE.md",
    "docs/DECISION-TRACE.md",
    "docs/CHANGELOG.md",
    "docs/SOURCE-HANDoff.md",
    "docs/SOURCE-HANDOFF.md",
  ];
  for (const f of handoffCandidates) {
    if (fs.existsSync(path.join(target, f))) out.existingHandoff.push(f);
  }
  if (out.existingHandoff.length > 0 && !excludeHandbook) out.seemsCodeRepo = true;

  // README presence
  if (fs.existsSync(path.join(target, "README.md"))) out.readme = "README.md";

  // changelog presence
  if (fs.existsSync(path.join(target, "docs", "CHANGELOG.md"))) out.changelog = "docs/CHANGELOG.md";

  // book-project heuristics: manuscript-ish files outside docs/ and no code markers.
  // docs/ is where the handbook lives, so it is not indicative of project type.
  const bookishExt = [".md", ".markdown", ".txt", ".rst", ".tex", ".texi", ".asciidoc", ".adoc"];
  const codeExt = /^\.(js|ts|jsx|tsx|kt|kts|java|go|rs|py|rb|php|c_pp|c|swift|scala|clj|ex|exs|elm|vue|svelte|astro|html|css|scss|less|json|yaml|yml|toml|xml)$/;
  let bookishCount = 0;
  let codeCount = 0;
  try {
    for (const entry of walkDir(target)) {
      // Skip the handbook docs tree for project-type detection.
      if (entry.startsWith(path.join(target, "docs"))) continue;
      const ext = path.extname(entry).toLowerCase();
      if (bookishExt.includes(ext)) bookishCount += 1;
      if (codeExt.test(ext)) codeCount += 1;
    }
  } catch {}
  if (!out.seemsCodeRepo && bookishCount >= 3 && bookishCount >= codeCount) {
    out.seemsBookProject = true;
  }

  return out;
}

/** Lightweight non-recursive directory walker for detection only. */
function walkDir(root) {
  const out = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules" && entry.name !== ".git" && !entry.name.startsWith(".")) {
          stack.push(rel);
        }
      } else {
        out.push(rel);
      }
    }
  }
  return out;
}

/** Turn an inspect result into a stable JSON mining package written into the target. */
function miningPackagePath(target) {
  return path.join(target, "docs", "project", "runbooks", "mining-package.json");
}

function writeMiningPackage(target, project, version, date, inspection) {
  const pkg = {
    handbookVersion: version,
    snapshotDate: date,
    generatedBy: SCRIPT_NAME,
    projectName: project,
    inferenceSources: {},
    targetRoot: path.resolve(target),
    detected: {
      hasGit: inspection.hasGit,
      gitRemotes: inspection.gitRemotes,
      recentActivity: inspection.recentActivity,
      packageJson: inspection.packageJson,
      infraFiles: inspection.infraFiles,
      existingHandoff: inspection.existingHandoff,
      readme: inspection.readme,
      changelog: inspection.changelog,
      seemsCodeRepo: inspection.seemsCodeRepo,
      seemsBookProject: inspection.seemsBookProject,
    },
    placeholderCoverage: {
      // Tags that the bootstrap can mechanically resolve.
      resolved: ["<Project Name>", "<v0.1.0>", "<version>", "<version / slice>", "<version + phase>", "<date>"],
      unresolved: [
        "<one sentence>",
        "<One paragraph: what the system is, expressed in capabilities, not tool names.>",
        "<e.g. Docker Compose; Kubernetes outside MVP>",
        "<Runtime>",
        "<Database>",
        "<Tool X>",
        "<first topic to capture>",
        "<where the evidence lives, e.g. PR #12, story-001>",
        "<decision as it stands in code today>",
        "<rationale, even if reconstructed>",
        "<rejected alternative, if known>",
        "<first big decision>",
        "<Evidence that triggered it.>",
        "<Why the alternative was rejected.>",
        "<What was deliberately not built.>",
        "<doc title>",
        "<scope>",
        "<Short Name>",
        "<Concept Name>",
        "<Tool/Domain area>",
        "<schema-name>.schema.json — <purpose>",
        "<version / slice>",
        "<version + phase>",
        "<v0.1.0>",
        "<discovery / executable design / implementation — current phase and slice>",
        "<add project-specific continuation rules here>",
        "<list the executable design docs: contracts, flows, data model, implementation plan, remaining gates>",
        "<component boundaries → contracts → data model → flows → deployment → implementation slices>",
        "<decision 1 and its one-line rationale>",
        "<decision 2 and its one-line rationale>",
      ],
    },
    handbookInventory: {
      core: [
        "docs/START-HERE.md",
        "docs/LATEST-STATE.md",
        "docs/PROJECT-NARRATIVE.md",
        "docs/DECISION-TRACE.md",
        "docs/CONTEXT-COVERAGE.md",
        "docs/EXECUTABLE-DESIGN-INDEX.md",
        "docs/SOURCE-HANDOFF.md",
        "docs/CHANGELOG.md",
      ],
      orientation: [
        "docs/PROJECT-COMPASS.md",
      ],
      projectBody: {
        stories: "docs/project/stories/",
        decisions: "docs/project/decisions/",
        domain: "docs/project/domain/",
        architecture: "docs/project/architecture/",
        technology: "docs/project/technology/",
        dataModel: "docs/project/data-model/",
        contracts: "docs/project/contracts/",
        openDecisions: "docs/project/open-decisions/",
        implementation: "docs/project/implementation/",
        runbooks: "docs/project/runbooks/",
      },
      architectJournal: {
        principles: "docs/architect-journal/principles/",
        patterns: "docs/architect-journal/patterns/",
        heuristics: "docs/architect-journal/heuristics/",
        mistakes: "docs/architect-journal/mistakes/",
        glossary: "docs/architect-journal/glossary/glossary.md",
      },
    },
    projectTypeHint: inspection.seemsBookProject ? "possible-book-project" : inspection.seemsCodeRepo ? "likely-code-project" : "unrecognized",
  };
  return pkg;
}

function writeFillPlan(target, project, version, date, mode, inspection) {
  const phase = mode === "fresh"
    ? "fresh / start-from-scratch"
    : inspection.hasGit
      ? "existing project with history"
      : "existing project without detected history";

  return `# Handbook Fill Plan — ${project} ${version}

> This plan is generated by ${SCRIPT_NAME} during bootstrap.
> It describes the staged work an AI agent (e.g. Freebuff) should perform to fill this handbook.
> It is also the reviewable summary a human should read before/after the agent runs.

## Snapshot

- Project: ${project}
- Handbook version: ${version}
- Snapshot date: ${date}
- Bootstrap mode: ${phase}
- Generated by: ${SCRIPT_NAME}

## Reading this plan

- Status tags are part of the handbook's honesty contract: ${project}'s handbook must not present inferred content as Accepted unless there is real evidence.
- Each stage below is a separate prompt the agent should follow in order.
- Do not skip a stage; later stages depend on earlier ones.
- After each stage, record what was filled, what is still placeholder, and what needs a human.

## Mandatory doc-update rule

- After any decision or change, update the relevant handbook doc(s) and the indexes.
- Keep status tags honest: Accepted only with real evidence; inferred content stays Candidate/Needs-confirmation.
- Keep DECISION-TRACE.md and PROJECT-NARRATIVE.md in sync with accepted decisions.
- If a file is not updated because there is no new evidence, state that explicitly rather than leaving it silently stale.
- This rule lives in AGENTS.md and applies to humans and agents.

## What this bootstrap could and could not do

### Resolved mechanically

- Project name: ${project}
- Handbook version: ${version}
- Snapshot date: ${date}
- Core skeleton files created
- Template directory copied
- agents.md promoted to AGENTS.md
- Placeholders the bootstrap can resolve have been stamped

### Not resolved here (leave for the agent / human)

- Real decisions, rationales, and causal stories
- Any Accepted status that lacks real evidence
- Project-specific continuation rules
- Which project body folders to keep or prune

## Detected context (summary)

${inspectionSummary(inspection)}

## Stage plan

See \`docs/project/runbooks/fill-handbook-stages.md\` for the staged prompts.

## Current handbook state

- Core files: created by bootstrap
- Project body artifacts: not created
- Index/coverage files: created by bootstrap as skeletons
- First numbered artifacts: left for the agent fill stage
- Practical next action: run the fill pipeline, then review the summary it writes
`;
}

function inspectionSummary(inspection) {
  const parts = [];
  parts.push(`- git repo: ${inspection.hasGit ? "yes" : "no"}`);
  if (inspection.gitRemotes.length) parts.push(`- git remotes: ${inspection.gitRemotes.join(", ")}`);
  if (inspection.recentActivity.length) parts.push(`- recent activity (last up to 8):\n${indentLines(inspection.recentActivity.map((l) => "  - " + l))}`);
  if (inspection.packageJson) parts.push(`- package.json: name=${inspection.packageJson.name}, version=${inspection.packageJson.version}, scripts=${inspectScripts(inspection.packageJson.scripts)}`);
  if (inspection.infraFiles.length) parts.push(`- detected infra/build files: ${inspection.infraFiles.join(", ")}`);
  if (inspection.existingHandoff.length) parts.push(`- existing handoff-like files: ${inspection.existingHandoff.join(", ")}`);
  if (inspection.readme) parts.push(`- README.md present: yes`);
  if (inspection.changelog) parts.push(`- existing CHANGELOG.md: yes`);
  parts.push(`- seems like a code repo: ${inspection.seemsCodeRepo ? "yes" : "no"}`);
  parts.push(`- seems like a book/manuscript project: ${inspection.seemsBookProject ? "yes" : "no"}`);
  return parts.join("\n");
}

function indentLines(lines) {
  return lines.join("\n");
}

function inspectScripts(scripts) {
  if (!scripts || !scripts.length) return "none detected";
  return scripts.slice(0, 12).join(", ") + (scripts.length > 12 ? ", ..." : "");
}

// ---------------------------------------------------------------------------
// Main flow
// ---------------------------------------------------------------------------

function ensureAgentsMd(source, target) {
  // If the template still has agents.md at copy time, it should be present.
  const agentsSrc = path.join(target, "agents.md");
  const agentsDst = path.join(target, "AGENTS.md");
  if (fs.existsSync(agentsSrc)) {
    fs.renameSync(agentsSrc, agentsDst);
    return true;
  }
  return false;
}

function copyTemplate(source, target) {
  fs.cpSync(source, target, {
    recursive: true,
    filter: (src) => path.basename(src) !== SCRIPT_NAME,
  });
}

function stampTarget(target, project, version, date) {
  stampPlaceholders(target, project, version, date);
}

function generateCoreFilesFor(target, project, version, date) {
  const docsDir = path.join(target, "docs");
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, "LATEST-STATE.md"), latestState(project), "utf8");
  fs.writeFileSync(path.join(docsDir, "DECISION-TRACE.md"), decisionTrace(), "utf8");
  fs.writeFileSync(path.join(docsDir, "PROJECT-NARRATIVE.md"), projectNarrative(), "utf8");
  fs.writeFileSync(path.join(docsDir, "START-HERE.md"), startHere(project, version), "utf8");
  fs.writeFileSync(path.join(docsDir, "CHANGELOG.md"), changelog(project, version, date), "utf8");
}

function writeOrientationStub(target, project, version) {
  const docsDir = path.join(target, "docs");
  const compassPath = path.join(docsDir, "PROJECT-COMPASS.md");
  if (fs.existsSync(compassPath)) return;
  fs.writeFileSync(
    compassPath,
    `# Project Compass — ${project}

> Short synthesis of what this project is about, where it leads, what the next step is, and how to reach it.
> This file is a summary of the other handbook files, not a replacement for them.
> Keep it short. If it grows long, fold the detail back into the files it summarizes.

## What this project is about

<One or two sentences. For a human or agent picking this up cold: what is the purpose here?>

## Where it leads

<Current direction / target state in plain language.>

## Status snapshot

- Handbook version: ${version}
- Phase: <discovery / executable design / implementation / ...>
- Confidence: <what is Accepted vs Candidate vs deferred>

## Next step

<One sentence.>

## How to reach it

- Read \`START-HERE.md\` first.
- Then \`LATEST-STATE.md\`, \`PROJECT-NARRATIVE.md\`, \`DECISION-TRACE.md\`.
- Then the relevant ADR and the implementation plan.

## Where to find the detail

- \`LATEST-STATE.md\` — what is true now.
- \`PROJECT-NARRATIVE.md\` — why it is true.
- \`DECISION-TRACE.md\` — evidence → decision → why.
- \`docs/project/runbooks/fill-handbook-stages.md\` — how the handbook gets filled.
- \`AGENTS.md\` — working rules for this repository.

> If this file disagrees with a detailed file, the detailed file is more authoritative.
`,
    "utf8"
  );
}

function copyTemplateIfFresh(source, target) {
  const targetDocs = path.join(target, "docs");
  if (!fs.existsSync(targetDocs) || !fs.statSync(targetDocs).isDirectory()) {
    copyTemplate(source, target);
    ensureAgentsMd(source, target);
    return true;
  }
  // If docs/ exists, treat the project as already having a skeleton; still ensure AGENTS.md.
  ensureAgentsMd(source, target);
  return false;
}

function bootstrapExisting(args) {
  const source = path.resolve(SCRIPT_DIR);
  const target = path.resolve(args.target);

  const errors = validateTarget(source, target);
  if (errors) {
    console.error(errors);
    process.exit(1);
  }

  // Inspect the target *before* copying, so the preflight reports the real pre-bootstrap state.
  const preInspection = inspectTarget(target);
  printPreflight(args.project, args.version, args.date, args.mode, preInspection);

  const conflict = ["AGENTS.md", "docs/START-HERE.md"].find((f) => fs.existsSync(path.join(target, f)));
  if (conflict && !args.force) {
    console.error(
      `"${conflict}" already exists in ${target} — this project looks already bootstrapped.\n` +
        `Re-run with --force to overwrite the core files (other files are re-copied too).`
    );
    process.exit(1);
  }

  copyTemplateIfFresh(source, target);
  ensureAgentsMd(source, target);
  stampTarget(target, args.project, args.version, args.date);
  generateCoreFilesFor(target, args.project, args.version, args.date);
  writeOrientationStub(target, args.project, args.version);

  // Re-inspect after copy so the mining package reflects the actual tree the agent will see.
  // For project-type detection, exclude the handbook tree so the template does not contaminate the result.
  const postInspection = inspectTarget(target, { excludeHandbook: true });
  const pkg = writeMiningPackage(target, args.project, args.version, args.date, postInspection);
  fs.mkdirSync(path.dirname(miningPackagePath(target)), { recursive: true });
  fs.writeFileSync(miningPackagePath(target), JSON.stringify(pkg, null, 2) + "\n", "utf8");

  const planText = writeFillPlan(target, args.project, args.version, args.date, args.mode, preInspection);
  fs.mkdirSync(path.join(target, "docs", "project", "runbooks"), { recursive: true });
  fs.writeFileSync(path.join(target, "docs", "project", "runbooks", "handbook-fill-plan.md"), planText, "utf8");

  printCreated(args.project, args.version, args.date);
  printAgentNextSteps(args.project);
  printReviewNotes(args.project);
}

function bootstrapFresh(args) {
  const source = path.resolve(SCRIPT_DIR);
  const target = path.resolve(args.target);

  const errors = validateTarget(source, target);
  if (errors) {
    console.error(errors);
    process.exit(1);
  }

  // Inspect the target *before* copying so the preflight reports the real pre-bootstrap state.
  const preInspection = inspectTarget(target);
  printPreflight(args.project, args.version, args.date, args.mode, preInspection);

  const freshConflict = ["AGENTS.md", "docs/START-HERE.md"].find((f) => fs.existsSync(path.join(target, f)));
  if (freshConflict && !args.force) {
    console.error(
      `"${freshConflict}" already exists in ${target} — this target looks like it already has a handbook.\n` +
        `For a truly fresh start, remove the existing handbook first, or re-run with --force to overwrite.`
    );
    process.exit(1);
  }

  // Fresh/near-empty projects: copy the template cleanly.
  copyTemplate(source, target);
  ensureAgentsMd(source, target);

  stampTarget(target, args.project, args.version, args.date);
  generateCoreFilesFor(target, args.project, args.version, args.date);
  writeOrientationStub(target, args.project, args.version);

  // Re-inspect after copy so the mining package reflects the actual tree the agent will see.
  // For project-type detection, exclude the handbook tree so the template does not contaminate the result.
  const postInspection = inspectTarget(target, { excludeHandbook: true });
  const pkg = writeMiningPackage(target, args.project, args.version, args.date, postInspection);
  fs.mkdirSync(path.dirname(miningPackagePath(target)), { recursive: true });
  fs.writeFileSync(miningPackagePath(target), JSON.stringify(pkg, null, 2) + "\n", "utf8");

  const planText = writeFillPlan(target, args.project, args.version, args.date, args.mode, preInspection);
  fs.mkdirSync(path.join(target, "docs", "project", "runbooks"), { recursive: true });
  fs.writeFileSync(path.join(target, "docs", "project", "runbooks", "handbook-fill-plan.md"), planText, "utf8");

  printCreated(args.project, args.version, args.date);
  printAgentNextSteps(args.project);
  printFreshReviewNotes(args.project);
}

function validateTarget(source, target) {
  if (target === source) {
    return `Target must differ from the template directory itself: ${source}`;
  }
  const relTarget = path.relative(source, target);
  const targetInsideSource =
    relTarget !== "" && !relTarget.startsWith("..") && !path.isAbsolute(relTarget);
  const relSource = path.relative(target, source);
  const sourceInsideTarget =
    relSource !== "" && !relSource.startsWith("..") && !path.isAbsolute(relSource);
  if (targetInsideSource || sourceInsideTarget) {
    return (
      `Target must not contain the template directory or be inside it.\n` +
        `  template: ${source}\n  target:   ${target}`
    );
  }
  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
    return `Target directory does not exist: ${target}`;
  }
  return null;
}

function printPreflight(project, version, date, mode, inspection) {
  console.log(`
Bootstrapping Architecture Handbook for "${project}" (${version}) into ${path.resolve(inspection && inspection.targetRoot ? inspection.targetRoot : process.cwd())}

Mode: ${mode === "fresh" ? "fresh / start-from-scratch" : "existing project"}
Snapshot date: ${date}

Detected context:
${inspectionSummary(inspection)}
`);
}

function printCreated(project, version, date) {
  console.log("Created / updated:");
  console.log("  AGENTS.md");
  console.log("  docs/PROJECT-COMPASS.md");
  console.log("  docs/START-HERE.md, docs/LATEST-STATE.md, docs/PROJECT-NARRATIVE.md,");
  console.log("  docs/DECISION-TRACE.md, docs/CONTEXT-COVERAGE.md, docs/EXECUTABLE-DESIGN-INDEX.md,");
  console.log("  docs/SOURCE-HANDOFF.md, docs/CHANGELOG.md");
  console.log("  docs/project/runbooks/mining-package.json");
  console.log("  docs/project/runbooks/handbook-fill-plan.md");
  console.log("  docs/project/..., docs/architect-journal/... (template skeletons)");
}

function printAgentNextSteps(project) {
  console.log(`
To fill the handbook, an AI agent (e.g. Freebuff) should now read:

  1. docs/PROJECT-COMPASS.md
  2. docs/START-HERE.md
  3. docs/project/runbooks/handbook-fill-plan.md
  4. docs/project/runbooks/mining-package.json

Then follow the staged prompts in:
  docs/project/runbooks/fill-handbook-stages.md

The agent should not invent Accepted decisions. Inferred content stays Candidate/Needs-confirmation unless there is real evidence.
`);
}

function printReviewNotes(project) {
  console.log(`
Human review checklist:
  1. Read docs/PROJECT-COMPASS.md and correct any inaccurate synthesis.
  2. Read docs/LATEST-STATE.md and replace placeholder-only sections with real content.
  3. Read docs/DECISION-TRACE.md and add only evidence-backed rows.
  4. Read docs/PROJECT-NARRATIVE.md and add real "why" sections.
  5. Read docs/START-HERE.md and set the current phase, next action, and project-specific rules.
  6. After any later change, update the affected docs and indexes (see AGENTS.md).
`);
}

function printFreshReviewNotes(project) {
  console.log(`
Human review checklist (fresh/near-empty project):
  1. Define what this project is for and write it into docs/PROJECT-COMPASS.md and docs/LATEST-STATE.md.
  2. Decide the first slice and put the next action into docs/START-HERE.md.
  3. After the first real decisions exist, fill docs/DECISION-TRACE.md and docs/PROJECT-NARRATIVE.md.
  4. After any later change, update the affected docs and indexes (see AGENTS.md).
`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    process.exit(0);
  }
  if (!args.project) {
    const inferred = inferProjectName(args.target);
    if (inferred) {
      args.project = inferred;
      console.log(`Inferred project name: ${args.project}`);
    } else {
      console.error("Missing project name. Pass it as the first argument or with --project.\n");
      printUsage();
      process.exit(1);
    }
  }
  const versionSrc = resolveVersion(args);
  args.version = versionSrc.value;
  if (versionSrc.source) console.log(`Inferred handbook version: ${args.version} (${versionSrc.source})`);
  const dateSrc = resolveDate(args);
  args.date = dateSrc.value;
  if (dateSrc.source) console.log(`Inferred snapshot date: ${args.date} (${dateSrc.source})`);
  if (args.mode === "new") {
    console.error(
      "--new is deprecated. Use --fresh for a fresh/new/near-empty project.\n" +
        "For a brand-new project without history, --fresh is the recommended mode."
    );
    process.exit(1);
  }
  if (args.mode === "existing") bootstrapExisting(args);
  else if (args.mode === "fresh") bootstrapFresh(args);
  else bootstrapExisting(args);
}

main();

#!/usr/bin/env node
/**
 * Design QA Agent — workshop stub
 *
 * Runs on every pull request. Fetches the diff, checks it against the
 * design system's component manifest, and posts a pass/fail result back
 * to the PR.
 *
 * ALREADY WIRED: fetching the diff, reading the manifest, calling
 * Claude, handling API errors, parsing the response, posting the
 * result, exiting with the right status code.
 *
 * YOUR JOB: fill in buildPrompt() — write the prompt that decides
 * whether the diff follows the design system.
 *
 * File paths below are placeholders. Update them to match your repo.
 */

import fs from "node:fs";

// --- Placeholders — update these to match your repo structure ---
const PLACEHOLDER_MANIFEST_PATH = "./manifest.json"; // now pointed at the real manifest
const CLAUDE_MODEL = "claude-sonnet-5-5"; // claude-haiku-5-5 is cheaper but less precise on line numbers

// ============================================================
// ALREADY WIRED — fetch the PR diff
// ============================================================
async function fetchDiff() {
  const repo = process.env.GITHUB_REPOSITORY; // e.g. "your-username/your-repo"
  const prNumber = process.env.PR_NUMBER;
  const token = process.env.GITHUB_TOKEN;

  const res = await fetch(
    `https://api.github.com/repos/${repo}/pulls/${prNumber}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3.diff",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch diff: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

// ============================================================
// ALREADY WIRED — read the component manifest
// ============================================================
function readManifest() {
  return fs.readFileSync(PLACEHOLDER_MANIFEST_PATH, "utf-8");
}

// ============================================================
// YOUR JOB — write the prompt
//
// This is the only part you need to write. Everything else below
// (calling the API, handling errors, parsing the result) is already
// wired up and working.
//
// Write a prompt that asks Claude to compare the diff against the
// manifest and decide pass/fail. Things worth including:
//   - Reference the manifest explicitly, don't just say "the design system"
//   - Say what counts as an issue: breaking a rule in the manifest,
//     and nothing else. Then adding a rule to the manifest is enough
//     to start checking it, with no change to this prompt
//   - Ask for structured reasoning, not just a verdict
//
// IMPORTANT: whatever you ask for, it must come back as valid JSON in
// exactly this shape, because that's what the code below expects:
//   {
//     "pass": true or false,
//     "findings": [
//       { "file": "...", "line": "...", "issue": "...", "reasoning": "..." }
//     ]
//   }
// If there are no issues, "pass" should be true and "findings" empty.
// ============================================================
function buildPrompt(diff, manifest) {
  return `You are a design QA reviewer. Check the pull request diff below against the component manifest below. The manifest is the only source of truth: you are not given any other files, so judge only what appears in the diff.

What counts as an issue:
- A line the diff adds or changes (lines starting with "+") that breaks something in the manifest: an entry in "rules", "accessibilityRules", or "responsiveRules", a deprecated variant listed under "deprecatedVariants", or a variant/size not listed under "approvedVariants"/"approvedSizes".
- Nothing else. Do not flag general style opinions or anything the manifest does not cover. Do not flag removed lines or unchanged context lines.
- Only review UI source files (e.g. .tsx, .jsx, .css, .html). Ignore changes to manifest.json, scripts, and config files.
- The "spacingScale" keys are Tailwind utility suffixes, so classes like p-md, py-xl, gap-lg, and pt-sm are correct, approved usage. Do not flag them.

Work through every added line and check it against every rule in the manifest, one rule at a time, before deciding. Do not stop after the first few findings.

For each issue, report the file path, the line number in the new version of the file (count from the "+start" number in the @@ hunk header), what is wrong, and which manifest rule it breaks and why.

Only list actual violations. Every finding must quote the exact offending code from an added line and the exact manifest text it breaks; if you can't point to both, it is not a finding. Never include compliant code as a finding, and never flag a class just because it isn't in default Tailwind: the project defines its own tokens.

If the diff contains no UI changes, or no issues, that is a pass.

Settle on your answer before writing it. Your entire response must be a single JSON object, written once. Do not write anything before or after it: no explanation, no markdown fences, no revised second answer. Put any explanation inside the "reasoning" fields. Use exactly this shape:
{
  "pass": true or false,
  "findings": [
    { "file": "src/App.tsx", "line": "40", "issue": "short description", "reasoning": "which manifest rule this breaks and why" }
  ]
}
"pass" is true only when "findings" is empty.

Manifest:
${manifest}

Diff:
${diff}`;
}

// If the model revises itself it can emit several JSON objects; the last
// one that parses and has a "pass" field is its final answer.
function extractLastResult(text) {
  const starts = [...text.matchAll(/\{\s*"pass"/g)].map((m) => m.index).reverse();
  for (const start of starts) {
    let end = text.lastIndexOf("}");
    while (end > start) {
      try {
        const result = JSON.parse(text.slice(start, end + 1));
        if ("pass" in result) return result;
      } catch {
        // Not valid JSON at this end position; try an earlier closing brace.
      }
      end = text.lastIndexOf("}", end - 1);
    }
  }
  throw new Error("No JSON result object found");
}

// ============================================================
// ALREADY WIRED — calls Claude, checks for API errors, and parses
// the JSON response. You shouldn't need to touch this function.
// ============================================================
async function checkDesignCompliance(diff, manifest) {
  const prompt = buildPrompt(diff, manifest);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`Anthropic API error (status ${response.status}):`, JSON.stringify(data, null, 2));
    return {
      pass: false,
      findings: [{
        file: "-",
        line: "-",
        issue: "API call failed",
        reasoning: data?.error?.message || `HTTP ${response.status}`,
      }],
    };
  }

  // Newer models may return a thinking block before the text, so don't assume content[0].
  const text = (data.content ?? [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  try {
    const result = extractLastResult(text);
    return {
      pass: result.pass === true,
      findings: Array.isArray(result.findings) ? result.findings : [],
    };
  } catch (err) {
    console.error("Failed to parse Claude's response as JSON:", text);
    return {
      pass: false,
      findings: [{ file: "-", line: "-", issue: "Agent response could not be parsed", reasoning: text.slice(0, 300) }],
    };
  }
}


// ============================================================
// ALREADY WIRED — post the result back to the PR
// ============================================================
async function postResult(result) {
  const repo = process.env.GITHUB_REPOSITORY;
  const prNumber = process.env.PR_NUMBER;
  const token = process.env.GITHUB_TOKEN;

  const body = result.pass
    ? `Design QA agent: no issues found.`
    : `Design QA agent found issues:\n\n${result.findings
        .map((f) => `- **${f.file}:${f.line}** — ${f.issue}\n  ${f.reasoning}`)
        .join("\n")}`;

  const commentRes = await fetch(`https://api.github.com/repos/${repo}/issues/${prNumber}/comments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "content-type": "application/json",
    },
    body: JSON.stringify({ body }),
  });

  if (!commentRes.ok) {
    const errText = await commentRes.text();
    console.error(`Failed to post comment (status ${commentRes.status}):`, errText);
  } else {
    console.log("Comment posted successfully.");
  }

  // Non-zero exit makes the GitHub Action report a failed check.
  process.exit(result.pass ? 0 : 1);
}

// ============================================================
// ALREADY WIRED — run it
// ============================================================
(async function main() {
  try {
    const diff = await fetchDiff();
    const manifest = readManifest();
    const result = await checkDesignCompliance(diff, manifest);
    await postResult(result);
  } catch (err) {
    console.error("Design QA agent failed to run:", err);
    process.exit(1);
  }
})();
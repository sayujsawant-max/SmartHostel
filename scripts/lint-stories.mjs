#!/usr/bin/env node

/**
 * Story Document Linter
 *
 * Validates story files in _bmad-output/stories/ against quality rules:
 * - Required sections present
 * - AC format (Given/When/Then)
 * - Banned ambiguous words in ACs
 * - No "Done in Story" references in ACs
 * - WARDEN_ADMIN consistency (not bare WARDEN)
 * - Bundled ACs (multiple Given/When/Then in one AC)
 *
 * Usage: node scripts/lint-stories.mjs [--fix-suggestions] [file...]
 */

import { readFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

const STORIES_DIR = resolve(
  import.meta.dirname || '.',
  '../_bmad-output/stories'
);

const REQUIRED_SECTIONS = [
  '## Description',
  '## Status:',
  '## Acceptance Criteria',
  '## Technical Context',
  '### Existing Code',
  '## Tasks',
  '## Dependencies',
  '## File List',
  '## Dev Agent Record',
];

const BANNED_WORDS = [
  'appropriate',
  'user-friendly',
  'proper',
  'reasonable',
  'adequate',
  'sufficient',
  'meaningful',
];

// Words that are fine when followed by specific values but flagged when standalone
const CONTEXT_BANNED = ['correct', 'quick'];

const SEVERITY = { HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW' };

function lintFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const fileName = filePath.split(/[/\\]/).pop();
  const findings = [];

  // 1. Required sections
  for (const section of REQUIRED_SECTIONS) {
    const sectionBase = section.replace(':', '');
    const found = lines.some(
      (l) =>
        l.startsWith(section) ||
        l.startsWith(sectionBase) ||
        (section === '## Status:' && l.match(/^## Status/))
    );
    if (!found) {
      findings.push({
        severity: SEVERITY.MEDIUM,
        line: null,
        rule: 'missing-section',
        message: `Missing required section: ${section}`,
      });
    }
  }

  // 2. AC format checks
  const acLines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/^\*\*AC-\d+[a-z]?:\*\*/)) {
      acLines.push({ lineNum: i + 1, text: line });
    }
  }

  for (const ac of acLines) {
    const text = ac.text;

    // Given/When/Then check
    const hasGiven = /\bGiven\b/i.test(text);
    const hasWhen = /\bwhen\b/i.test(text);
    const hasThen = /\bthen\b/i.test(text);

    if (!hasGiven || !hasWhen || !hasThen) {
      const missing = [];
      if (!hasGiven) missing.push('Given');
      if (!hasWhen) missing.push('When');
      if (!hasThen) missing.push('Then');
      findings.push({
        severity: SEVERITY.HIGH,
        line: ac.lineNum,
        rule: 'ac-format',
        message: `AC missing ${missing.join(', ')} clause`,
      });
    }

    // Banned words
    for (const word of BANNED_WORDS) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(text)) {
        findings.push({
          severity: SEVERITY.LOW,
          line: ac.lineNum,
          rule: 'banned-word',
          message: `AC contains ambiguous word "${word}"`,
        });
      }
    }

    // "Done in Story" references
    if (/done in (story )?[\d.]+/i.test(text)) {
      findings.push({
        severity: SEVERITY.MEDIUM,
        line: ac.lineNum,
        rule: 'done-in-story',
        message: `AC contains "Done in Story X.Y" — move to Dependencies`,
      });
    }

    // Bundled ACs (multiple Given...When...Then sequences)
    const givenCount = (text.match(/\bGiven\b/gi) || []).length;
    const whenCount = (text.match(/\bWhen\b/gi) || []).length;
    if (givenCount > 1 || whenCount > 2) {
      findings.push({
        severity: SEVERITY.MEDIUM,
        line: ac.lineNum,
        rule: 'bundled-ac',
        message: `AC bundles multiple scenarios (${givenCount} Given, ${whenCount} When) — split into separate ACs`,
      });
    }
  }

  // 3. WARDEN consistency (bare "WARDEN" without _ADMIN in role context)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match bare WARDEN used as a role (not in WARDEN_ADMIN)
    if (
      /\bWARDEN\b/.test(line) &&
      !/WARDEN_ADMIN/.test(line) &&
      !/warden/.test(line)
    ) {
      // Skip if it's in a sentence context like "contact your warden"
      if (!/as a \*\*warden/i.test(line) && !/role.*WARDEN[^_]/i.test(line)) {
        // Only flag if it looks like a role reference
        if (/requireRole.*WARDEN[^_]|Role\.WARDEN[^_]|\bWARDEN\b(?!_)/.test(line)) {
          findings.push({
            severity: SEVERITY.MEDIUM,
            line: i + 1,
            rule: 'warden-consistency',
            message: `Uses bare "WARDEN" instead of "WARDEN_ADMIN"`,
          });
        }
      }
    }
  }

  // 4. Tests sections without AC traceability
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\*\*Tests[:\s*]/.test(line) || /^\*\*Tests \(/.test(line)) {
      // Check if it has AC reference like (AC-1, AC-2) or (AC-1)
      if (!/\(AC-\d/.test(line)) {
        findings.push({
          severity: SEVERITY.LOW,
          line: i + 1,
          rule: 'tests-no-ac-ref',
          message: `Tests section missing AC traceability — add (AC-X, AC-Y) reference`,
        });
      }
    }
  }

  // 5. Tasks without Tests section
  const taskHeaders = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^### Task \d+:/)) {
      taskHeaders.push({ lineNum: i + 1, title: lines[i] });
    }
  }

  for (let t = 0; t < taskHeaders.length; t++) {
    const startLine = taskHeaders[t].lineNum;
    const endLine =
      t + 1 < taskHeaders.length
        ? taskHeaders[t + 1].lineNum
        : lines.length;
    const taskBlock = lines.slice(startLine - 1, endLine - 1).join('\n');
    if (!/\*\*Tests[:\*]/.test(taskBlock) && !/\*\*Tests \(/.test(taskBlock)) {
      findings.push({
        severity: SEVERITY.MEDIUM,
        line: startLine,
        rule: 'task-no-tests',
        message: `Task has no **Tests:** section: ${taskHeaders[t].title.trim()}`,
      });
    }
  }

  return { fileName, findings };
}

// Main
const args = process.argv.slice(2);
const showSuggestions = args.includes('--fix-suggestions');
const fileArgs = args.filter((a) => !a.startsWith('--'));

let files;
if (fileArgs.length > 0) {
  files = fileArgs.map((f) => resolve(f));
} else {
  files = readdirSync(STORIES_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => join(STORIES_DIR, f));
}

let totalFindings = 0;
const severityCounts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
const ruleCounts = {};

for (const file of files) {
  const result = lintFile(file);
  if (result.findings.length > 0) {
    console.log(`\n${result.fileName}`);
    for (const f of result.findings) {
      const loc = f.line ? `:${f.line}` : '';
      console.log(`  [${f.severity}] ${f.rule}${loc}: ${f.message}`);
      totalFindings++;
      severityCounts[f.severity]++;
      ruleCounts[f.rule] = (ruleCounts[f.rule] || 0) + 1;
    }
  }
}

if (totalFindings === 0) {
  console.log('\nAll stories pass lint checks.');
  process.exit(0);
} else {
  console.log(`\n--- Summary ---`);
  console.log(`Total findings: ${totalFindings}`);
  console.log(
    `  HIGH: ${severityCounts.HIGH}  MEDIUM: ${severityCounts.MEDIUM}  LOW: ${severityCounts.LOW}`
  );
  console.log(`\nBy rule:`);
  for (const [rule, count] of Object.entries(ruleCounts).sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(`  ${rule}: ${count}`);
  }

  if (severityCounts.HIGH > 0) {
    process.exit(1);
  }
  process.exit(0);
}

/**
 * `flow doctor`: everything about an installed machine a function can decide.
 *
 * The management skill runs this first, then walks what no function can reach:
 * whether a hook actually fires, and whether a rule holds under load. The split
 * is the whole point. A skill asked to check 20 symlinks by hand gets one wrong
 * and reports success, so every check a function can make is made here and the
 * skill reads an exit code.
 *
 * Nothing is written. Every check is a read, so running this against a broken
 * machine can only ever tell you more about it.
 *
 * `flow tickets check` is the other verification command and answers a different
 * question: the ticket graph in the project you are standing in. That one needs
 * a project and refuses without one. This one needs a machine and runs from
 * anywhere, install day included.
 *
 * The flags exist so the tests can run a real install and then verify it.
 * `--root` reads the whole install under a scratch folder in place of the home
 * folder, the same as `flow install --root`. `--no-bin` matches
 * `flow install --no-bin` (a scratch install writes no names into
 * ~/.local/bin, so there are none to check).
 *
 * The 2 suites run only with `--tests`. They take about 14 seconds and hold a
 * test that fails now and then on its own, where a flaky failure would read as
 * a broken install.
 */

import fs from 'node:fs';
import path from 'node:path';
import { out, json } from '../shared/cli.ts';
import type { Action } from '../shared/cli.ts';
import * as prereq from '../features/machine/prereq.ts';
import { inspect, checkNames, checkAgents, checkClaude, checkSettings, checkFlowHome } from '../features/machine/doctor-install.ts';
import { checkUtil, checkTests } from '../features/machine/doctor-util.ts';
import { checkIssues, checkProjects, checkTickets, checkClone } from '../features/machine/doctor-records.ts';
import * as skills from '../features/skills/skills.ts';
import * as paths from '../shared/paths.ts';
import * as project from '../shared/project.ts';

// ---- the checks -------------------------------------------------------------

// ---- the command ------------------------------------------------------------

/**
 * `flow doctor`: one line per area when it is clean, one line per problem when
 * it is not.
 *
 * A clean area prints what it counted rather than nothing, because a report
 * that only speaks up when something is wrong gives you no way to tell a pass
 * from a check that never ran.
 */
function doctorReport(checks) {
  const lines : string[] = [];
  let failed = 0;
  let ran = 0;

  for (const check of checks) {
    if (check.skipped) {
      lines.push(`skip  ${check.name}: ${check.skipped}`);
      continue;
    }
    ran++;
    if (check.problems.length) {
      failed++;
      lines.push(`fail  ${check.name}:`);
      for (const problem of check.problems) lines.push(`        ${problem}`);
    } else {
      lines.push(`ok    ${check.name}: ${check.summary}`);
    }
    for (const note of check.notes || []) lines.push(`note  ${check.name}: ${note}`);
  }

  lines.push('');
  lines.push(failed ? `${failed} of ${ran} checks failed.` : 'nothing to fix.');
  return lines.join('\n');
}

const actions: Record<string, Action> = {};

/** The report, and the exit code a skill reads instead of the report. */
function report(checks) {
  const ran = checks.filter((c) => !c.skipped);
  json({
    installed: true,
    checks: checks.map((c) => ({
      name: c.name, skipped: c.skipped || null, problems: c.problems || [], notes: c.notes || [], summary: c.summary || null,
    })),
    failed: ran.filter((c) => c.problems.length).length,
    ran: ran.length,
  });
  out(doctorReport(checks));
  return checks.some((c) => c.problems && c.problems.length) ? 1 : 0;
}

actions.doctor = {
  section: 'setup',
  summary: 'check that Flow is installed correctly: links, PATH, util, skills and hooks',
  flags: {
    root: { arg: '<dir>', hidden: true },
    'no-bin': { bool: true, hidden: true },
    tests: { bool: true, hidden: true },
    prereq: { bool: true },
  },
  run({ flags }) {
    // Runs on a machine Flow is not on yet: what Flow calls and never
    // installs, and nothing else. Everything below this line describes an
    // install and would refuse such a machine.
    if (flags.prereq) return report(prereq.checks());

    const clone = paths.cloneRoot();
    const at = paths.folders(flags.root);
    const bin = flags['no-bin'] ? null : path.join(at.base, '.local', 'bin');

    // The empty case, and it is the one this machine is in until install day.
    // Without it a fresh machine reads as 20 separate failures, all of them the
    // same failure said again.
    if (inspect(path.join(at.flow, 'scripts')).state === 'missing' && !anyFlowSkillLinked(at.agents)) {
      json({ installed: false, checks: [], failed: 0, ran: 0 });
      out(
        `Flow is not installed here. ${paths.shorten(at.flow)} has no scripts link and ${paths.shorten(at.agents)} holds no Flow skill.\n\n` +
        `Install it, then run this again:\n\n  node ${path.join(clone, 'scripts', 'flow.ts')} install\n`
      );
      return 1;
    }

    const catalog = readCatalog();

    const checks = [
      checkIssues(at),
      checkClone(clone),
      prereq.checkPrograms(),
      prereq.checkClaude(),
      bin ? checkNames(clone, { bin }) : { name: 'names', skipped: '--no-bin' },
      checkUtil(),
      checkAgents(at, catalog),
      checkClaude(clone, at),
      checkSettings(clone, at.claude, catalog),
      checkFlowHome(clone, at.flow),
      checkProjects(at, project.around(null, at)),
      checkTickets(project.around(null, at)),
      // Hidden from help, so the report never names it when it was left out.
      flags.tests && checkTests(clone, { bin }),
    ].filter(Boolean);

    return report(checks);
  },
};

/**
 * The skill catalog, read once, with a name clash carried rather than thrown.
 *
 * Two checks need it and `skills.catalog()` refuses outright on a clash, which
 * would take the whole report down over one thing it is meant to report.
 */
function readCatalog() {
  try {
    const all = skills.catalog();
    return { skills: [...all.values()], names: new Set(all.keys()), error: null };
  } catch (e: any) {
    return { skills: [], names: new Set(), error: e };
  }
}

/** True when the plugin folder holds even one link into this clone. */
function anyFlowSkillLinked(agents) {
  const clone = paths.cloneRoot();
  const linkDir = skills.linkDir(agents);
  let entries : string[] = [];
  try {
    entries = fs.readdirSync(linkDir);
  } catch {
    return false;
  }
  return entries.some((name) => {
    const found = inspect(path.join(linkDir, name));
    return found.state === 'ok' && found.target!.startsWith(clone + path.sep);
  });
}

export default actions;

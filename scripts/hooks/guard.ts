#!/usr/bin/env node
/**
 * guard.ts: the PreToolUse hook on Edit, Write, Bash and Read, and the one
 * check between Claude and a dangerous call. `features/guard/judge.ts` judges it,
 * and this file is the wiring.
 *
 * Flow's settings allow every shell command and every edit. The guard reads
 * each call before it runs, and answers "ask" when it finds one of 7 kinds of
 * harm, in `features/guard/`:
 *
 *   1. losing work on this machine: a delete outside the project, a delete of
 *      files git cannot give back, a delete aimed at a variable, and the git
 *      commands that throw work away
 *   2. sending things off the machine: curl or wget sending data, a copy to
 *      another host, ssh
 *   3. touching shared systems: a deploy or cloud tool doing more than read,
 *      a database drop
 *   4. running outside code: a download run straight away
 *   5. a write into ~/.ssh
 *   6. a write to a file that can switch the guard off: ~/.claude/settings.json
 *      and settings.local.json, ~/.claude/plugins, ~/.claude/dev-mods, a
 *      project's .claude/settings*.json. An Edit or Write is judged by this
 *      kind alone.
 *   7. reading a secret into the conversation: a private key, a cloud or
 *      GitHub login. The Read tool's reads are judged here too.
 *
 * Otherwise it stays silent and the call runs. It never answers "allow".
 *
 * It fails closed: any throw, a failed require included, answers "ask". That
 * answer is printed without `shared/hook`, since that file may be what failed.
 *
 * It cannot see inside a script: `node -e`, `python3 -c`, or a file Claude
 * wrote and then runs. It catches the forms Claude writes, and is no wall.
 *
 * It only ever sees what the agent runs. A command typed behind `!` reaches no
 * hook. This file installs to ~/.claude/ and runs in every directory, so only
 * a rule that holds everywhere belongs here.
 */

// The modules load here, not at the top, so a failed load is caught below and answers "ask".
async function main() {
  const hook = await import('../shared/hook.ts');
  const { judge, judgeFileWrite } = await import('../features/guard/judge.ts');
  const { world } = await import('../features/guard/world.ts');
  const { secretRead } = await import('../features/guard/secrets.ts');

  const data = hook.event();
  const input = (data && data.tool_input) || {};
  const cwd = (data && data.cwd) || process.cwd();
  const tool = data && data.tool_name;
  let reason: string | null = null;
  if (tool === 'Read') {
    if (typeof input.file_path === 'string') reason = secretRead(input.file_path, cwd, world());
  } else if (tool === 'Edit' || tool === 'Write') {
    if (typeof input.file_path === 'string') reason = judgeFileWrite(input.file_path, cwd, world());
  } else if (typeof input.command === 'string' && input.command.trim()) {
    reason = judge(input.command, cwd, world());
  }
  if (reason) hook.answer('PreToolUse', { permissionDecision: 'ask', permissionDecisionReason: reason });
}

try {
  await main();
} catch {
  process.stdout.write(`${JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'ask',
      permissionDecisionReason: 'The guard failed, so this command asks first.',
    },
  })}\n`);
}

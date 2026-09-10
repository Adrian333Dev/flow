'use strict';
/**
 * description: a run of line comments above a top-level declaration is the wrong shape
 *
 * `js-and-ts` in rules/comments.md puts the block form on a declaration and the
 * line form inside a body. Only the block form reaches the editor hover and the
 * autocomplete list at the call site, so a note worth reading from another file
 * is unreachable when it is written as line comments.
 *
 * Deliberately narrow. Two or more line comments, at column 0, directly above a
 * function or a class. Everything arguable is left alone: a single line above a
 * helper, an indented declaration inside a body, and a top-level `const` bound
 * to a value, which the rule does not name. A check that fires on an arguable
 * case is a check the agent learns to ignore.
 *
 * The repo holds 21 runs of line comments on a top-level `const`, and one of
 * them sits on a `require`. That is the population skipping plain values buys
 * back, and every one of them would have been noise.
 *
 * `measure` and staying there. A comment in the wrong shape is a small thing,
 * and stopping an edit over a small thing costs more than the shape is worth.
 * The count is the whole point.
 */

const EXTS = /\.(?:js|jsx|mjs|cjs|ts|tsx)$/;

/** `function` or `class`, written flush left. Indented means a body. */
const KEYWORD = /^(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function|class)\b/;

/**
 * A `const` holding a function is a function, whatever the keyword says, so an
 * arrow bound to a name is a declaration the rule names. A `const` holding a
 * number is not, and that is the whole difference this pattern draws.
 */
const BOUND_FN = /^(?:export\s+)?(?:const|let)\s+[A-Za-z_$][\w$]*\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/;

const DECLARES = (line) => KEYWORD.test(line) || BOUND_FN.test(line);

const LINE_COMMENT = /^\/\//;

/** Two, not one: a lone `// helper` above a function is not worth a count. */
const RUN = 2;

/** Every line number where a run of line comments sits on a declaration. */
function offenders(text) {
  const lines = String(text).split('\n');
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    if (!DECLARES(lines[i])) continue;
    let run = 0;
    for (let k = i - 1; k >= 0 && LINE_COMMENT.test(lines[k]); k--) run++;
    if (run >= RUN) hits.push(i + 1);
  }
  return hits;
}

/** True when this edit declares something, which is the only case that counts. */
const declares = (text) => String(text).split('\n').some(DECLARES);

module.exports = {
  id: 'js-and-ts',
  rule: 'rules/comments.md',
  tier: 'measure',
  since: '2026-09-10',
  needs: 'added',
  applies: (file, text) => EXTS.test(file) && declares(text),
  check: (file, text) => offenders(text).length === 0,
  message: 'Line comments above a declaration. The block form is what reaches the hover at the call site.',
  offenders,
};

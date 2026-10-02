---
paths:
  - "**/*.{js,jsx,mjs,cjs,ts,tsx}"
  - "**/*.py"
  - "**/*.{sh,bash}"
  - "**/*.sql"
  - "**/*.{css,scss}"
---

**Apply this while writing code.** Never go back to edit a comment only because its form is wrong.

## Whether to write one

**Write a comment only where a reader fluent in the language would still guess wrong.**

- **`header-says-what-the-file-is`** Open every file of code with a header comment. Its first sentence says what the file is, and reads on its own. Anything after it is optional: how the file fits, or a decision behind it. A file shorter than its header would be needs none.
- **`cut-words-never-information`** Write every comment as short as it stays clear. Never over-explain. Keep examples, flags, usage lines and details a reader would otherwise open the code for.
- **`say-what-the-code-cannot`** Write the reason, the constraint, the decision, or what the outside system really returns: a workaround and the bug behind it, an ordering that matters, a number that looks arbitrary and is not.
- **`never-restate-the-line`** Delete a comment that repeats the code under it: `// increment the counter` above `i++`.
- **`not-every-declaration`** Leave a function whose name already answers the question uncommented. Comment the one where a reader would have to open the body to find out.
- **`say-it-once`** Put a fact in one comment, never in both the caller and the callee.

## Which form it takes

**Position decides the form.** A comment on a declaration takes whichever form the language surfaces where the name gets used. A comment inside a body takes the line form.

- **`js-and-ts`** `/** */` on a file header, a class, a function, and anything else worth reading from another file: only `/** */` reaches the hover at the call site. `//` inside a body.
- **`python`** A docstring on a module, a class or a function. `#` inside a body.
- **`bash`** `#` everywhere. A blank line separates a file header from the code under it.
- **`sql`** `--` on a statement and inside it. `/* */` for a file header running several lines.
- **`css`** `/* */`. In SCSS, a note that should never ship takes `//`, which the compiler drops.
- **`a-block-fits-one-line`** Write a one-line block wherever the text fits: `/** True when the arguments ask for help. */`.
- **`match-the-file`** Take the form the file already uses in that position.

#!/usr/bin/env python3
"""PreToolUse guard — enforces what CLAUDE.md can only ask for.

Registered as a PreToolUse hook on Bash. Reads the pending tool call as JSON on
stdin and prints a verdict on stdout.

Returns "deny" only for things that are wrong in every project, "ask" for
judgment calls, and stays silent otherwise. It never returns "allow", so the
permissions.deny list stays the final authority and a bug here cannot widen
anything.

Scope rule: this file installs to ~/.claude/ and therefore runs in every
directory. Only put rules here that hold everywhere. A rule that belongs to one
repo goes in that repo's .claude/settings.json, never here.
"""
import json
import os
import re
import shlex
import sys

# Wrong in every project.
DENY = [
    (r'(^|[;&|]\s*)(sudo|su)\s', "privileged command"),
    (r'\b(curl|wget)\b[^|]*\|\s*(sudo\s+)?(ba)?sh\b', "pipe-to-shell"),
    (r'--dangerously-skip-permissions', "permission bypass"),
    (r'\bgit\s+(add|commit|push|pull|reset|rebase|merge|checkout|switch|restore'
     r'|rm|mv|stash|clean|cherry-pick|revert)\b', "git mutation"),
]

# Legitimate often enough to warrant a prompt rather than a wall.
ASK = [
    (r'\b(npm|pnpm|yarn|bun)\s+(i|install|add|remove|rm|uninstall|up|update)\b',
     "dependency change"),
    (r'\b(pip3?|uv|cargo|go|gem)\s+(install|add|remove)\b', "dependency change"),
    (r'\b(apt-get|apt|dnf|yum|brew|snap)\s+(install|remove|purge)\b',
     "system package change"),
    (r'\bchmod\s+(-\w+\s+)*777\b', "world-writable chmod"),
    (r'\bdd\b[^|;&]*\bof=/dev/', "raw device write"),
    (r'\bmkfs', "filesystem format"),
    (r'>>?\s*~?/?\.?(bash|zsh|profile)\w*', "shell startup file write"),
]


def verdict(decision, reason):
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": decision,
        "permissionDecisionReason": f"guard.py: {reason}",
    }}))
    sys.exit(0)


data = json.load(sys.stdin)
cmd = data.get("tool_input", {}).get("command", "") or ""
cwd = data.get("cwd") or os.getcwd()

for pattern, reason in DENY:
    if re.search(pattern, cmd):
        verdict("deny", f"{reason} — name the command, the user runs it")

for pattern, reason in ASK:
    if re.search(pattern, cmd):
        verdict("ask", reason)

# Recursive delete reaching outside the working directory.
for segment in re.split(r'&&|\|\||[;|]', cmd):
    try:
        tokens = shlex.split(segment)
    except ValueError:
        continue
    if not tokens or os.path.basename(tokens[0]) != "rm":
        continue
    if not any(t.startswith("-") and re.search(r'[rRf]', t) for t in tokens[1:]):
        continue
    root = os.path.realpath(cwd)
    for arg in (t for t in tokens[1:] if not t.startswith("-")):
        target = os.path.realpath(os.path.join(cwd, os.path.expanduser(arg)))
        if os.path.commonpath([target, root]) != root:
            verdict("ask", f"recursive delete outside the working directory: {arg}")

sys.exit(0)

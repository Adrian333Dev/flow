/**
 * commands.ts: the `flow` and `util` command groups a Bash command runs, and whether it is a group's own help.
 */

/** The `flow` and `util` groups a command runs, by the word after the program's name. */
export function groupsOf(command: string): string[] {
  const found = new Set<string>()
  for (const m of command.matchAll(/(?:^|[\s;&|(`])(flow\s+(?:notes|audit)|util\s+[a-z][\w-]*)\b/g)) found.add(m[1]!.replace(/\s+/, ' '))
  return [...found]
}

/** True for a command that is a group's own help: `flow audit --help`, `util fs -h`. */
export const helpOf = (command: string, group: string) => new RegExp(`^\\s*${group.replace(' ', '\\s+')}\\s+(--help|-h)\\s*$`).test(command)

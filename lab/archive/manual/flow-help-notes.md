# The notes flow help printed

Until 2026-10-02, `flow help` ended with about 110 lines of notes: the shape of a command, ids, the ticket folder, steps, pickup and the rest. Help now lists only commands and flags. The notes are kept here as they were, as input for the command reference page. Some name commands that have since changed: `flow scorecard` is now `flow audit scorecard`, and `flow skills drop` with a skill name is now `flow skills reset`.

```text
shape   flow <command> [id] [--flags]. A word naming no command is read as a
        ticket id, which is what makes flow exp-47 show one
ids     exp-47-parser-split: the project's prefix, a number, then a label.
        The id is the identity and the label is decoration, so exp-47, 47,
        parser and the whole thing all resolve. A bare number is the current
        place's ticket, and home-4 is one in ~/.flow/. A ticket is never
        renamed, so a label that goes stale breaks nothing
layout  .flow/tickets/<id>-<label>/: ticket.md and groundwork/ from birth,
        plan.md, reports/ and protos/<name>/ written by the work. One report
        per thing answered, named after what it answers, whether a hunt
        found it or a prototype did. Done and dropped tickets move to .flow/tickets/archive/
        and move back if reopened
steps   flow <id> counts the checkboxes in plan.md and in groundwork/map.md
        each time it prints, so neither count can drift from its file. The
        two artifacts say whether a phase finished; status only claims it.
        The lists never count: out there status already says whether a ticket
        is being built, waiting on review, or finished
pickup  flow <id> prints the command a todo or parked ticket is waiting for
        and never runs it, so the skill picking the ticket up moves it after
        reading. The status verbs are the only way to move a ticket
resume  flow get --files reads the ticket, then every file named in its
        fenced open block, through util fs open. handoff writes that block,
        and decides what goes in it: an empty one is a real answer for a
        ticket carrying its own context. Paths resolve beside the ticket
        first, then from the repo root, and a line range passes through:
        src/parser.js:40-120. Nothing is truncated
park    parking stores the status it left, and reviving is the verb for that
        status. A feature parked at building comes back at building
parent  a ticket split out of another carries parent: exp-47. Disk stays flat;
        the hierarchy is frontmatter. A parent waits while its children are
        open (it leaves flow next, and picking it up refuses) then returns
        for whatever work no child holds
pri     high or low on disk and nothing else: normal is the absent field, so an
        ordinary ticket has no priority line to go stale. A ticket with none
        inherits the nearest ancestor's, and an explicit value always beats an
        inherited one, so marking one parent high lifts a whole feature, and a
        low chore inside it stays low
root    the enclosing git repo; override with FLOW_PROJECT=/path
cases   ~/.flow/study-cases/<issue>/<date>-<slug>.md: global, filed by issue
        and never by project, because the payoff is seeing one failure three
        times. Override with FLOW_HOME
skills  one real copy of each lives in the clone, filed under a group folder.
        Every group but drafts installs on every machine, as one symlink named
        for the skill, so there is no list to keep in step. The links sit
        inside ~/.agents/skills/flow/, beside the manifest that makes each one
        typed as /flow:groundwork. Codex reads that folder, and Claude Code
        reaches it through the link ~/.claude/skills/flow
sources a skill repository Flow takes skills from, cloned whole into
        ~/.flow/repos/sources/<owner>_<repo>/. sources in ~/.flow/settings.json
        lists them, the domain-skills repository first. flow skills add
        owner/repo clones one, flow install clones any that are missing, and
        the session-start hook pulls them. Private skills live in
        ~/.flow/private-skills/<name>/ and take a name no other skill uses
switch  a skill is on where its link exists. "skills": { "react": "on" } in
        a settings file says which: <project>/.flow/settings.json for the
        project, ~/.flow/settings.local.json for this machine, and
        ~/.flow/settings.json for every machine, the nearest winning. Flow's
        own skills start on and have no project level, except the 2 in dev/,
        which start off like the rest.
        flow skills on, off and drop write the line and fix the links
overlay a project adds to a skill without editing it, because one copy of that
        skill is shared by every project on the machine. Write
        .flow/overlays/<name>.md and a hook adds it each time the skill
        loads in that project: Flow's skills, outside ones and plugins' alike
share   a finding for a domain skill waits in .flow/findings/<skill>/, where
        /flow:file-findings moves it on a yes. It stays there until Flow's
        sharing command ships, after V1
migrate a change to where Flow and the harnesses keep their files, written
        by flow install, flow init or flow update into
        ~/.flow/migrations/<machine or project>/<time>/: migration.md lists
        each change, files/ holds each new version. After your yes the session
        runs ~/.flow/scripts/apply-migration.js, which never touches a path
        the migration leaves out. A line that fails stops the run there, and
        running the script again carries on from that line
before  ~/.flow/originals/<machine or project>/ holds every path as it was
        before Flow first touched it. flow install writes the machine's, the
        first setup of each place closes it, and nothing is ever added after
        that. flow restore machine and flow restore project put every path
        back; flow uninstall does both, then deletes ~/.flow/ and the clone.
        Both need a terminal with no session running, so neither is a command
        the agent can run
sync    ~/.flow/ is one private git repository, and that is the whole of how a
        second machine gets your rules, notes, study cases and wiki. flow sync
        brings the other machine's down, then sends this one up. What belongs
        to one machine stays there: version, run.json, originals/,
        settings.local.json, repos/, logs/, the scripts, references
        and docs links, and each wiki tool's downloads
setting every on/off setting Flow reads: the lines it prints by itself and
        the skill pull. flow settings lists them, and on or off switches one
        for this folder, --machine or --global, the levels flow skills uses.
        Only a setting with a folder list works per folder
default cases reads a bare word as an argument to its most used action.
        skills defaults to ls, so flow skills react lists the skills naming
        react
audit   what Claude Code did, read back afterwards. It reads the transcripts
        Claude Code already writes at ~/.claude/projects/ and derives an index
        at ~/.flow/audit/audit.db; nothing is recorded and nothing is
        intercepted, so a session that ran before any of this existed reads the
        same as one that ran today. flow audit index first, every time: it
        walks only what was appended since the last run. The index is derived:
        deleting it loses nothing, and --rebuild is how a schema change lands.
        Queries narrow to a turn range, and flow audit read opens that range of
        the original conversation. Never a whole session: one segment averages
        270k tokens
checks  a rule check is one file in ~/.flow/scripts/rule-checks/, named after
        the rule id it enforces. The PreToolUse hook on Edit and Write runs
        every one of them and appends a line per result to
        ~/.flow/logs/scorecards/<session>.jsonl. Each check carries its own tier:
        measure records and interrupts nothing, warn puts a line in front of
        the agent, block refuses the edit. Every check starts at measure, and
        flow scorecard says which have earned a promotion. A rule with no check
        is listed as coverage, never as a failure
```

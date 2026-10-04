# OrcaReplay

Read 2026-10-04 from `repos/tools/orca-replay/`. About 270 stars, Apache 2.0. Records a coding agent's session through a local proxy, replays it with no model called, and forks it from any step onto another model.

**The model is the only thing a fork changes.** Same files, same conversation up to the step. Flow's question is the opposite: same model, different rules. A fork resends the recorded system prompt, so a rule change never reaches it.

## What Flow could take

Nothing now. Its method fits `lab/research/compound-engineering.md` → idea 5, the day Flow moves to a new model.

# Glyph probe

Every line below is exactly 48 characters. Any row whose right border
sticks out past the others is a glyph your font renders double-width.
Column 3 is the Unicode East-Asian-Width class.

```
┌──────────────────────────────────────────────┐
│ right border must stay in one column         │
├──────────────────────────────────────────────┤
│ ─  U+2500 A  in use now                      │
│ │  U+2502 A  in use now                      │
│ ▲  U+25B2 A  you say OK                      │
│ ▼  U+25BC A  you say OK                      │
│ ▶  U+25B6 A  you say BREAKS                  │
│ ◀  U+25C0 A  you say BREAKS                  │
│ ►  U+25BA N  you say OK                      │
│ ◄  U+25C4 N  untested pair for the above     │
│ ▸  U+25B8 N  skill bans it                   │
│ ▾  U+25BE N  skill bans it                   │
│ ●  U+25CF A  you did not flag it             │
│ ━  U+2501 A  you did not flag it             │
│ ◁  U+25C1 A  suspect                         │
│ ▷  U+25B7 A  suspect                         │
│ ❚  U+275A N  suspect                         │
│ ⇆  U+21C6 N  suspect                         │
│ ↻  U+21BB N  suspect                         │
│ ■  U+25A0 A  skill bans it                   │
│ ▌  U+258C A  skill bans it                   │
│ ·  U+00B7 A  skill bans it                   │
│ …  U+2026 A  skill bans it                   │
│ →  U+2192 A  skill bans it                   │
│ —  U+2014 A  skill bans it                   │
│ ⏸  U+23F8 N  emoji - expect break            │
│ ⏵  U+23F5 N  emoji - expect break            │
│ ▪  U+25AA N  emoji - expect break            │
│ ‖  U+2016 A  pause alternative               │
│ ╏  U+254F N  heavy dashed vertical           │
│ ╌  U+254C N  light dashed                    │
│ ◆  U+25C6 A  candidate                       │
│ ◇  U+25C7 A  candidate                       │
│ ☰  U+2630 N  candidate                       │
└──────────────────────────────────────────────┘
```

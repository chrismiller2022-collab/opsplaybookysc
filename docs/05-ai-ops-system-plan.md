# AI ops system: what to build in Claude Code

This is the "real operating system" from the chat, as opposed to the demo artifacts. **Timing:** build the demo-grade pieces now with fictional data. Build anything that touches real client data only after hiring, inside Sports Office's approved stack and with their sign-off.

## Components

| # | Component | What it does | Build now (demo) or later (real) |
|---|---|---|---|
| 1 | Standalone command-center dashboard | Port `dashboard/index.html` to plain HTML + d3 reading `data/*.csv`; deployable (for example, Vercel) | Now |
| 2 | Request queue store | A small database (SQLite or Supabase) with clients, requests, deadlines and templates tables; the dashboard reads from it | Now, with demo data |
| 3 | Morning brief | Daily script: deadlines in the next 7 days, requests over 24 h with no reply, today's calls, grouped by client; emailed or printed | Now (demo), then real |
| 4 | Inbox triage | Classify each email by client, category and urgency; draft a reply from the template library; a human approves before sending | Later |
| 5 | Call and voicemail to task | Transcribe and extract action items into the queue | Later |
| 6 | Social batcher | Weekly drafts per client from each operational calendar (game days, registration pushes, sponsor posts) | Now (demo) |
| 7 | Registration analyzer | Ingest a platform export CSV (SportsEngine, GotSport and so on) and flag trends (an age group down, a team near its cap, pace vs last year) | Now with fake exports |
| 8 | Weekly at-risk review | Compare queue vs calendar; list aging, overdue and at-risk items per client | Now (demo) |
| 9 | Template library | English and Spanish replies to the top questions, per client, with variables | Now |

## Principles

- A human sends everything. AI drafts and flags, and never contacts families on its own.
- Youth and parent data is sensitive: no real data in personal tools or this repo; follow employer policy.
- Integrate rather than compete: Sports Office already has CRM and workflow automation tools (per the posting), so design components to export and import cleanly.
- Every number on a dashboard should trace back to its source rows.

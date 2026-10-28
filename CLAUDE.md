# CLAUDE.md: Sports Office Administrator prep

This repo holds Chris's preparation for the **Sports Office Administrator** role at Sports Office (sportsoffice365.com). The goal is to win the job (or open a door through cold outreach, since the posting is down) and to be excellent from day one.

Everything here was carried over from a Claude chat on Oct 13 to 15, 2026. Start with this file, then `docs/06-next-steps.md`.

## Who this is for

- Chris is looking for sports and athletics roles with government (city or county), parks and rec, or nonprofit employers, in Savannah, GA or remote.
- This role is a private company but fully remote, and it is a strong fit. Chris is preparing both to land it and to perform well right away.
- Chris thinks in systems and automation. He has other personal AI and agent projects, and he asked for Claude Code because he wants real tooling, especially dashboards.

## The role in one paragraph

Sports Office is a virtual front office for youth and pro sports organizations nationwide. An Administrator is the main point of contact for **several client clubs at once**. The work covers phones, email, social media, sponsors, uniforms, registration, scheduling, team apps, hotels and meals for travel, administrative support, a custom communication plan and operational calendar per client, and data reporting. Platforms named in the posting are SportsEngine, GotSport, Demosphere, Byga, Sports Connect and TeamLinkt.

The posting listed full-time remote work at **$65K to $80K**. Its four application questions are in `docs/00-job-posting.md`. The posting is no longer live, so the plan is cold outreach.

## The core design idea

The hard part of the job is **multi-client juggling**. Everything is organized around that:

1. **Client profiles:** one per club, covering platform, contacts, season dates, sponsors, vendors and policies.
2. **One request queue:** every call, email, voicemail, DM and app message becomes a row. If it isn't in the queue, it doesn't exist.
3. **Master deadline calendar:** every client's operational calendar merged, with reminders 7 days and 2 days out.
4. **Template library:** replies to recurring questions, in English and Spanish (Spanish is a listed plus).
5. **KPI tracker:** weekly numbers per client, used at check-ins.

AI's role is the morning brief, inbox triage with draft replies, call and voicemail transcripts turned into tasks, batched social posts, registration trend analysis, and a weekly at-risk review. See `docs/01-role-analysis.md` and `docs/05-ai-ops-system-plan.md`.

## What exists already (outputs from the chat)

| Output | Where | Notes |
|---|---|---|
| Platform learning plan | `docs/02-platform-learning-plan.md` + [live doc](https://claude.ai/code/artifact/837c3e10-24e1-4200-979e-101435e3a03a) | 2-week, hands-on plan for all six platforms |
| Riverbend YSC Operations Playbook | `docs/03-riverbend-operations-playbook.md` + [live doc](https://claude.ai/code/artifact/d12240bf-8ff3-487b-a8af-b67a8987d4c2) | **Portfolio piece** for interviews and cold outreach. The club is fictional. |
| Client Command Center (Demo) dashboard | `dashboard/`, `data/`, `docs/04-command-center-dashboard.md` + [live dashboard](https://claude.ai/artifact/GNgRXy4sS55GKZks5nE2R4) | 5 fictional clubs and 293 invented requests |
| Demo data generator | `scripts/generate_demo_data.py` | Seeded and reproducible; writes into `data/` |

The live links are claude.ai artifacts and are private until Chris shares them from each page's Share menu. The markdown copies here were exported on Oct 15, 2026 and match the live versions as of that date.

## Rules for working in this repo

- **All demo data is invented.** It covers Riverbend YSC, Harbor Point Volleyball, Live Oak Baseball League, Marsh Hawks Lacrosse and Tidewater Hoops. Keep it fictional. Never put real club, parent or youth-athlete data in this repo.
- **Be honest about experience.** In anything written for applications or outreach, describe platform skill levels truthfully: hands-on, trained, or studied. Don't overclaim.
- **Don't impersonate.** Don't pose as a club director to get vendor demos. Chris introduces himself as an administrator learning the platforms.
- **Respect Sports Office's stack once hired.** It has its own CRM and automation tools. Any personal system should plug into theirs, and no client or youth data goes into personal AI tools without their sign-off.
- **The dashboard HTML is an artifact page.** `dashboard/index.html` runs inside the claude.ai Dashboard artifact runtime and uses its `dash.data`, `dash.calc` and `dash.onData` API plus a global `d3` v7. It does **not** run as a standalone file. Making a standalone version is task #1 in next steps.
- Headline numbers on the live dashboard, as of Oct 13, 2026 5 pm: 293 requests, 11 open, 1 overdue, median first reply 3.9 h, 88.7% resolved within 48 h, 9 deadlines due in the next 14 days. Use these to sanity-check any port.

## Repo map

```
CLAUDE.md                     this file
README.md                     short human-facing overview
docs/00-job-posting.md        full posting text + application questions
docs/01-role-analysis.md      what the job is, how to be good at it, AI leverage
docs/02-platform-learning-plan.md
docs/03-riverbend-operations-playbook.md
docs/04-command-center-dashboard.md   dashboard spec, metrics, data schema
docs/05-ai-ops-system-plan.md         what to build in Claude Code (and when)
docs/06-next-steps.md                 open tasks, in priority order
data/                         demo CSVs (invented)
dashboard/index.html          dashboard page source (artifact runtime)
scripts/generate_demo_data.py regenerates data/
assets/sports-office-services-slide.png   Sports Office's own list of services
```

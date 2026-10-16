# Badgers

Badgers is a badge system that helps adults learn new skills and hobbies together. Members earn badges in small in-person groups (clans) that meet at regular meetups (setts). The app tracks badges, progress, and journal entries, and hosts clan chat and events.

## Read these first

- `docs/app-plan.md`: the build spec. Scope, roles and permissions, core flows, data model, rules to enforce, tech stack, and build steps. Treat it as the source of truth for what to build.
- `docs/overview.md`: the product context. Badge design, levels, the starter badge catalog (use it to seed data), and the pilot plan.

## How to work

- Build phase 1 (the friends pilot) in the order listed under "Build steps for phase 1" in `docs/app-plan.md`. Finish and verify one step before starting the next.
- Use the recommended stack unless I say otherwise: Expo (React Native, TypeScript) and Supabase (Postgres, Auth, Storage, Realtime).
- Enforce the rules in "Rules the app enforces" in the database with row-level security, not only in the UI.
- Include the phase 2 hooks now (`badges.status`, `users.role`, the `suggestions` table, and a `review_required` setting), but leave phase 2 screens unbuilt.
- Items marked "Proposed" and anything under "Open app questions" aren't decided. Ask me before building them, or pick the simplest option and note it.
- Never commit secrets. Keep the Supabase service role key out of client code and out of the repo; use `.env` and add it to `.gitignore`.

## Product principles

- Encouraging, not restrictive: no deadlines, no failure states, and nothing expires.
- Journal entries never require a badge tag.
- Use "badge," never "merit badge."

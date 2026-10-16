# App plan

A starting spec for the Badgers app: what it does, how it's structured, and the order to build it.

## Main features

The app is built around three features: your badge banner, the badge browser, and the Badger Den.

**Badge banner**

Each member collects badges on a banner instead of a sash. The app's banner is a digital copy of your physical one.

- Arrange badges to match the layout of your real banner.
- Tap a badge to see when you earned it, its level, who awarded it, and photos of your learning adventure.
- Badges in progress show below the banner, with their checklists.

**Badge browser**

- Search the catalog by name and filter by category.
- Open a badge to see both levels' requirements and who in your clan holds it, then save or start it.
- Submit an idea for a badge that's missing. Proposed: anyone with the expertise can turn an idea into a full badge; in phase 2, admins review it.

**Badger Den**

The Den is your clan's community space.

- Chat with your clan.
- See updates from the badges your clan is working on: journal entries, badges started, and badges earned.
- See scheduled clan events, like setts, and RSVP.
- Proposed: check-off requests and awards waiting on you also appear here.

## Scope

Version 1 supports one pilot clan of 5–8 friends. It replaces the shared spreadsheet, not the sett: everything that happens in person stays in person, and the app records it.

**Version 1 must let a member:**

- Sign in and join a clan with an invite code.
- See their badge banner, arrange it to match their physical banner, and open any badge's details and photos.
- Search and browse the catalog, save or start badges, and submit ideas for missing badges.
- Add a new badge with its requirements, and become its first master.
- Get the info part checked off by the clan member they taught.
- Post journal entries with photos, tagged to a badge and requirement.
- Receive a badge when a master, or two members, award it.
- Chat with their clan, see clan badge updates, and see scheduled clan events in the Badger Den.

**Later, once the pilot shows what people use:**

- Suggested edits to badges someone else created
- Reactions and comments on Den updates
- Milestones across categories
- Multiple clans and tools to start a new one
- Push notifications

## Phase 1 and phase 2

The app runs in two modes. In phase 1, the friends pilot, members are trusted and new badges publish right away. In phase 2, open use, admins approve or edit suggested badges and requirements before they go live.

| Behavior | Phase 1: trusted friends | Phase 2: open use |
| --- | --- | --- |
| New badges | Publish immediately | Submitted as suggestions; an admin approves, edits, or declines |
| Requirement changes | Creator, masters, or clan lead edit directly | Anyone suggests; an admin approves or edits |
| Creator's master status | Automatic on publish | Proposed: granted when an admin approves the badge |
| Joining | Invite code from the clan lead | Proposed: open sign-up, with clans still joined by invite |
| Catalog | One clan's catalog | Proposed: one shared catalog across clans |
| Moderation | Clan lead removes duplicates | Admin review queue, plus a report button on badges and journal entries |
| Roles | Member, master, clan lead | Adds admin, a role across the whole app |

**Build for phase 2 now, turn it on later**

A few small choices in phase 1 avoid a rebuild later:

- Add a `status` field to `badges`: draft, pending review, published, or declined. In phase 1, new badges go straight to published.
- Add a `role` field to `users`: member or admin.
- Add a `suggestions` table with `id`, `badge_id` (empty for a brand-new badge), `suggested_by_user_id`, `proposed_requirements`, `status`, `reviewed_by_user_id`, and `reviewed_at`.
- Use one setting, such as `review_required`, to switch from phase 1 to phase 2 without changing the badge flows.

**Phase 2 screens**

- Admin review queue for pending badges and requirement suggestions, with **Approve**, **Edit**, and **Decline**
- A **Suggest an edit** button on each badge
- Submission status on badges a member created

## Roles and permissions

Roles are mostly per badge, not per person. Everyone is a member; master status attaches to a specific badge, and clan lead is a clan-level role.

| Action | Member | Master (of that badge) | Clan lead |
| --- | --- | --- | --- |
| Browse, save, and start badges | Yes | Yes | Yes |
| Post journal entries | Yes | Yes | Yes |
| Check off another member's info part | Yes | Yes | Yes |
| Add a new badge and its requirements | Yes, and becomes its first master | Yes | Yes |
| Edit a badge's requirements | Only badges they created | Yes, for that badge | Yes, any badge |
| Award the beginner level | Only as one of two reviewers when no master exists | Yes, alone | Same as member |
| Award the master level | No | Yes | Same as member |
| Invite members and manage the clan | No | No | Yes |

The clan lead can remove or merge duplicate badges, but otherwise the catalog grows from members.

## Screens and navigation

A bottom tab bar with three tabs, one per main feature, holds every version 1 screen.

Navigation: three bottom tabs (Banner, Browser, Den), 11 screens total. The diagram lives in the original doc.

A **+** button on every tab opens a new journal entry. Lead tools, like invites and catalog cleanup, appear in the Den only for the clan lead.

## Core flows

**Start a badge**

1. Open a badge from the catalog and choose a level.
2. Tap **Start**. The badge moves to your in-progress list with its requirements as a checklist.

**Get the info part checked off**

1. Teach a clan member in person.
2. In the app, tap **Request check-off** on the info part and pick that member.
3. The member gets a request and taps **Confirm**. The info part is marked done with their name and the date.

A QR code the learner scans at the sett can replace step 2 later, if picking from a list feels slow.

**Complete the action part**

1. Post a journal entry with photos, what you made, and what you learned.
2. Tag the entry to the badge and the requirement it counts toward. Untagged entries are fine too.
3. When every required item has an entry, the badge shows **Ready for award**.

**Award a badge**

1. At the sett, a master of that badge opens the member's badge and reviews the checklist and journal.
2. The master taps **Award**. If no master exists, two members each tap **Approve**, and the second approval awards it.
3. The badge moves to the member's earned list with the date and who awarded it. The physical patch is handed out in person.

**Become a master**

The same flow as the beginner level, using the master requirements. Once awarded, the app lets that member award the beginner level of that badge.

**Add a badge**

1. Tap **New badge** in the catalog.
2. Enter the name, category, effort estimate, and art.
3. Write the info and action requirements for both levels, with choice groups where they fit.
4. Tap **Publish**. The badge appears in the catalog, and you're listed as its creator and first master.

Show a duplicate check as you type the name, so members find an existing badge before making a second one.

## Data model

Twelve tables cover version 1. The key idea: a member's progress on a badge is one `badge_progress` row per level, and requirements, check-offs, and journal entries all hang off it.

| Table | Key fields | Notes |
| --- | --- | --- |
| `users` | `id`, `name`, `avatar_url`, `role`, `created_at` | `role` is member or admin, for phase 2 |
| `clans` | `id`, `name`, `invite_code`, `lead_user_id` | Version 1 has one clan, but model it now |
| `clan_members` | `clan_id`, `user_id`, `joined_at` | Join table; lets a user belong to several clans later |
| `badges` | `id`, `name`, `category`, `effort_estimate`, `art_url`, `author_user_id`, `status` | `status` is draft, pending review, published, or declined |
| `requirements` | `id`, `badge_id`, `level` (beginner or master), `part` (info or action), `text`, `choice_group`, `sort_order` | `choice_group` handles "choose 2 of 3" |
| `badge_progress` | `id`, `user_id`, `badge_id`, `level`, `status` (saved, in progress, ready, awarded), `started_at`, `awarded_at`, `banner_position` | One row per member, badge, and level; `banner_position` places it on the banner |
| `checkoffs` | `id`, `progress_id`, `requirement_id`, `checked_by_user_id`, `created_at` | Info-part sign-offs from the person taught |
| `journal_entries` | `id`, `user_id`, `progress_id` (optional), `requirement_id` (optional), `body`, `photo_urls`, `created_at` | Feeds the badge detail photos and Den updates |
| `awards` | `id`, `progress_id`, `awarded_by_user_id`, `method` (master, two-member, creator), `created_at` | Two rows with method two-member = one award |
| `badge_ideas` | `id`, `submitted_by_user_id`, `name`, `description`, `status`, `badge_id` (once built) | Ideas for missing badges |
| `messages` | `id`, `clan_id`, `user_id`, `body`, `created_at` | Den chat |
| `events` | `id`, `clan_id`, `title`, `starts_at`, `location`, `notes` | Setts and other clan events; add an `event_rsvps` join table for RSVPs |

The Den's updates feed doesn't need its own table at first. Build it from recent `journal_entries`, `badge_progress` starts, and `awards` for the clan's members.

Master status isn't its own table. A member is a master of a badge when they have an awarded `badge_progress` row at the master level for it.

## Rules the app enforces

Keep the rules few and enforce them in the database, not only in the app's UI.

- A member can't check off their own info part or award their own badge.
- Publishing a new badge creates an awarded master-level `badge_progress` row for its creator, with award method `creator`.
- Only a master of a badge can award it alone. Without a master, the award needs approvals from two different members.
- A badge shows **Ready for award** when every required item is done, counting a choice group as done once enough of its options are.
- Nothing expires. A badge can sit in progress forever without a warning or a "failed" state.
- Journal entries never need a badge tag, so in-progress and failed attempts are easy to post.
- Only a badge's creator, its masters, or the clan lead can edit its requirements.

## Tech stack

Recommended starting point: Expo (React Native) for the app and Supabase for the backend. Confirm current versions and pricing when you start.

| Layer | Recommended | Why |
| --- | --- | --- |
| App | Expo (React Native, TypeScript) | One codebase for iPhone, Android, and web |
| Database | Supabase Postgres | The data model above is relational; row-level security can enforce the award rules |
| Sign-in | Supabase Auth | Email magic links or Sign in with Apple and Google |
| Photos | Supabase Storage | Journal photos, resized on upload |
| Den chat and live updates | Supabase Realtime | Pushes new messages and updates without a separate chat service |
| Pilot distribution | Expo Go or TestFlight, or the web build as a link | Friends can use it without an app store release |

Alternatives: Flutter with Firebase if you'd rather work in Dart, or a web-only progressive web app for the fastest pilot. Firebase's document database fits this data model less naturally than Postgres.

## Build steps for phase 1

Each step ends with something the pilot clan can use. Ship phase 2 before the first sett if you can; otherwise run that sett on a spreadsheet.

1. **Foundation:** Set up the project, sign-in, the database tables, and seed the starter badges by hand.
2. **Badge browser:** Search, category filters, badge pages with both levels, save and start, the new-badge editor, and idea submission.
3. **Journal and progress:** Photo upload, journal entries tagged to a badge and requirement, and in-progress checklists.
4. **Check-offs and awards:** Check-off requests and confirmations, plus master, two-member, and creator awards.
5. **Badge banner:** The banner with drag-to-arrange layout and badge detail with dates, awarders, and photos.
6. **Badger Den:** Clan chat, the updates feed, events with RSVPs, and invite codes.
7. **Pilot polish:** Badge art with beginner and master borders, empty states that encourage, and a feedback button.

## Open app questions

- Does a check-off happen live at the sett, by request, or both?
- Can clan members see each other's journals by default, or does each entry have a privacy setting?
- Should badge art live in the app as images, or do you design each badge in Illustrator and upload it?
- Is the web build enough for the pilot, or do you want a native app from the start?
- In phase 2, does an approved creator still become master automatically, or does an admin decide?

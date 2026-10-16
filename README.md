# Badgers

Badgers is a badge system that helps adults learn new skills together in small clans that meet at setts. This repo holds the product docs and a frontend prototype of the app.

- `docs/app-plan.md`: the build spec.
- `docs/overview.md`: product context and the starter badge catalog.

## Frontend prototype

The prototype is an Expo app (SDK 58, React Native, TypeScript, Expo Router). It covers every version 1 screen from the app plan, using mock data held in memory. There's no sign-in or backend yet.

### Run it

```sh
npm install
npm run web      # opens in the browser
npm start        # then scan the QR code with Expo Go
```

Before you commit, run `npm run typecheck` and `npm run lint`.

### Try it

1. On the welcome screen, either join with the invite code (`SETT-4821`) or pick a pilot member. Ryan is the clan lead.
2. To see both sides of a check-off or award, go to **Den** > **Clan** and use **Be [name]** to switch members.
3. Data resets when you reload the app. **Reset demo data** on the **Clan** screen restores the seed data without a reload.

The seed data sets up a few flows to try right away:

- Maya's 3D Printing badge is ready for award. As Ryan, a master of 3D Printing, you can award it alone.
- Priya's Sketching badge has no master, so it needs two member approvals. Sam has already approved it.
- Jordan has asked Ryan to confirm the Knots info part. Switch to Ryan and open **Den**.

### What's included

| Area | Screens |
| --- | --- |
| Banner | Your banner with an arrange mode, in-progress checklists, and saved badges |
| Browser | Search, category filters, badge pages with both levels, save and start, the new-badge editor with a duplicate check, and idea submission |
| Journal | The **+** button on every tab, photo picker, and optional badge and requirement tags |
| Check-offs and awards | Request and confirm check-offs; master, two-member, and creator awards |
| Den | Waiting on you, the updates feed, chat, events with RSVPs, and clan lead tools |

### Code layout

- `src/data/types.ts`: types that mirror the tables in the app plan, including the phase 2 hooks (`badges.status`, `users.role`, `suggestions`, and `settings.review_required`).
- `src/data/rules.ts`: derived state and the rules from "Rules the app enforces." These checks move into Postgres row-level security when the backend arrives.
- `src/data/store.ts`: the in-memory store. Each action matches a call the Supabase version will make, so screens don't change when the backend replaces it.
- `src/data/seed.ts`: mock clan, starter badges, and activity.
- `src/app/`: screens (Expo Router). `src/components/`: shared UI.

### Prototype decisions to confirm

These fill gaps in the spec. Each is the simplest option, and each is easy to change:

- **Choice groups** need a count, so requirements have a `choice_required` field ("choose 2 of 3").
- **Check-off requests** are stored separately (`checkoff_requests`) until the member confirms them. Check-offs happen by request; QR codes at the sett aren't built.
- **Waiting on you** in the Den shows check-off requests and awards you can give (marked "Proposed" in the spec).
- **Idea to badge:** anyone can tap **Build it** on an idea to write the badge (marked "Proposed" in the spec).
- **Award readiness:** the **Award** and **Approve** buttons appear only when every required item is done.
- **Master level:** only a master of the badge can award the master level. If no master exists, no one can award it yet.
- **Journals** are visible to the whole clan; there's no per-entry privacy setting.
- **Banner arranging** uses arrow buttons instead of drag and drop.
- **Badge art** is a placeholder: a flat-topped hexagon in the category color with an icon and cut-paper hills. Earned beginner badges have a green rim and master badges a purple rim.
- **Removing a duplicate** marks the badge `declined` instead of deleting it, so earned history stays intact.
- **Events** take a typed date for now; a date picker comes later.

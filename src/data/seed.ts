// Mock data for the frontend prototype. Badges come from the starter catalog
// in docs/overview.md; requirement wording is written fresh for Badgers.

import type { Badge, Db, Requirement } from './types';

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY).toISOString();
const daysFromNow = (n: number, hour = 18) => {
  const d = new Date(Date.now() + n * DAY);
  d.setHours(hour, 30, 0, 0);
  return d.toISOString();
};

export const CLAN_ID = 'clan-1';

type ReqSpec = [level: Requirement['level'], part: Requirement['part'], text: string, group?: string, required?: number];

function reqs(badgeId: string, specs: ReqSpec[]): Requirement[] {
  return specs.map(([level, part, text, group, required], i) => ({
    id: `${badgeId}-r${i + 1}`,
    badge_id: badgeId,
    level,
    part,
    text,
    choice_group: group ?? null,
    choice_required: group ? (required ?? 1) : null,
    sort_order: i,
  }));
}

function badge(
  id: string,
  name: string,
  category: Badge['category'],
  effort: string,
  author: string,
  description: string,
  createdDaysAgo: number,
): Badge {
  return {
    id,
    name,
    category,
    effort_estimate: effort,
    art_url: null,
    author_user_id: author,
    status: 'published',
    description,
    created_at: daysAgo(createdDaysAgo),
  };
}

export function createSeed(): Db {
  return {
    settings: { review_required: false },

    users: [
      { id: 'u-ryan', name: 'Ryan', avatar_url: null, role: 'member', created_at: daysAgo(60) },
      { id: 'u-maya', name: 'Maya', avatar_url: null, role: 'member', created_at: daysAgo(58) },
      { id: 'u-jordan', name: 'Jordan', avatar_url: null, role: 'member', created_at: daysAgo(58) },
      { id: 'u-priya', name: 'Priya', avatar_url: null, role: 'member', created_at: daysAgo(55) },
      { id: 'u-sam', name: 'Sam', avatar_url: null, role: 'member', created_at: daysAgo(54) },
      { id: 'u-alex', name: 'Alex', avatar_url: null, role: 'member', created_at: daysAgo(20) },
    ],

    clans: [{ id: CLAN_ID, name: 'Riverbank Clan', invite_code: 'SETT-4821', lead_user_id: 'u-ryan' }],

    clan_members: ['u-ryan', 'u-maya', 'u-jordan', 'u-priya', 'u-sam', 'u-alex'].map((user_id, i) => ({
      clan_id: CLAN_ID,
      user_id,
      joined_at: daysAgo(58 - i),
    })),

    badges: [
      badge('b-3dp', '3D Printing', 'Make', 'A month', 'u-ryan', 'Go from an idea to a printed object you actually use.', 50),
      badge('b-bike', 'Bike Maintenance', 'Move', 'A few weekends', 'u-ryan', 'Keep your own bike running and fix it on the road.', 50),
      badge('b-game', 'Game Design', 'Mind', 'A month', 'u-ryan', 'Make a game people want to play twice.', 49),
      badge('b-pottery', 'Pottery', 'Arts', 'A season', 'u-maya', 'Turn a lump of clay into something you can eat from.', 45),
      badge('b-bread', 'Bread', 'Kitchen', 'A few weekends', 'u-ryan', 'Bake a loaf worth sharing.', 48),
      badge('b-knots', 'Knots', 'Outdoors', 'A weekend', 'u-ryan', 'Tie the right knot, and untie it later.', 48),
      badge('b-sketch', 'Sketching', 'Arts', 'A month', 'u-ryan', 'See the world closely enough to draw it.', 47),
    ],

    requirements: [
      ...reqs('b-3dp', [
        ['beginner', 'info', 'Explain the main parts of a printer: frame, hotend, bed, and extruder.'],
        ['beginner', 'info', 'Walk through slicer settings: layer height, infill, supports, and temperature.'],
        ['beginner', 'info', 'Name three common print failures and how to fix each one.'],
        ['beginner', 'action', 'Design or modify a useful object and print it.'],
        ['master', 'info', 'Teach material choices, tolerances for moving parts, and printer calibration.'],
        ['master', 'action', 'Keep printing for at least 6 months, with at least 10 journal entries.'],
        ['master', 'action', 'Complete a capstone: a multi-part assembly or a tool you use weekly.'],
      ]),
      ...reqs('b-bike', [
        ['beginner', 'info', 'Explain how the drivetrain works and when a chain needs replacing.'],
        ['beginner', 'info', 'Show how to check and adjust brakes.'],
        ['beginner', 'action', 'Tune up your own bike.'],
        ['beginner', 'action', 'Fix a flat tire.'],
        ['master', 'info', 'Teach wheel truing, bearing service, and diagnosing noises.'],
        ['master', 'action', 'Fully overhaul a bike, yours or a friend’s.'],
      ]),
      ...reqs('b-game', [
        ['beginner', 'info', 'Explain a core loop, and show one in a game you like.'],
        ['beginner', 'info', 'Show how to write rules a new player can follow.'],
        ['beginner', 'action', 'Design a simple game and playtest it with the clan.'],
        ['master', 'info', 'Teach balancing, player motivation, and running a playtest.'],
        ['master', 'action', 'Run at least 5 playtests and revise the game after each one.'],
      ]),
      ...reqs('b-pottery', [
        ['beginner', 'info', 'Explain clay types and the stages from wet to leather-hard to bone dry.'],
        ['beginner', 'info', 'Explain what happens in bisque and glaze firings.'],
        ['beginner', 'action', 'Throw or hand-build a functional cup or bowl.', 'pottery-b', 2],
        ['beginner', 'action', 'Glaze and fire a piece.', 'pottery-b', 2],
        ['beginner', 'action', 'Make a set of three matching pieces.', 'pottery-b', 2],
        ['master', 'info', 'Teach clay bodies, glaze chemistry basics, and diagnosing cracks, warping, and crawling.'],
        ['master', 'action', 'Practice for at least 6 months, with at least 10 journal entries.'],
        ['master', 'action', 'Complete a capstone, such as a dinnerware set.'],
      ]),
      ...reqs('b-bread', [
        ['beginner', 'info', 'Explain what yeast and gluten do in a dough.'],
        ['beginner', 'info', 'Explain proofing, and how to tell when a dough is ready to bake.'],
        ['beginner', 'action', 'Bake a loaf and share it at a sett.'],
        ['master', 'info', 'Teach sourdough starters, hydration, and fixing dense or flat loaves.'],
        ['master', 'action', 'Bake at least 10 loaves across 3 styles, and journal each one.'],
      ]),
      ...reqs('b-knots', [
        ['beginner', 'info', 'Teach five common knots and when to use each one.'],
        ['beginner', 'action', 'Hang a hammock with knots you tied.', 'knots-b', 1],
        ['beginner', 'action', 'Pitch a tarp with a taut-line hitch.', 'knots-b', 1],
        ['master', 'info', 'Teach splices, lashings, and rope care.'],
        ['master', 'action', 'Build something with lashings, like a camp table.'],
      ]),
      ...reqs('b-sketch', [
        ['beginner', 'info', 'Explain one- and two-point perspective.'],
        ['beginner', 'info', 'Show how to shade with hatching and value scales.'],
        ['beginner', 'action', 'Fill 10 sketchbook pages from life.'],
        ['master', 'info', 'Teach composition, proportion, and drawing people.'],
        ['master', 'action', 'Fill a whole sketchbook and share your favorite five pages.'],
      ]),
    ],

    badge_progress: [
      // Creators are first masters of the badges they wrote.
      { id: 'p-ryan-3dp-m', user_id: 'u-ryan', badge_id: 'b-3dp', level: 'master', status: 'awarded', started_at: daysAgo(50), awarded_at: daysAgo(50), banner_position: 0 },
      { id: 'p-ryan-bike-m', user_id: 'u-ryan', badge_id: 'b-bike', level: 'master', status: 'awarded', started_at: daysAgo(50), awarded_at: daysAgo(50), banner_position: 1 },
      { id: 'p-ryan-game-m', user_id: 'u-ryan', badge_id: 'b-game', level: 'master', status: 'awarded', started_at: daysAgo(49), awarded_at: daysAgo(49), banner_position: 2 },
      { id: 'p-maya-pottery-m', user_id: 'u-maya', badge_id: 'b-pottery', level: 'master', status: 'awarded', started_at: daysAgo(45), awarded_at: daysAgo(45), banner_position: 0 },

      // Ryan
      { id: 'p-ryan-knots-b', user_id: 'u-ryan', badge_id: 'b-knots', level: 'beginner', status: 'awarded', started_at: daysAgo(40), awarded_at: daysAgo(12), banner_position: 3 },
      { id: 'p-ryan-bread-b', user_id: 'u-ryan', badge_id: 'b-bread', level: 'beginner', status: 'in_progress', started_at: daysAgo(18), awarded_at: null, banner_position: null },
      { id: 'p-ryan-pottery-b', user_id: 'u-ryan', badge_id: 'b-pottery', level: 'beginner', status: 'in_progress', started_at: daysAgo(9), awarded_at: null, banner_position: null },
      { id: 'p-ryan-sketch-b', user_id: 'u-ryan', badge_id: 'b-sketch', level: 'beginner', status: 'saved', started_at: null, awarded_at: null, banner_position: null },

      // Maya: 3D Printing is ready for a master to award.
      { id: 'p-maya-3dp-b', user_id: 'u-maya', badge_id: 'b-3dp', level: 'beginner', status: 'ready', started_at: daysAgo(30), awarded_at: null, banner_position: null },
      { id: 'p-maya-bread-b', user_id: 'u-maya', badge_id: 'b-bread', level: 'beginner', status: 'in_progress', started_at: daysAgo(14), awarded_at: null, banner_position: null },

      // Jordan
      { id: 'p-jordan-bike-b', user_id: 'u-jordan', badge_id: 'b-bike', level: 'beginner', status: 'awarded', started_at: daysAgo(40), awarded_at: daysAgo(12), banner_position: 0 },
      { id: 'p-jordan-knots-b', user_id: 'u-jordan', badge_id: 'b-knots', level: 'beginner', status: 'in_progress', started_at: daysAgo(10), awarded_at: null, banner_position: null },

      // Priya: Sketching has no master, so it needs two member approvals. Sam gave one.
      { id: 'p-priya-sketch-b', user_id: 'u-priya', badge_id: 'b-sketch', level: 'beginner', status: 'ready', started_at: daysAgo(35), awarded_at: null, banner_position: null },
      { id: 'p-priya-knots-b', user_id: 'u-priya', badge_id: 'b-knots', level: 'beginner', status: 'awarded', started_at: daysAgo(40), awarded_at: daysAgo(12), banner_position: 0 },

      // Sam
      { id: 'p-sam-game-b', user_id: 'u-sam', badge_id: 'b-game', level: 'beginner', status: 'in_progress', started_at: daysAgo(21), awarded_at: null, banner_position: null },
    ],

    checkoffs: [
      { id: 'c1', progress_id: 'p-ryan-knots-b', requirement_id: 'b-knots-r1', checked_by_user_id: 'u-priya', created_at: daysAgo(30) },
      { id: 'c2', progress_id: 'p-ryan-bread-b', requirement_id: 'b-bread-r1', checked_by_user_id: 'u-maya', created_at: daysAgo(12) },
      { id: 'c3', progress_id: 'p-maya-3dp-b', requirement_id: 'b-3dp-r1', checked_by_user_id: 'u-jordan', created_at: daysAgo(25) },
      { id: 'c4', progress_id: 'p-maya-3dp-b', requirement_id: 'b-3dp-r2', checked_by_user_id: 'u-jordan', created_at: daysAgo(25) },
      { id: 'c5', progress_id: 'p-maya-3dp-b', requirement_id: 'b-3dp-r3', checked_by_user_id: 'u-sam', created_at: daysAgo(20) },
      { id: 'c6', progress_id: 'p-jordan-bike-b', requirement_id: 'b-bike-r1', checked_by_user_id: 'u-maya', created_at: daysAgo(30) },
      { id: 'c7', progress_id: 'p-jordan-bike-b', requirement_id: 'b-bike-r2', checked_by_user_id: 'u-maya', created_at: daysAgo(30) },
      { id: 'c8', progress_id: 'p-priya-sketch-b', requirement_id: 'b-sketch-r1', checked_by_user_id: 'u-alex', created_at: daysAgo(15) },
      { id: 'c9', progress_id: 'p-priya-sketch-b', requirement_id: 'b-sketch-r2', checked_by_user_id: 'u-alex', created_at: daysAgo(15) },
      { id: 'c10', progress_id: 'p-priya-knots-b', requirement_id: 'b-knots-r1', checked_by_user_id: 'u-ryan', created_at: daysAgo(30) },
    ],

    checkoff_requests: [
      { id: 'cr1', progress_id: 'p-jordan-knots-b', requirement_id: 'b-knots-r1', requested_of_user_id: 'u-ryan', created_at: daysAgo(1) },
    ],

    journal_entries: [
      { id: 'j1', user_id: 'u-ryan', progress_id: 'p-ryan-knots-b', requirement_id: 'b-knots-r2', body: 'Hung the hammock between the two oaks with a bowline and a trucker’s hitch. Held all afternoon.', photo_urls: [], created_at: daysAgo(20) },
      { id: 'j2', user_id: 'u-ryan', progress_id: 'p-ryan-bread-b', requirement_id: null, body: 'First loaf came out dense as a brick. I think I under-proofed it. Trying again Saturday with a warmer spot.', photo_urls: [], created_at: daysAgo(6) },
      { id: 'j3', user_id: 'u-maya', progress_id: 'p-maya-3dp-b', requirement_id: 'b-3dp-r4', body: 'Designed a wall hook for my bike helmet in Tinkercad. Second print fit perfectly after I added 0.3 mm of clearance.', photo_urls: [], created_at: daysAgo(8) },
      { id: 'j4', user_id: 'u-jordan', progress_id: 'p-jordan-bike-b', requirement_id: 'b-bike-r3', body: 'Full tune-up: cleaned the chain, adjusted the derailleur, and trued the back wheel a little.', photo_urls: [], created_at: daysAgo(25) },
      { id: 'j5', user_id: 'u-jordan', progress_id: 'p-jordan-bike-b', requirement_id: 'b-bike-r4', body: 'Got a flat on the way to work and fixed it on the curb in 10 minutes.', photo_urls: [], created_at: daysAgo(18) },
      { id: 'j6', user_id: 'u-priya', progress_id: 'p-priya-sketch-b', requirement_id: 'b-sketch-r3', body: 'Page 10! Sketched the coffee shop from the window seat. Getting better at two-point perspective.', photo_urls: [], created_at: daysAgo(4) },
      { id: 'j7', user_id: 'u-priya', progress_id: 'p-priya-knots-b', requirement_id: 'b-knots-r3', body: 'Pitched a tarp over the picnic table in the rain. Taut-line hitch for the win.', photo_urls: [], created_at: daysAgo(28) },
      { id: 'j8', user_id: 'u-sam', progress_id: 'p-sam-game-b', requirement_id: null, body: 'Prototype of a card game about badgers digging tunnels. Needs a better win condition.', photo_urls: [], created_at: daysAgo(3) },
      { id: 'j9', user_id: 'u-alex', progress_id: null, requirement_id: null, body: 'Not working on a badge yet, but I tried watercolors for the first time. Very wet. Very fun.', photo_urls: [], created_at: daysAgo(2) },
    ],

    awards: [
      { id: 'a1', progress_id: 'p-ryan-3dp-m', awarded_by_user_id: 'u-ryan', method: 'creator', created_at: daysAgo(50) },
      { id: 'a2', progress_id: 'p-ryan-bike-m', awarded_by_user_id: 'u-ryan', method: 'creator', created_at: daysAgo(50) },
      { id: 'a3', progress_id: 'p-ryan-game-m', awarded_by_user_id: 'u-ryan', method: 'creator', created_at: daysAgo(49) },
      { id: 'a4', progress_id: 'p-maya-pottery-m', awarded_by_user_id: 'u-maya', method: 'creator', created_at: daysAgo(45) },
      { id: 'a5', progress_id: 'p-ryan-knots-b', awarded_by_user_id: 'u-maya', method: 'two_member', created_at: daysAgo(12) },
      { id: 'a6', progress_id: 'p-ryan-knots-b', awarded_by_user_id: 'u-sam', method: 'two_member', created_at: daysAgo(12) },
      { id: 'a7', progress_id: 'p-jordan-bike-b', awarded_by_user_id: 'u-ryan', method: 'master', created_at: daysAgo(12) },
      { id: 'a8', progress_id: 'p-priya-knots-b', awarded_by_user_id: 'u-jordan', method: 'two_member', created_at: daysAgo(12) },
      { id: 'a9', progress_id: 'p-priya-knots-b', awarded_by_user_id: 'u-maya', method: 'two_member', created_at: daysAgo(12) },
      // First of two approvals for Priya's Sketching badge.
      { id: 'a10', progress_id: 'p-priya-sketch-b', awarded_by_user_id: 'u-sam', method: 'two_member', created_at: daysAgo(2) },
    ],

    badge_ideas: [
      { id: 'i1', submitted_by_user_id: 'u-alex', name: 'Watercolor', description: 'Washes, wet-on-wet, and painting a landscape.', status: 'open', badge_id: null, created_at: daysAgo(2) },
      { id: 'i2', submitted_by_user_id: 'u-sam', name: 'Fermentation', description: 'Sauerkraut, kombucha, and keeping things safe.', status: 'open', badge_id: null, created_at: daysAgo(10) },
    ],

    messages: [
      { id: 'm1', clan_id: CLAN_ID, user_id: 'u-maya', body: 'Who’s bringing snacks to the next sett?', created_at: daysAgo(2) },
      { id: 'm2', clan_id: CLAN_ID, user_id: 'u-jordan', body: 'I can bring a loaf if my bread cooperates 😅', created_at: daysAgo(2) },
      { id: 'm3', clan_id: CLAN_ID, user_id: 'u-ryan', body: 'I’ll bring the printer so Maya can show off the helmet hook.', created_at: daysAgo(1) },
      { id: 'm4', clan_id: CLAN_ID, user_id: 'u-priya', body: 'Can someone else approve my Sketching badge at the sett? Sam already did.', created_at: daysAgo(1) },
    ],

    events: [
      { id: 'e1', clan_id: CLAN_ID, title: 'November sett', starts_at: daysFromNow(9), location: 'Ryan’s garage', notes: 'Showcase, awards, and Maya teaches the basics of Pottery.' },
      { id: 'e2', clan_id: CLAN_ID, title: 'Bike tune-up afternoon', starts_at: daysFromNow(16, 13), location: 'Riverside Park pavilion', notes: 'Bring your bike and a pump. Tools provided.' },
    ],

    event_rsvps: [
      { event_id: 'e1', user_id: 'u-maya', status: 'going' },
      { event_id: 'e1', user_id: 'u-jordan', status: 'going' },
      { event_id: 'e1', user_id: 'u-priya', status: 'maybe' },
      { event_id: 'e2', user_id: 'u-jordan', status: 'going' },
    ],

    suggestions: [],
  };
}

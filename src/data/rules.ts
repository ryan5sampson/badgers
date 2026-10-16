// Derived state and the rules from "Rules the app enforces" in
// docs/app-plan.md. When the backend arrives, these checks move into
// Postgres row-level security and functions; the UI keeps using the same
// answers to decide which buttons to show.

import type { Badge, BadgeProgress, Db, Id, JournalEntry, Level, Requirement, User } from './types';

export const byId = <T extends { id: Id }>(rows: T[], id: Id | null | undefined) =>
  id ? rows.find((r) => r.id === id) : undefined;

export const userName = (db: Db, id: Id | null | undefined) => byId(db.users, id)?.name ?? 'Someone';

export function requirementsFor(db: Db, badgeId: Id, level: Level) {
  return db.requirements
    .filter((r) => r.badge_id === badgeId && r.level === level)
    .sort((a, b) => a.sort_order - b.sort_order);
}

/** A member is a master of a badge when they hold its master level. */
export function isMaster(db: Db, userId: Id, badgeId: Id) {
  return db.badge_progress.some(
    (p) => p.user_id === userId && p.badge_id === badgeId && p.level === 'master' && p.status === 'awarded',
  );
}

export function mastersOf(db: Db, badgeId: Id): User[] {
  return db.badge_progress
    .filter((p) => p.badge_id === badgeId && p.level === 'master' && p.status === 'awarded')
    .map((p) => byId(db.users, p.user_id))
    .filter((u): u is User => !!u);
}

/** Everyone who holds a badge, at their highest level. */
export function holdersOf(db: Db, badgeId: Id): { user: User; level: Level }[] {
  const best = new Map<Id, Level>();
  for (const p of db.badge_progress) {
    if (p.badge_id !== badgeId || p.status !== 'awarded') continue;
    if (p.level === 'master' || !best.has(p.user_id)) best.set(p.user_id, p.level);
  }
  return [...best.entries()]
    .map(([id, level]) => ({ user: byId(db.users, id)!, level }))
    .filter((h) => h.user);
}

export function isClanLead(db: Db, userId: Id | null) {
  return !!userId && db.clans.some((c) => c.lead_user_id === userId);
}

export function canEditRequirements(db: Db, userId: Id, badge: Badge) {
  return badge.author_user_id === userId || isMaster(db, userId, badge.id) || isClanLead(db, userId);
}

export function checkoffFor(db: Db, progressId: Id, requirementId: Id) {
  return db.checkoffs.find((c) => c.progress_id === progressId && c.requirement_id === requirementId);
}

export function pendingRequestFor(db: Db, progressId: Id, requirementId: Id) {
  return db.checkoff_requests.find((c) => c.progress_id === progressId && c.requirement_id === requirementId);
}

export function entriesFor(db: Db, progressId: Id, requirementId?: Id): JournalEntry[] {
  return db.journal_entries
    .filter((j) => j.progress_id === progressId && (requirementId === undefined || j.requirement_id === requirementId))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function isRequirementDone(db: Db, progress: BadgeProgress, req: Requirement) {
  if (req.part === 'info') return !!checkoffFor(db, progress.id, req.id);
  return entriesFor(db, progress.id, req.id).length > 0;
}

export interface ChecklistGroup {
  key: string;
  /** Number of options that must be done; equals items.length for plain requirements. */
  required: number;
  items: { req: Requirement; done: boolean }[];
  done: boolean;
}

/**
 * Groups requirements so a choice group counts as done once enough of its
 * options are done, and a plain requirement counts on its own.
 */
export function checklist(db: Db, progress: BadgeProgress) {
  const groups: ChecklistGroup[] = [];
  for (const req of requirementsFor(db, progress.badge_id, progress.level)) {
    const item = { req, done: isRequirementDone(db, progress, req) };
    const existing = req.choice_group ? groups.find((g) => g.key === req.choice_group) : undefined;
    if (existing) existing.items.push(item);
    else
      groups.push({
        key: req.choice_group ?? req.id,
        required: req.choice_group ? (req.choice_required ?? 1) : 1,
        items: [item],
        done: false,
      });
  }
  for (const g of groups) g.done = g.items.filter((i) => i.done).length >= g.required;
  const total = groups.length;
  const complete = groups.filter((g) => g.done).length;
  return { groups, total, complete, ready: total > 0 && complete === total };
}

/** Status the UI shows. "Ready" is derived; nothing ever fails or expires. */
export function displayStatus(db: Db, progress: BadgeProgress) {
  if (progress.status === 'awarded' || progress.status === 'saved') return progress.status;
  return checklist(db, progress).ready ? 'ready' : 'in_progress';
}

export function approvalsFor(db: Db, progressId: Id) {
  return db.awards.filter((a) => a.progress_id === progressId && a.method === 'two_member');
}

export type AwardAbility =
  | { kind: 'award' }
  | { kind: 'approve'; approvals: number }
  | { kind: 'none'; reason: string };

/**
 * Who can award a badge:
 * - Never yourself.
 * - A master of the badge awards either level alone.
 * - With no master, two different members each approve the beginner level.
 */
export function awardAbility(db: Db, actorId: Id, progress: BadgeProgress): AwardAbility {
  if (progress.status === 'awarded') return { kind: 'none', reason: 'Already awarded.' };
  if (actorId === progress.user_id) return { kind: 'none', reason: 'Another member awards your badge.' };
  if (!checklist(db, progress).ready) return { kind: 'none', reason: 'The checklist isn’t finished yet.' };
  if (isMaster(db, actorId, progress.badge_id)) return { kind: 'award' };
  if (progress.level === 'master') return { kind: 'none', reason: 'A master of this badge awards the master level.' };
  const masters = mastersOf(db, progress.badge_id).filter((u) => u.id !== progress.user_id);
  if (masters.length > 0)
    return { kind: 'none', reason: `A master awards this badge: ${masters.map((m) => m.name).join(', ')}.` };
  const approvals = approvalsFor(db, progress.id);
  if (approvals.some((a) => a.awarded_by_user_id === actorId))
    return { kind: 'none', reason: 'You approved this. One more member needs to approve.' };
  return { kind: 'approve', approvals: approvals.length };
}

export function awardersOf(db: Db, progressId: Id) {
  return db.awards.filter((a) => a.progress_id === progressId);
}

/** Earned badges for the banner: one tile per badge at its highest level. */
export function bannerFor(db: Db, userId: Id) {
  const awarded = db.badge_progress.filter((p) => p.user_id === userId && p.status === 'awarded');
  const best = new Map<Id, BadgeProgress>();
  for (const p of awarded) {
    const cur = best.get(p.badge_id);
    if (!cur || p.level === 'master') best.set(p.badge_id, p);
  }
  return [...best.values()].sort(
    (a, b) => (a.banner_position ?? 999) - (b.banner_position ?? 999) || (a.awarded_at ?? '').localeCompare(b.awarded_at ?? ''),
  );
}

/**
 * Places earned badges in banner slots. A badge keeps its saved slot;
 * badges without one, or whose slot is taken, fill the first free slot.
 */
export function bannerSlots(db: Db, userId: Id): Map<number, BadgeProgress> {
  const slots = new Map<number, BadgeProgress>();
  const tiles = bannerFor(db, userId);
  const unplaced: BadgeProgress[] = [];
  for (const t of tiles) {
    const pos = t.banner_position;
    if (pos !== null && pos >= 0 && !slots.has(pos)) slots.set(pos, t);
    else unplaced.push(t);
  }
  let next = 0;
  for (const t of unplaced) {
    while (slots.has(next)) next++;
    slots.set(next, t);
  }
  return slots;
}

/** The first empty banner slot, where a newly earned badge goes. */
export function nextBannerSlot(db: Db, userId: Id) {
  const taken = bannerSlots(db, userId);
  let slot = 0;
  while (taken.has(slot)) slot++;
  return slot;
}

export function progressFor(db: Db, userId: Id, status: BadgeProgress['status'][]) {
  return db.badge_progress
    .filter((p) => p.user_id === userId && status.includes(p.status))
    .sort((a, b) => (b.started_at ?? '').localeCompare(a.started_at ?? ''));
}

export function photosFor(db: Db, userId: Id, badgeId: Id) {
  const progressIds = db.badge_progress.filter((p) => p.user_id === userId && p.badge_id === badgeId).map((p) => p.id);
  return db.journal_entries.filter((j) => j.progress_id && progressIds.includes(j.progress_id));
}

export type FeedItem =
  | { kind: 'journal'; at: string; entry: JournalEntry }
  | { kind: 'started'; at: string; progress: BadgeProgress }
  | { kind: 'awarded'; at: string; progress: BadgeProgress };

/** The Den feed is built from recent journal entries, starts, and awards. */
export function denFeed(db: Db, clanId: Id): FeedItem[] {
  const members = new Set(db.clan_members.filter((m) => m.clan_id === clanId).map((m) => m.user_id));
  const items: FeedItem[] = [];
  for (const entry of db.journal_entries) {
    if (members.has(entry.user_id)) items.push({ kind: 'journal', at: entry.created_at, entry });
  }
  for (const p of db.badge_progress) {
    if (!members.has(p.user_id)) continue;
    const method = awardersOf(db, p.id)[0]?.method;
    if (p.started_at && p.status !== 'saved' && method !== 'creator')
      items.push({ kind: 'started', at: p.started_at, progress: p });
    if (p.awarded_at && p.status === 'awarded') items.push({ kind: 'awarded', at: p.awarded_at, progress: p });
  }
  return items.sort((a, b) => b.at.localeCompare(a.at));
}

/** Check-off requests and awards a member can act on. */
export function waitingOn(db: Db, userId: Id) {
  const requests = db.checkoff_requests.filter((r) => r.requested_of_user_id === userId);
  const awards = db.badge_progress.filter((p) => {
    if (p.status === 'awarded' || p.status === 'saved') return false;
    return awardAbility(db, userId, p).kind !== 'none';
  });
  return { requests, awards };
}

/** Badges whose names look like the one being typed, for the duplicate check. */
export function similarBadges(db: Db, name: string, excludeId?: Id) {
  const q = normalize(name);
  if (q.length < 3) return [];
  return db.badges.filter((b) => {
    if (b.id === excludeId || b.status === 'declined') return false;
    const n = normalize(b.name);
    return n.includes(q) || q.includes(n);
  });
}

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

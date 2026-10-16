// In-memory store for the prototype. Each action matches a call the
// Supabase version will make, and checks the same rules so the screens
// behave the way they will against the real backend. State resets when the
// app reloads.

import { useSyncExternalStore } from 'react';

import { approvalsFor, awardAbility, byId, canEditRequirements, checklist, isClanLead } from './rules';
import { CLAN_ID, createSeed } from './seed';
import type { Badge, BadgeProgress, Category, Db, Id, Level, Requirement, RsvpStatus } from './types';

export class RuleError extends Error {}

let counter = 0;
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;
const now = () => new Date().toISOString();

export type DraftRequirement = Pick<Requirement, 'level' | 'part' | 'text' | 'choice_group' | 'choice_required'>;

export interface BadgeDraft {
  name: string;
  category: Category;
  effort_estimate: string;
  description: string;
  requirements: DraftRequirement[];
}

function createActions(get: () => Db, set: (db: Db) => void, getMe: () => Id | null, setMe: (id: Id | null) => void) {
  const me = () => {
    const id = getMe();
    if (!id) throw new RuleError('Sign in first.');
    return id;
  };
  const progressOrThrow = (id: Id) => {
    const p = byId(get().badge_progress, id);
    if (!p) throw new RuleError('That badge progress no longer exists.');
    return p;
  };
  const patchProgress = (db: Db, id: Id, patch: Partial<BadgeProgress>): Db => ({
    ...db,
    badge_progress: db.badge_progress.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  });
  // Keeps the stored status in step with the checklist, the way a database
  // trigger would.
  const syncStatus = (db: Db, progressId: Id | null): Db => {
    const p = byId(db.badge_progress, progressId);
    if (!p || p.status === 'awarded' || p.status === 'saved') return db;
    const status = checklist(db, p).ready ? 'ready' : 'in_progress';
    return status === p.status ? db : patchProgress(db, p.id, { status });
  };

  return {
    signIn(userId: Id) {
      setMe(userId);
    },

    signOut() {
      setMe(null);
    },

    joinClan(code: string, name: string) {
      const db = get();
      const clan = db.clans.find((c) => c.invite_code.toLowerCase() === code.trim().toLowerCase());
      if (!clan) throw new RuleError('That invite code doesn’t match a clan. Check it with your clan lead.');
      if (!name.trim()) throw new RuleError('Add your name so your clan knows who you are.');
      const id = newId('u');
      set({
        ...db,
        users: [...db.users, { id, name: name.trim(), avatar_url: null, role: 'member', created_at: now() }],
        clan_members: [...db.clan_members, { clan_id: clan.id, user_id: id, joined_at: now() }],
      });
      setMe(id);
    },

    /** Saves or starts a badge level. Starting a saved badge moves it to in progress. */
    setBadgeProgress(badgeId: Id, level: Level, status: 'saved' | 'in_progress') {
      const userId = me();
      const db = get();
      const existing = db.badge_progress.find((p) => p.user_id === userId && p.badge_id === badgeId && p.level === level);
      if (existing) {
        if (existing.status !== 'saved') return existing.id;
        if (status === 'saved') return existing.id;
        set(syncStatus(patchProgress(db, existing.id, { status: 'in_progress', started_at: now() }), existing.id));
        return existing.id;
      }
      const id = newId('p');
      const row: BadgeProgress = {
        id,
        user_id: userId,
        badge_id: badgeId,
        level,
        status,
        started_at: status === 'in_progress' ? now() : null,
        awarded_at: null,
        banner_position: null,
      };
      set(syncStatus({ ...db, badge_progress: [...db.badge_progress, row] }, id));
      return id;
    },

    /** Removes a saved badge. In-progress badges stay put; nothing expires. */
    unsave(progressId: Id) {
      const p = progressOrThrow(progressId);
      if (p.user_id !== me() || p.status !== 'saved') return;
      const db = get();
      set({ ...db, badge_progress: db.badge_progress.filter((x) => x.id !== progressId) });
    },

    /**
     * Publishes a badge. The creator becomes its first master through an
     * awarded master-level progress row with award method "creator".
     */
    createBadge(draft: BadgeDraft, ideaId?: Id) {
      const userId = me();
      const db = get();
      validateDraft(draft);
      const badgeId = newId('b');
      const status = db.settings.review_required ? 'pending_review' : 'published';
      const badge: Badge = {
        id: badgeId,
        name: draft.name.trim(),
        category: draft.category,
        effort_estimate: draft.effort_estimate.trim(),
        description: draft.description.trim(),
        art_url: null,
        author_user_id: userId,
        status,
        created_at: now(),
      };
      const next: Db = {
        ...db,
        badges: [...db.badges, badge],
        requirements: [...db.requirements, ...toRequirements(badgeId, draft.requirements)],
        badge_ideas: db.badge_ideas.map((i) => (i.id === ideaId ? { ...i, status: 'built', badge_id: badgeId } : i)),
      };
      if (status === 'published') {
        const progressId = newId('p');
        const position = db.badge_progress.filter((p) => p.user_id === userId && p.status === 'awarded').length;
        next.badge_progress = [
          ...next.badge_progress,
          { id: progressId, user_id: userId, badge_id: badgeId, level: 'master', status: 'awarded', started_at: now(), awarded_at: now(), banner_position: position },
        ];
        next.awards = [...next.awards, { id: newId('a'), progress_id: progressId, awarded_by_user_id: userId, method: 'creator', created_at: now() }];
      }
      set(next);
      return badgeId;
    },

    /** Only the badge's creator, its masters, or the clan lead can edit requirements. */
    updateBadge(badgeId: Id, draft: BadgeDraft) {
      const userId = me();
      const db = get();
      const badge = byId(db.badges, badgeId);
      if (!badge) throw new RuleError('That badge no longer exists.');
      if (!canEditRequirements(db, userId, badge))
        throw new RuleError('Only the badge’s creator, its masters, or the clan lead can edit it.');
      validateDraft(draft);
      let next: Db = {
        ...db,
        badges: db.badges.map((b) =>
          b.id === badgeId
            ? { ...b, name: draft.name.trim(), category: draft.category, effort_estimate: draft.effort_estimate.trim(), description: draft.description.trim() }
            : b,
        ),
        requirements: [...db.requirements.filter((r) => r.badge_id !== badgeId), ...toRequirements(badgeId, draft.requirements)],
      };
      for (const p of next.badge_progress.filter((x) => x.badge_id === badgeId)) next = syncStatus(next, p.id);
      set(next);
    },

    /** Clan lead tool for duplicates. Marks the badge declined instead of deleting history. */
    removeBadge(badgeId: Id) {
      const db = get();
      if (!isClanLead(db, me())) throw new RuleError('Only the clan lead can remove badges.');
      set({ ...db, badges: db.badges.map((b) => (b.id === badgeId ? { ...b, status: 'declined' } : b)) });
    },

    submitIdea(name: string, description: string) {
      const userId = me();
      if (!name.trim()) throw new RuleError('Give the idea a name.');
      const db = get();
      set({
        ...db,
        badge_ideas: [
          ...db.badge_ideas,
          { id: newId('i'), submitted_by_user_id: userId, name: name.trim(), description: description.trim(), status: 'open', badge_id: null, created_at: now() },
        ],
      });
    },

    /** Journal entries never need a badge tag. */
    addJournalEntry(input: { body: string; photo_urls: string[]; progress_id: Id | null; requirement_id: Id | null }) {
      const userId = me();
      if (!input.body.trim() && input.photo_urls.length === 0) throw new RuleError('Add a photo or a few words.');
      if (input.progress_id) {
        const p = progressOrThrow(input.progress_id);
        if (p.user_id !== userId) throw new RuleError('You can only tag your own badges.');
      }
      const db = get();
      const entry = {
        id: newId('j'),
        user_id: userId,
        progress_id: input.progress_id,
        requirement_id: input.progress_id ? input.requirement_id : null,
        body: input.body.trim(),
        photo_urls: input.photo_urls,
        created_at: now(),
      };
      set(syncStatus({ ...db, journal_entries: [...db.journal_entries, entry] }, input.progress_id));
    },

    requestCheckoff(progressId: Id, requirementId: Id, ofUserId: Id) {
      const userId = me();
      const p = progressOrThrow(progressId);
      if (p.user_id !== userId) throw new RuleError('You can only request check-offs for your own badges.');
      if (ofUserId === userId) throw new RuleError('Pick the clan member you taught. You can’t check yourself off.');
      const db = get();
      set({
        ...db,
        checkoff_requests: [
          ...db.checkoff_requests.filter((r) => !(r.progress_id === progressId && r.requirement_id === requirementId)),
          { id: newId('cr'), progress_id: progressId, requirement_id: requirementId, requested_of_user_id: ofUserId, created_at: now() },
        ],
      });
    },

    cancelCheckoffRequest(requestId: Id) {
      const db = get();
      set({ ...db, checkoff_requests: db.checkoff_requests.filter((r) => r.id !== requestId) });
    },

    confirmCheckoff(requestId: Id) {
      const userId = me();
      const db = get();
      const request = byId(db.checkoff_requests, requestId);
      if (!request) throw new RuleError('That request was already handled.');
      if (request.requested_of_user_id !== userId) throw new RuleError('This request is for someone else.');
      const p = progressOrThrow(request.progress_id);
      if (p.user_id === userId) throw new RuleError('You can’t check off your own info part.');
      const next: Db = {
        ...db,
        checkoff_requests: db.checkoff_requests.filter((r) => r.id !== requestId),
        checkoffs: [
          ...db.checkoffs,
          { id: newId('c'), progress_id: p.id, requirement_id: request.requirement_id, checked_by_user_id: userId, created_at: now() },
        ],
      };
      set(syncStatus(next, p.id));
    },

    /** A master awards alone; otherwise this records one of two member approvals. */
    award(progressId: Id) {
      const userId = me();
      const db = get();
      const p = progressOrThrow(progressId);
      const ability = awardAbility(db, userId, p);
      if (ability.kind === 'none') throw new RuleError(ability.reason);
      const method = ability.kind === 'award' ? 'master' : 'two_member';
      let next: Db = { ...db, awards: [...db.awards, { id: newId('a'), progress_id: p.id, awarded_by_user_id: userId, method, created_at: now() }] };
      const done = method === 'master' || approvalsFor(next, p.id).length >= 2;
      if (done) {
        const position = db.badge_progress.filter((x) => x.user_id === p.user_id && x.status === 'awarded').length;
        const existingTile = db.badge_progress.find(
          (x) => x.user_id === p.user_id && x.badge_id === p.badge_id && x.status === 'awarded',
        );
        next = patchProgress(next, p.id, {
          status: 'awarded',
          awarded_at: now(),
          banner_position: existingTile?.banner_position ?? position,
        });
      }
      set(next);
      return done;
    },

    /** Moves a badge one slot on the banner to match the physical layout. */
    moveOnBanner(progressId: Id, direction: -1 | 1, orderedIds: Id[]) {
      const index = orderedIds.indexOf(progressId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= orderedIds.length) return;
      const order = [...orderedIds];
      [order[index], order[target]] = [order[target], order[index]];
      const db = get();
      set({
        ...db,
        badge_progress: db.badge_progress.map((p) => {
          const pos = order.indexOf(p.id);
          return pos >= 0 ? { ...p, banner_position: pos } : p;
        }),
      });
    },

    sendMessage(body: string) {
      const userId = me();
      if (!body.trim()) return;
      const db = get();
      set({ ...db, messages: [...db.messages, { id: newId('m'), clan_id: CLAN_ID, user_id: userId, body: body.trim(), created_at: now() }] });
    },

    rsvp(eventId: Id, status: RsvpStatus) {
      const userId = me();
      const db = get();
      set({
        ...db,
        event_rsvps: [...db.event_rsvps.filter((r) => !(r.event_id === eventId && r.user_id === userId)), { event_id: eventId, user_id: userId, status }],
      });
    },

    addEvent(input: { title: string; starts_at: string; location: string; notes: string }) {
      const db = get();
      if (!isClanLead(db, me())) throw new RuleError('Only the clan lead schedules events.');
      if (!input.title.trim()) throw new RuleError('Give the event a title.');
      set({ ...db, events: [...db.events, { id: newId('e'), clan_id: CLAN_ID, ...input }] });
    },

    newInviteCode() {
      const db = get();
      if (!isClanLead(db, me())) throw new RuleError('Only the clan lead manages invites.');
      const code = `SETT-${Math.floor(1000 + Math.random() * 9000)}`;
      set({ ...db, clans: db.clans.map((c) => (c.id === CLAN_ID ? { ...c, invite_code: code } : c)) });
    },

    resetDemo() {
      const seed = createSeed();
      set(seed);
      // A member who joined during the demo no longer exists after a reset.
      if (!byId(seed.users, getMe())) setMe(seed.clans[0].lead_user_id);
    },
  };
}

function validateDraft(draft: BadgeDraft) {
  if (!draft.name.trim()) throw new RuleError('Give the badge a name.');
  for (const level of ['beginner', 'master'] as const) {
    for (const part of ['info', 'action'] as const) {
      if (!draft.requirements.some((r) => r.level === level && r.part === part && r.text.trim()))
        throw new RuleError(`Add at least one ${level} ${part} requirement.`);
    }
  }
}

function toRequirements(badgeId: Id, drafts: DraftRequirement[]): Requirement[] {
  return drafts
    .filter((r) => r.text.trim())
    .map((r, i) => ({
      ...r,
      text: r.text.trim(),
      choice_required: r.choice_group ? (r.choice_required ?? 1) : null,
      id: newId(`${badgeId}-r`),
      badge_id: badgeId,
      sort_order: i,
    }));
}

export type Actions = ReturnType<typeof createActions>;

// State lives outside React so actions can read the latest value
// synchronously and throw rule errors before anything changes.
let state: { db: Db; meId: Id | null } = { db: createSeed(), meId: null };
const listeners = new Set<() => void>();
const emit = (next: typeof state) => {
  state = next;
  listeners.forEach((l) => l());
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => state;

const actions = createActions(
  () => state.db,
  (db) => emit({ ...state, db }),
  () => state.meId,
  (meId) => emit({ ...state, meId }),
);

export function useStore() {
  const { db, meId } = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { db, meId, actions };
}

/** For screens behind the sign-in gate, where a member is always signed in. */
export function useMe() {
  const { db, meId } = useStore();
  const me = byId(db.users, meId);
  if (!me) throw new Error('useMe called while signed out');
  return me;
}

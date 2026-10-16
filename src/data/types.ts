// Types mirror the tables in docs/app-plan.md ("Data model") so the mock
// store can be swapped for Supabase without reshaping the screens.

export type Id = string;

export type UserRole = 'member' | 'admin';
export type BadgeStatus = 'draft' | 'pending_review' | 'published' | 'declined';
export type Level = 'beginner' | 'master';
export type Part = 'info' | 'action';
export type ProgressStatus = 'saved' | 'in_progress' | 'ready' | 'awarded';
export type AwardMethod = 'master' | 'two_member' | 'creator';
export type IdeaStatus = 'open' | 'built' | 'closed';
export type SuggestionStatus = 'pending' | 'approved' | 'declined';
export type RsvpStatus = 'going' | 'maybe' | 'not_going';

export const CATEGORIES = [
  'Make',
  'Move',
  'Outdoors',
  'Kitchen',
  'Arts',
  'Mind',
  'Life Skills',
] as const;
export type Category = (typeof CATEGORIES)[number];

export interface User {
  id: Id;
  name: string;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
}

export interface Clan {
  id: Id;
  name: string;
  invite_code: string;
  lead_user_id: Id;
}

export interface ClanMember {
  clan_id: Id;
  user_id: Id;
  joined_at: string;
}

export interface Badge {
  id: Id;
  name: string;
  category: Category;
  effort_estimate: string;
  art_url: string | null;
  author_user_id: Id;
  status: BadgeStatus;
  description: string;
  created_at: string;
}

export interface Requirement {
  id: Id;
  badge_id: Id;
  level: Level;
  part: Part;
  text: string;
  /** Requirements that share a choice group form a "choose N of M" set. */
  choice_group: string | null;
  /**
   * How many options in the choice group count as done. Not in the spec's
   * table; added so "choose 2 of 3" is data, not prose.
   */
  choice_required: number | null;
  sort_order: number;
}

export interface BadgeProgress {
  id: Id;
  user_id: Id;
  badge_id: Id;
  level: Level;
  status: ProgressStatus;
  started_at: string | null;
  awarded_at: string | null;
  banner_position: number | null;
}

export interface Checkoff {
  id: Id;
  progress_id: Id;
  requirement_id: Id;
  checked_by_user_id: Id;
  created_at: string;
}

/**
 * A pending request for a check-off. Not a table in the spec; the spec's
 * "Request check-off" flow needs somewhere to hold the request until the
 * member confirms it.
 */
export interface CheckoffRequest {
  id: Id;
  progress_id: Id;
  requirement_id: Id;
  requested_of_user_id: Id;
  created_at: string;
}

export interface JournalEntry {
  id: Id;
  user_id: Id;
  progress_id: Id | null;
  requirement_id: Id | null;
  body: string;
  photo_urls: string[];
  created_at: string;
}

export interface Award {
  id: Id;
  progress_id: Id;
  awarded_by_user_id: Id;
  method: AwardMethod;
  created_at: string;
}

export interface BadgeIdea {
  id: Id;
  submitted_by_user_id: Id;
  name: string;
  description: string;
  status: IdeaStatus;
  badge_id: Id | null;
  created_at: string;
}

export interface Message {
  id: Id;
  clan_id: Id;
  user_id: Id;
  body: string;
  created_at: string;
}

export interface ClanEvent {
  id: Id;
  clan_id: Id;
  title: string;
  starts_at: string;
  location: string;
  notes: string;
}

export interface EventRsvp {
  event_id: Id;
  user_id: Id;
  status: RsvpStatus;
}

/** Phase 2 hook. No screens use it yet. */
export interface Suggestion {
  id: Id;
  badge_id: Id | null;
  suggested_by_user_id: Id;
  proposed_requirements: Omit<Requirement, 'id' | 'badge_id'>[];
  status: SuggestionStatus;
  reviewed_by_user_id: Id | null;
  reviewed_at: string | null;
}

export interface Settings {
  /** Phase 2 switch: when true, new badges go to pending review. */
  review_required: boolean;
}

export interface Db {
  users: User[];
  clans: Clan[];
  clan_members: ClanMember[];
  badges: Badge[];
  requirements: Requirement[];
  badge_progress: BadgeProgress[];
  checkoffs: Checkoff[];
  checkoff_requests: CheckoffRequest[];
  journal_entries: JournalEntry[];
  awards: Award[];
  badge_ideas: BadgeIdea[];
  messages: Message[];
  events: ClanEvent[];
  event_rsvps: EventRsvp[];
  suggestions: Suggestion[];
  settings: Settings;
}

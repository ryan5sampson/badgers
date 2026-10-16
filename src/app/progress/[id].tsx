import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Image } from 'expo-image';

import { BadgeArt } from '@/components/badge-art';
import { PaperScene } from '@/components/paper-scene';
import { JournalCard } from '@/components/journal';
import { StatusPill } from '@/components/progress';
import { PART_HINT, PART_LABEL } from '@/components/requirements';
import { Avatar, Button, Card, Empty, Icon, Pill, Row, Screen, Section, T, attempt, formatDate, notify } from '@/components/ui';
import { Colors, Paper, Radius, Spacing } from '@/constants/theme';
import { useMe, useStore } from '@/data/store';
import {
  approvalsFor,
  awardAbility,
  awardersOf,
  byId,
  checkoffFor,
  checklist,
  displayStatus,
  entriesFor,
  pendingRequestFor,
  photosFor,
  userName,
  type ChecklistGroup,
} from '@/data/rules';
import type { BadgeProgress, Db, Requirement } from '@/data/types';

const METHOD_LABEL = { master: 'Awarded by a master', two_member: 'Approved by two members', creator: 'Created this badge' } as const;

/**
 * One member's progress on one badge level: the checklist while in
 * progress, or the earned record (date, awarders, photos) once awarded.
 */
export default function ProgressDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db } = useStore();
  const me = useMe();
  const progress = byId(db.badge_progress, id);
  const badge = progress && byId(db.badges, progress.badge_id);

  if (!progress || !badge)
    return (
      <Screen>
        <Empty icon="magnify" title="Nothing here" body="This badge progress no longer exists." />
      </Screen>
    );

  const mine = progress.user_id === me.id;
  const owner = userName(db, progress.user_id);
  const list = checklist(db, progress);
  const status = displayStatus(db, progress);
  const earned = progress.status === 'awarded';
  // An earned badge's page collects entries from every level of it.
  const entries = earned
    ? photosFor(db, progress.user_id, badge.id).sort((a, b) => b.created_at.localeCompare(a.created_at))
    : entriesFor(db, progress.id);
  const photos = entries.flatMap((e) => e.photo_urls.map((uri) => ({ uri, entry: e })));

  return (
    <Screen>
      <Stack.Screen options={{ title: mine ? badge.name : `${owner}: ${badge.name}` }} />
      {earned ? (
        <>
          <PaperScene height={170} style={{ alignItems: 'center', justifyContent: 'center' }}>
            <BadgeArt badge={badge} size={124} level={progress.level} />
          </PaperScene>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <T variant="title" style={{ textAlign: 'center' }}>
              {badge.name}
            </T>
            <Pill label={progress.level === 'master' ? 'Master' : 'Beginner'} tone={progress.level} style={{ alignSelf: 'center' }} />
          </View>
        </>
      ) : (
        <Row gap={Spacing.lg}>
          <BadgeArt badge={badge} size={84} dimmed={progress.status === 'saved'} />
          <View style={{ flex: 1, gap: 4 }}>
            <T variant="heading">{badge.name}</T>
            <T variant="muted">
              {mine ? 'Your' : `${owner}’s`} {progress.level} level
            </T>
            <StatusPill db={db} progress={progress} />
          </View>
        </Row>
      )}
      <Button label="About this badge" kind="ghost" small icon="information-outline" onPress={() => router.push({ pathname: '/badge/[id]', params: { id: badge.id } })} style={{ alignSelf: 'flex-start' }} />

      {earned && <EarnedCard db={db} progress={progress} />}
      {earned && (
        <Section title="Photos">
          {photos.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
              {photos.map(({ uri, entry }) => (
                <Image key={`${entry.id}-${uri}`} source={{ uri }} style={{ width: '48%', aspectRatio: 1, borderRadius: Radius.md, boxShadow: Paper.raised }} contentFit="cover" />
              ))}
            </View>
          ) : (
            <Card>
              <Row gap={Spacing.md}>
                <Icon name="camera-outline" size={28} color={Colors.textMuted} />
                <T variant="muted" style={{ flex: 1 }}>
                  {mine ? 'Add a photo of you completing it. It goes here and in your journal.' : `${owner} hasn’t added photos for this badge yet.`}
                </T>
              </Row>
              {mine && <Button small kind="secondary" icon="image-plus" label="Add a photo" onPress={() => router.push({ pathname: '/journal/new', params: { progressId: progress.id } })} style={{ alignSelf: 'flex-start' }} />}
            </Card>
          )}
        </Section>
      )}
      {progress.status === 'saved' && mine && <SavedCard progress={progress} />}
      {!mine && progress.status !== 'awarded' && progress.status !== 'saved' && <AwardPanel db={db} progress={progress} />}
      {mine && status === 'ready' && (
        <Card style={{ backgroundColor: Colors.accentSoft, borderColor: Colors.accentSoft }}>
          <T style={{ fontWeight: '700' }}>Ready for award</T>
          <T>Every requirement is done. Bring it to the next sett, where a master (or two members) can award it.</T>
        </Card>
      )}

      {progress.status !== 'saved' && (
        <Section title={earned ? 'How it was earned' : `Checklist · ${list.complete} of ${list.total}`}>
          {(['info', 'action'] as const).map((part) => {
            const groups = list.groups.filter((g) => g.items[0].req.part === part);
            if (groups.length === 0) return null;
            return (
              <Card key={part}>
                <T variant="label">{PART_LABEL[part]}</T>
                <T variant="small">{PART_HINT[part]}</T>
                {groups.map((g) => (
                  <GroupView key={g.key} db={db} progress={progress} group={g} mine={mine} />
                ))}
              </Card>
            );
          })}
        </Section>
      )}

      <Section
        title={earned ? 'Your entries' : 'Journal'}
        action={mine && progress.status !== 'saved' ? <Button small kind="secondary" icon="plus" label="Add entry" onPress={() => router.push({ pathname: '/journal/new', params: { progressId: progress.id } })} /> : undefined}>
        {entries.length === 0 ? (
          <T variant="muted">{mine ? 'No entries yet. Post works in progress too; nothing here has to be perfect.' : `${owner} hasn’t posted for this badge yet.`}</T>
        ) : (
          entries.map((e) => <JournalCard key={e.id} db={db} entry={e} showBadge={false} />)
        )}
      </Section>
    </Screen>
  );
}

function SavedCard({ progress }: { progress: BadgeProgress }) {
  const { actions } = useStore();
  return (
    <Card>
      <T>You saved this badge for later. Start it whenever you&apos;re ready; there&apos;s no deadline.</T>
      <Row>
        <Button label="Start" icon="rocket-launch-outline" onPress={() => attempt(() => actions.setBadgeProgress(progress.badge_id, progress.level, 'in_progress'))} style={{ flex: 1 }} />
        <Button
          label="Unsave"
          kind="ghost"
          onPress={() => {
            actions.unsave(progress.id);
            router.back();
          }}
        />
      </Row>
    </Card>
  );
}

function EarnedCard({ db, progress }: { db: Db; progress: BadgeProgress }) {
  const awards = awardersOf(db, progress.id);
  const method = awards[0]?.method;
  return (
    <Card style={{ backgroundColor: Colors.primarySoft, borderColor: Colors.primarySoft }}>
      <Row>
        <Icon name="trophy-award" size={22} color={Colors.primary} />
        <T style={{ fontWeight: '700' }}>Earned {progress.awarded_at ? formatDate(progress.awarded_at) : ''}</T>
      </Row>
      {method && <T variant="small">{METHOD_LABEL[method]}</T>}
      <Row style={{ flexWrap: 'wrap' }}>
        {awards.map((a) => (
          <Row key={a.id} gap={6}>
            <Avatar name={userName(db, a.awarded_by_user_id)} size={24} />
            <T>{userName(db, a.awarded_by_user_id)}</T>
          </Row>
        ))}
      </Row>
    </Card>
  );
}

/** What another member sees: award alone as a master, or add one of two approvals. */
function AwardPanel({ db, progress }: { db: Db; progress: BadgeProgress }) {
  const { actions } = useStore();
  const me = useMe();
  const ability = awardAbility(db, me.id, progress);
  const approvals = approvalsFor(db, progress.id);
  const owner = userName(db, progress.user_id);

  const award = () =>
    attempt(() => {
      const done = actions.award(progress.id);
      notify(done ? 'Badge awarded' : 'Approval recorded', done ? `Hand ${owner} the patch at the sett.` : 'One more member needs to approve.');
    });

  return (
    <Card>
      <T style={{ fontWeight: '700' }}>Award</T>
      {approvals.length > 0 && (
        <T variant="small">
          Approved so far by {approvals.map((a) => userName(db, a.awarded_by_user_id)).join(', ')} ({approvals.length} of 2)
        </T>
      )}
      {ability.kind === 'award' && (
        <>
          <T variant="small">You&apos;re a master of this badge. Review the checklist and journal, then award it.</T>
          <Button label={`Award to ${owner}`} kind="accent" icon="trophy-award" onPress={award} />
        </>
      )}
      {ability.kind === 'approve' && (
        <>
          <T variant="small">No one holds the master level yet, so two members approve it together.</T>
          <Button label={`Approve (${ability.approvals + 1} of 2)`} kind="accent" icon="check-circle" onPress={award} />
        </>
      )}
      {ability.kind === 'none' && <T variant="small">{ability.reason}</T>}
    </Card>
  );
}

function GroupView({ db, progress, group, mine }: { db: Db; progress: BadgeProgress; group: ChecklistGroup; mine: boolean }) {
  const doneCount = group.items.filter((i) => i.done).length;
  return (
    <View style={{ gap: Spacing.sm }}>
      {group.items.length > 1 && (
        <T variant="small" style={{ fontWeight: '700', color: group.done ? Colors.primary : Colors.accent }}>
          Choose {group.required} of {group.items.length} · {Math.min(doneCount, group.required)} done
        </T>
      )}
      {group.items.map(({ req, done }) => (
        <RequirementRow key={req.id} db={db} progress={progress} req={req} done={done} mine={mine} />
      ))}
    </View>
  );
}

function RequirementRow({ db, progress, req, done, mine }: { db: Db; progress: BadgeProgress; req: Requirement; done: boolean; mine: boolean }) {
  const [picking, setPicking] = useState(false);
  const { actions } = useStore();
  const me = useMe();
  const checkoff = checkoffFor(db, progress.id, req.id);
  const request = pendingRequestFor(db, progress.id, req.id);
  const entries = entriesFor(db, progress.id, req.id);
  const active = progress.status === 'in_progress' || progress.status === 'ready';
  const clanmates = db.clan_members.map((m) => byId(db.users, m.user_id)).filter((u) => u && u.id !== me.id);

  return (
    <View style={{ gap: 6, paddingVertical: 4 }}>
      <Row style={{ alignItems: 'flex-start' }}>
        <Icon name={done ? 'check-circle' : 'circle-outline'} size={22} color={done ? Colors.primary : Colors.textMuted} />
        <View style={{ flex: 1, gap: 4 }}>
          <T>{req.text}</T>
          {req.part === 'info' && checkoff && (
            <T variant="small">
              Checked off by {userName(db, checkoff.checked_by_user_id)}, {formatDate(checkoff.created_at)}
            </T>
          )}
          {req.part === 'info' && !checkoff && request && (
            <Row style={{ flexWrap: 'wrap' }}>
              <T variant="small">Waiting on {userName(db, request.requested_of_user_id)} to confirm.</T>
              {mine && <Button small kind="ghost" label="Cancel" onPress={() => actions.cancelCheckoffRequest(request.id)} />}
              {request.requested_of_user_id === me.id && <Button small label="Confirm" onPress={() => attempt(() => actions.confirmCheckoff(request.id))} />}
            </Row>
          )}
          {req.part === 'action' && entries.length > 0 && (
            <T variant="small">
              {entries.length} journal {entries.length === 1 ? 'entry' : 'entries'}
            </T>
          )}
        </View>
      </Row>

      {mine && active && req.part === 'info' && !checkoff && !request && !picking && (
        <Button small kind="secondary" label="Request check-off" icon="account-check" onPress={() => setPicking(true)} style={{ alignSelf: 'flex-start', marginLeft: 30 }} />
      )}
      {mine && active && req.part === 'action' && (
        <Button
          small
          kind="ghost"
          label={entries.length ? 'Add another entry' : 'Post a journal entry'}
          icon="notebook-edit-outline"
          onPress={() => router.push({ pathname: '/journal/new', params: { progressId: progress.id, requirementId: req.id } })}
          style={{ alignSelf: 'flex-start', marginLeft: 22 }}
        />
      )}
      {picking && (
        <View style={{ marginLeft: 30, gap: 6 }}>
          <T variant="small">Who did you teach?</T>
          <Row style={{ flexWrap: 'wrap' }}>
            {clanmates.map((u) => (
              <Pressable
                key={u!.id}
                onPress={() =>
                  attempt(() => {
                    actions.requestCheckoff(progress.id, req.id, u!.id);
                    setPicking(false);
                  })
                }
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 6, borderRadius: 8, backgroundColor: pressed ? Colors.surfaceMuted : 'transparent' })}>
                <Avatar name={u!.name} size={24} />
                <T>{u!.name}</T>
              </Pressable>
            ))}
            <Button small kind="ghost" label="Cancel" onPress={() => setPicking(false)} />
          </Row>
        </View>
      )}
    </View>
  );
}

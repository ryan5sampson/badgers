import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { BadgeArt } from '@/components/badge-art';
import { PaperScene } from '@/components/paper-scene';
import { StatusPill } from '@/components/progress';
import { RequirementList } from '@/components/requirements';
import { Avatar, Button, Card, Chip, Empty, Pill, Row, Screen, Section, T, attempt, notify } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { useMe, useStore } from '@/data/store';
import { byId, canEditRequirements, holdersOf, isClanLead, requirementsFor, userName } from '@/data/rules';
import type { Level } from '@/data/types';

export default function BadgeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, actions } = useStore();
  const me = useMe();
  const [level, setLevel] = useState<Level>('beginner');
  const badge = byId(db.badges, id);

  if (!badge || badge.status === 'declined')
    return (
      <Screen>
        <Empty icon="magnify" title="This badge isn't in the catalog" body="It may have been merged with another badge." />
      </Screen>
    );

  const reqs = requirementsFor(db, badge.id, level);
  const holders = holdersOf(db, badge.id);
  const mine = db.badge_progress.find((p) => p.user_id === me.id && p.badge_id === badge.id && p.level === level);
  const openProgress = (progressId: string) => router.push({ pathname: '/progress/[id]', params: { id: progressId } });

  return (
    <Screen>
      <Stack.Screen options={{ title: badge.name }} />
      <PaperScene height={150} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <BadgeArt badge={badge} size={112} level={holders.find((h) => h.user.id === me.id)?.level} />
      </PaperScene>
      <View style={{ alignItems: 'center', gap: Spacing.sm }}>
        <T variant="title" style={{ textAlign: 'center' }}>
          {badge.name}
        </T>
        <T variant="muted" style={{ textAlign: 'center' }}>
          {badge.category} · {badge.effort_estimate}
        </T>
        {!!badge.description && <T style={{ textAlign: 'center' }}>{badge.description}</T>}
        <T variant="small">Created by {userName(db, badge.author_user_id)}</T>
        {badge.status === 'pending_review' && <Pill label="Pending review" />}
      </View>

      <Row style={{ justifyContent: 'center' }}>
        <Chip label="Beginner" selected={level === 'beginner'} onPress={() => setLevel('beginner')} />
        <Chip label="Master" selected={level === 'master'} onPress={() => setLevel('master')} />
      </Row>

      <Card>
        <RequirementList reqs={reqs} part="info" />
        <View style={{ height: Spacing.sm }} />
        <RequirementList reqs={reqs} part="action" />
      </Card>

      {!mine && level === 'beginner' && holders.some((h) => h.user.id === me.id && h.level === 'master') ? (
        <Card style={{ backgroundColor: Colors.accentSoft, borderColor: Colors.accentSoft }}>
          <T style={{ fontWeight: '700' }}>You&apos;re a master of this badge</T>
          <T>Teach it at a sett, and award the beginner level when someone&apos;s checklist is done.</T>
        </Card>
      ) : mine ? (
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <T style={{ fontWeight: '700' }}>Your {level} level</T>
            <StatusPill db={db} progress={mine} />
          </Row>
          <Row>
            {mine.status === 'saved' ? (
              <>
                <Button label="Start" icon="rocket-launch-outline" onPress={() => attempt(() => openProgress(actions.setBadgeProgress(badge.id, level, 'in_progress')))} style={{ flex: 1 }} />
                <Button label="Unsave" kind="ghost" onPress={() => actions.unsave(mine.id)} />
              </>
            ) : (
              <Button label={mine.status === 'awarded' ? 'See your badge' : 'Open checklist'} kind="secondary" onPress={() => openProgress(mine.id)} style={{ flex: 1 }} />
            )}
          </Row>
        </Card>
      ) : (
        <Row>
          <Button label="Start" icon="rocket-launch-outline" onPress={() => attempt(() => openProgress(actions.setBadgeProgress(badge.id, level, 'in_progress')))} style={{ flex: 1 }} />
          <Button label="Save" kind="secondary" icon="bookmark-outline" onPress={() => attempt(() => actions.setBadgeProgress(badge.id, level, 'saved'))} style={{ flex: 1 }} />
        </Row>
      )}

      <Section title="In your clan">
        {holders.length === 0 ? (
          <T variant="muted">No one holds this badge yet. Without a master, any two members can award the beginner level.</T>
        ) : (
          holders.map((h) => (
            <Card key={h.user.id} onPress={() => router.push({ pathname: '/member/[id]', params: { id: h.user.id } })}>
              <Row gap={Spacing.md}>
                <Avatar name={h.user.name} />
                <T style={{ flex: 1, fontWeight: '600' }}>{h.user.name}</T>
                <Pill label={h.level === 'master' ? 'Master' : 'Beginner'} tone={h.level === 'master' ? 'accent' : 'neutral'} />
              </Row>
            </Card>
          ))
        )}
      </Section>

      <Row style={{ flexWrap: 'wrap' }}>
        {canEditRequirements(db, me.id, badge) && (
          <Button label="Edit badge" kind="secondary" icon="pencil-outline" small onPress={() => router.push({ pathname: '/badge/edit', params: { id: badge.id } })} />
        )}
        {isClanLead(db, me.id) && (
          <Button
            label="Remove as duplicate"
            kind="ghost"
            small
            onPress={() =>
              attempt(() => {
                actions.removeBadge(badge.id);
                notify('Badge removed', `${badge.name} no longer shows in the catalog.`);
                router.back();
              })
            }
          />
        )}
      </Row>
    </Screen>
  );
}

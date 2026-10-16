import { Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { BannerGrid, ProgressCard } from '@/components/progress';
import { Avatar, Empty, Row, Screen, Section, T } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useStore } from '@/data/store';
import { bannerFor, byId, isClanLead, progressFor } from '@/data/rules';

/** Another member's banner and in-progress badges, where masters can award. */
export default function MemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db } = useStore();
  const user = byId(db.users, id);
  if (!user)
    return (
      <Screen>
        <Empty icon="account-question" title="Member not found" body="They may have left the clan." />
      </Screen>
    );

  const tiles = bannerFor(db, user.id);
  const inProgress = progressFor(db, user.id, ['in_progress', 'ready']);

  return (
    <Screen>
      <Stack.Screen options={{ title: user.name }} />
      <Row gap={Spacing.md}>
        <Avatar name={user.name} size={56} />
        <View>
          <T variant="heading">{user.name}</T>
          <T variant="muted">
            {isClanLead(db, user.id) ? 'Clan lead · ' : ''}
            {tiles.length} {tiles.length === 1 ? 'badge' : 'badges'} earned
          </T>
        </View>
      </Row>
      {tiles.length > 0 ? <BannerGrid db={db} tiles={tiles} /> : <T variant="muted">No badges on the banner yet.</T>}
      <Section title="Working on">
        {inProgress.length === 0 ? <T variant="muted">Nothing in progress right now.</T> : inProgress.map((p) => <ProgressCard key={p.id} db={db} progress={p} />)}
      </Section>
    </Screen>
  );
}

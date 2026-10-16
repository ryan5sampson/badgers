import { router } from 'expo-router';

import { Avatar, Button, Card, Icon, Pill, Row, Screen, Section, T } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { useMe, useStore } from '@/data/store';
import { bannerFor, byId } from '@/data/rules';

export default function ClanScreen() {
  const { db, actions } = useStore();
  const me = useMe();
  const clan = db.clans[0];
  const members = db.clan_members.map((m) => byId(db.users, m.user_id)).filter((u) => !!u);

  return (
    <Screen>
      <T variant="heading">{clan.name}</T>
      <Section title={`Members · ${members.length}`}>
        {members.map((u) => (
          <Card key={u.id} onPress={() => router.push({ pathname: '/member/[id]', params: { id: u.id } })}>
            <Row gap={Spacing.md}>
              <Avatar name={u.name} />
              <T style={{ flex: 1, fontWeight: '600' }}>
                {u.name}
                {u.id === me.id ? ' (you)' : ''}
              </T>
              {clan.lead_user_id === u.id && <Pill label="Clan lead" tone="accent" />}
              <T variant="small">{bannerFor(db, u.id).length} badges</T>
              <Icon name="chevron-right" size={20} color={Colors.textMuted} />
            </Row>
          </Card>
        ))}
      </Section>

      <Section title="Prototype tools">
        <T variant="small">Sign-in isn&apos;t built yet. Switch members to try check-offs and awards from both sides. Data resets when the app reloads.</T>
        <Row style={{ flexWrap: 'wrap' }}>
          {members
            .filter((u) => u.id !== me.id)
            .map((u) => (
              <Button
                key={u.id}
                small
                kind="secondary"
                label={`Be ${u.name}`}
                onPress={() => {
                  actions.signIn(u.id);
                  router.dismissTo('/');
                }}
              />
            ))}
        </Row>
        <Row>
          <Button small kind="ghost" icon="restore" label="Reset demo data" onPress={() => actions.resetDemo()} />
          <Button
            small
            kind="ghost"
            icon="logout"
            label="Sign out"
            onPress={() => {
              actions.signOut();
              router.replace('/welcome');
            }}
          />
        </Row>
      </Section>
    </Screen>
  );
}

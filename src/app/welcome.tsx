import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { PaperScene } from '@/components/paper-scene';
import { Avatar, Button, Card, Field, Icon, Row, Screen, Section, T, attempt } from '@/components/ui';
import { Colors, Paper, Spacing } from '@/constants/theme';
import { useStore } from '@/data/store';

/**
 * Stand-in for sign-in. Real sign-in (Supabase Auth) comes later; for now
 * you either join with the clan's invite code or pick an existing member.
 */
export default function Welcome() {
  const { db, actions } = useStore();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const clan = db.clans[0];
  const members = db.clan_members.map((m) => db.users.find((u) => u.id === m.user_id)!).filter(Boolean);

  const enter = () => router.replace('/');

  return (
    <Screen contentContainerStyle={{ paddingTop: 48 }}>
      <PaperScene height={200} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: Colors.cloud, alignItems: 'center', justifyContent: 'center', boxShadow: Paper.raised, marginBottom: 40 }}>
          <Icon name="paw" size={40} color={Colors.seaDeep} />
        </View>
      </PaperScene>
      <View style={{ alignItems: 'center', gap: Spacing.sm }}>
        <T variant="title">Badgers</T>
        <T variant="muted" style={{ textAlign: 'center' }}>
          Learn new skills with friends, one badge at a time.
        </T>
      </View>

      <Card>
        <T variant="subheading">Join your clan</T>
        <Field label="Invite code" value={code} onChangeText={setCode} placeholder="SETT-0000" autoCapitalize="characters" />
        <Field label="Your name" value={name} onChangeText={setName} placeholder="What should your clan call you?" />
        <Button
          label="Join clan"
          onPress={() => attempt(() => {
            actions.joinClan(code, name);
            enter();
          })}
        />
        <T variant="small">Prototype tip: the invite code is {clan.invite_code}.</T>
      </Card>

      <Section title="Or continue as a pilot member">
        <T variant="small">Sign-in isn&apos;t built yet. Pick a member to see the app as them.</T>
        {members.map((u) => (
          <Card
            key={u.id}
            onPress={() => {
              actions.signIn(u.id);
              enter();
            }}>
            <Row gap={Spacing.md}>
              <Avatar name={u.name} />
              <T style={{ flex: 1, fontWeight: '600' }}>{u.name}</T>
              {clan.lead_user_id === u.id && <T variant="small">Clan lead</T>}
              <Icon name="chevron-right" size={20} color={Colors.textMuted} />
            </Row>
          </Card>
        ))}
      </Section>
    </Screen>
  );
}

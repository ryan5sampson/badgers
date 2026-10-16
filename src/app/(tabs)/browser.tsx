import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { BadgeArt } from '@/components/badge-art';
import { StatusPill } from '@/components/progress';
import { Avatar, Button, Card, Chip, Empty, Field, Icon, Pill, Row, Screen, Section, T, timeAgo } from '@/components/ui';
import { CategoryStyle, Colors, Spacing } from '@/constants/theme';
import { useMe, useStore } from '@/data/store';
import { holdersOf, userName } from '@/data/rules';
import { CATEGORIES, type Category } from '@/data/types';

export default function BrowserScreen() {
  const { db } = useStore();
  const me = useMe();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | null>(null);

  const q = query.trim().toLowerCase();
  const badges = db.badges
    .filter((b) => b.status === 'published' || (b.author_user_id === me.id && b.status !== 'declined'))
    .filter((b) => !category || b.category === category)
    .filter((b) => !q || b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));
  const ideas = db.badge_ideas.filter((i) => i.status === 'open');

  return (
    <Screen>
      <Field label="Search" value={query} onChangeText={setQuery} placeholder="Bread, knots, pottery…" accessibilityLabel="Search badges" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
        <Chip label="All" selected={!category} onPress={() => setCategory(null)} />
        {CATEGORIES.map((c) => (
          <Chip key={c} label={c} icon={CategoryStyle[c].icon} selected={category === c} onPress={() => setCategory(category === c ? null : c)} />
        ))}
      </ScrollView>

      <Row>
        <Button label="New badge" icon="plus" onPress={() => router.push('/badge/edit')} style={{ flex: 1 }} />
        <Button label="Suggest an idea" kind="secondary" icon="lightbulb-on" onPress={() => router.push('/idea/new')} style={{ flex: 1 }} />
      </Row>

      <Section title={category ? `${category} badges` : 'All badges'}>
        {badges.length === 0 ? (
          <Empty icon="magnify" title="No badges match yet" body="Try another search, or add the badge yourself. You'll become its first master.">
            <Button label="Suggest it as an idea" kind="secondary" onPress={() => router.push({ pathname: '/idea/new', params: { name: query } })} />
          </Empty>
        ) : (
          badges.map((b) => {
            const rows = db.badge_progress.filter((p) => p.user_id === me.id && p.badge_id === b.id);
            const mine = rows.find((p) => p.level === 'master') ?? rows[0];
            const holders = holdersOf(db, b.id);
            return (
              <Card key={b.id} onPress={() => router.push({ pathname: '/badge/[id]', params: { id: b.id } })}>
                <Row gap={Spacing.md}>
                  <BadgeArt badge={b} size={52} level={holders.find((h) => h.user.id === me.id)?.level} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <T style={{ fontWeight: '700' }}>{b.name}</T>
                    <T variant="small">
                      {b.category} · {b.effort_estimate}
                      {holders.length > 0 ? ` · ${holders.length} in your clan hold it` : ''}
                    </T>
                  </View>
                  {b.status === 'pending_review' ? <Pill label="Pending review" /> : mine && <StatusPill db={db} progress={mine} />}
                </Row>
              </Card>
            );
          })
        )}
      </Section>

      {ideas.length > 0 && (
        <Section title="Ideas waiting for a badge">
          <T variant="small">Know one of these well? Write it up as a badge and you become its first master.</T>
          {ideas.map((i) => (
            <Card key={i.id}>
              <Row gap={Spacing.md}>
                <Icon name="lightbulb-on" size={22} color={Colors.accent} />
                <View style={{ flex: 1, gap: 2 }}>
                  <T style={{ fontWeight: '700' }}>{i.name}</T>
                  {!!i.description && <T variant="small">{i.description}</T>}
                  <Row gap={6}>
                    <Avatar name={userName(db, i.submitted_by_user_id)} size={18} />
                    <T variant="small">
                      {userName(db, i.submitted_by_user_id)} · {timeAgo(i.created_at)}
                    </T>
                  </Row>
                </View>
                <Button small kind="secondary" label="Build it" onPress={() => router.push({ pathname: '/badge/edit', params: { ideaId: i.id } })} />
              </Row>
            </Card>
          ))}
        </Section>
      )}
    </Screen>
  );
}

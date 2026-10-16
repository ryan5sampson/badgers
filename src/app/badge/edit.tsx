import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { BadgeArt } from '@/components/badge-art';
import { PART_HINT, PART_LABEL } from '@/components/requirements';
import { Button, Card, Chip, Field, Icon, Row, Screen, Section, T, attempt, notify } from '@/components/ui';
import { CategoryStyle, Colors, Spacing } from '@/constants/theme';
import { useStore, type BadgeDraft, type DraftRequirement } from '@/data/store';
import { byId, requirementsFor, similarBadges } from '@/data/rules';
import { CATEGORIES, type Level, type Part } from '@/data/types';

const EFFORTS = ['A weekend', 'A few weekends', 'A month', 'A season'];

type EditableReq = DraftRequirement & { key: string };
let keySeq = 0;
const blank = (level: Level, part: Part): EditableReq => ({ key: `k${keySeq++}`, level, part, text: '', choice_group: null, choice_required: null });

/** The new-badge editor. With an `id` param it edits an existing badge instead. */
export default function BadgeEditor() {
  const { id, ideaId } = useLocalSearchParams<{ id?: string; ideaId?: string }>();
  const { db, actions } = useStore();
  const existing = byId(db.badges, id);
  const idea = byId(db.badge_ideas, ideaId);

  const [name, setName] = useState(existing?.name ?? idea?.name ?? '');
  const [category, setCategory] = useState(existing?.category ?? CATEGORIES[0]);
  const [effort, setEffort] = useState(existing?.effort_estimate ?? 'A month');
  const [description, setDescription] = useState(existing?.description ?? idea?.description ?? '');
  const [reqs, setReqs] = useState<EditableReq[]>(() => {
    if (!existing) return (['beginner', 'master'] as const).flatMap((l) => [blank(l, 'info'), blank(l, 'action')]);
    return (['beginner', 'master'] as const).flatMap((l) =>
      requirementsFor(db, existing.id, l).map((r) => ({ key: `k${keySeq++}`, level: r.level, part: r.part, text: r.text, choice_group: r.choice_group, choice_required: r.choice_required })),
    );
  });

  const duplicates = similarBadges(db, name, existing?.id);
  const update = (key: string, patch: Partial<EditableReq>) => setReqs((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const save = () =>
    attempt(() => {
      const draft: BadgeDraft = { name, category, effort_estimate: effort, description, requirements: reqs };
      if (existing) {
        actions.updateBadge(existing.id, draft);
        router.back();
      } else {
        const badgeId = actions.createBadge(draft, idea?.id);
        notify('Badge published', `${name.trim()} is in the catalog, and you're its first master.`);
        router.replace({ pathname: '/badge/[id]', params: { id: badgeId } });
      }
    });

  const preview = { id: 'preview', name: name || 'New badge', category, effort_estimate: effort, art_url: null, author_user_id: '', status: 'draft' as const, description, created_at: '' };

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? `Edit ${existing.name}` : 'New badge' }} />
      <Row gap={Spacing.lg}>
        <BadgeArt badge={preview} size={64} />
        <T variant="muted" style={{ flex: 1 }}>
          {existing ? 'Changes apply to everyone working on this badge.' : 'Write it so a friend could follow it. Describe outcomes, not exact methods. You become this badge’s first master.'}
        </T>
      </Row>

      <Field label="Name" value={name} onChangeText={setName} placeholder="Pottery, Bread, Knots…" />
      {duplicates.length > 0 && (
        <Card style={{ backgroundColor: Colors.accentSoft, borderColor: Colors.accentSoft }}>
          <T style={{ fontWeight: '700' }}>Is it one of these?</T>
          <T variant="small">Your clan may already have this badge. Open it to check before adding a second one.</T>
          {duplicates.map((b) => (
            <Pressable key={b.id} onPress={() => router.push({ pathname: '/badge/[id]', params: { id: b.id } })}>
              <Row>
                <Icon name="arrow-right" size={16} color={Colors.primary} />
                <T style={{ color: Colors.primary, fontWeight: '600' }}>
                  {b.name} ({b.category})
                </T>
              </Row>
            </Pressable>
          ))}
        </Card>
      )}

      <View style={{ gap: Spacing.xs }}>
        <T variant="label">Category</T>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
          {CATEGORIES.map((c) => (
            <Chip key={c} label={c} icon={CategoryStyle[c].icon} selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </ScrollView>
      </View>

      <View style={{ gap: Spacing.xs }}>
        <T variant="label">Effort</T>
        <Row style={{ flexWrap: 'wrap' }}>
          {EFFORTS.map((e) => (
            <Chip key={e} label={e} selected={effort === e} onPress={() => setEffort(e)} />
          ))}
        </Row>
      </View>

      <Field label="Short description" value={description} onChangeText={setDescription} placeholder="One line on what this badge is about" />

      {(['beginner', 'master'] as const).map((level) => (
        <Section key={level} title={level === 'beginner' ? 'Beginner level' : 'Master level'}>
          {(['info', 'action'] as const).map((part) => (
            <Card key={part}>
              <T variant="label">{PART_LABEL[part]}</T>
              <T variant="small">{PART_HINT[part]}</T>
              {reqs
                .filter((r) => r.level === level && r.part === part)
                .map((r) => (
                  <View key={r.key} style={{ gap: 6 }}>
                    <Row style={{ alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Field label="Requirement" value={r.text} onChangeText={(text) => update(r.key, { text })} multiline placeholder={part === 'info' ? 'What should they be able to explain?' : 'What should they make or do?'} />
                      </View>
                      <Pressable accessibilityLabel="Remove requirement" onPress={() => setReqs((rs) => rs.filter((x) => x.key !== r.key))} style={{ paddingTop: 28 }}>
                        <Icon name="close" size={20} color={Colors.textMuted} />
                      </Pressable>
                    </Row>
                    {part === 'action' && (
                      <Row>
                        <Chip
                          label={r.choice_group ? 'In a choice group' : 'Required'}
                          icon={r.choice_group ? 'format-list-checks' : 'check'}
                          selected={!!r.choice_group}
                          onPress={() => update(r.key, r.choice_group ? { choice_group: null, choice_required: null } : { choice_group: `${level}-choice`, choice_required: 1 })}
                        />
                      </Row>
                    )}
                  </View>
                ))}
              {part === 'action' && <ChoiceCount reqs={reqs.filter((r) => r.level === level && r.choice_group)} onChange={(n) => setReqs((rs) => rs.map((r) => (r.level === level && r.choice_group ? { ...r, choice_required: n } : r)))} />}
              <Button label="Add requirement" kind="ghost" icon="plus" small onPress={() => setReqs((rs) => [...rs, blank(level, part)])} style={{ alignSelf: 'flex-start' }} />
            </Card>
          ))}
        </Section>
      ))}

      <Button label={existing ? 'Save changes' : 'Publish'} icon={existing ? 'check' : 'rocket-launch-outline'} onPress={save} />
    </Screen>
  );
}

/** For a level's choice group, sets how many options count as done. */
function ChoiceCount({ reqs, onChange }: { reqs: EditableReq[]; onChange: (n: number) => void }) {
  if (reqs.length < 2) return reqs.length === 1 ? <T variant="small">Add another option to make this a choice.</T> : null;
  const required = Math.min(reqs[0].choice_required ?? 1, reqs.length);
  return (
    <Row style={{ flexWrap: 'wrap' }}>
      <T variant="small">Members choose</T>
      {Array.from({ length: reqs.length - 1 }, (_, i) => i + 1).map((n) => (
        <Chip key={n} label={String(n)} selected={required === n} onPress={() => onChange(n)} />
      ))}
      <T variant="small">of {reqs.length} options.</T>
    </Row>
  );
}

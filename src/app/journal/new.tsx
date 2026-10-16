import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, Chip, Field, Icon, Row, Screen, T, attempt } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useMe, useStore } from '@/data/store';
import { byId, progressFor, requirementsFor } from '@/data/rules';

/** New journal entry. Badge and requirement tags are optional. */
export default function NewJournalEntry() {
  const params = useLocalSearchParams<{ progressId?: string; requirementId?: string }>();
  const { db, actions } = useStore();
  const me = useMe();
  const [body, setBody] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [progressId, setProgressId] = useState<string | null>(params.progressId ?? null);
  const [requirementId, setRequirementId] = useState<string | null>(params.requirementId ?? null);

  const myProgress = progressFor(db, me.id, ['in_progress', 'ready', 'awarded']);
  const tagged = byId(db.badge_progress, progressId);
  const actionReqs = tagged ? requirementsFor(db, tagged.badge_id, tagged.level).filter((r) => r.part === 'action') : [];

  const pickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.7 });
    if (!result.canceled) setPhotos((p) => [...p, ...result.assets.map((a) => a.uri)]);
  };

  return (
    <Screen>
      <View style={{ gap: Spacing.xs }}>
        <T variant="label">Photos</T>
        <Row style={{ flexWrap: 'wrap' }}>
          {photos.map((uri) => (
            <Pressable key={uri} accessibilityLabel="Remove photo" onPress={() => setPhotos((p) => p.filter((x) => x !== uri))}>
              <Image source={{ uri }} style={{ width: 84, height: 84, borderRadius: Radius.sm }} contentFit="cover" />
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add photos"
            onPress={pickPhotos}
            style={{ width: 84, height: 84, borderRadius: Radius.sm, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.sand, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface }}>
            <Icon name="image-plus" size={26} color={Colors.textMuted} />
          </Pressable>
        </Row>
      </View>

      <Field label="What did you make or learn?" value={body} onChangeText={setBody} multiline placeholder="What went well, what went sideways, what you'd try next." />

      <View style={{ gap: Spacing.xs }}>
        <T variant="label">Badge (optional)</T>
        <Row style={{ flexWrap: 'wrap' }}>
          <Chip label="No badge" selected={!progressId} onPress={() => { setProgressId(null); setRequirementId(null); }} />
          {myProgress.map((p) => (
            <Chip
              key={p.id}
              label={`${byId(db.badges, p.badge_id)?.name}${p.level === 'master' ? ' (master)' : ''}`}
              selected={progressId === p.id}
              onPress={() => { setProgressId(p.id); setRequirementId(null); }}
            />
          ))}
        </Row>
        <T variant="small">Untagged entries are welcome, including attempts that didn&apos;t work out.</T>
      </View>

      {actionReqs.length > 0 && (
        <View style={{ gap: Spacing.xs }}>
          <T variant="label">Counts toward (optional)</T>
          {actionReqs.map((r) => (
            <Pressable key={r.id} onPress={() => setRequirementId(requirementId === r.id ? null : r.id)}>
              <Row style={{ alignItems: 'flex-start', paddingVertical: 4 }}>
                <Icon name={requirementId === r.id ? 'radiobox-marked' : 'radiobox-blank'} size={20} color={requirementId === r.id ? Colors.primary : Colors.textMuted} />
                <T style={{ flex: 1 }}>{r.text}</T>
              </Row>
            </Pressable>
          ))}
        </View>
      )}

      <Button
        label="Post entry"
        icon="send"
        onPress={() =>
          attempt(() => {
            actions.addJournalEntry({ body, photo_urls: photos, progress_id: progressId, requirement_id: requirementId });
            router.back();
          })
        }
      />
    </Screen>
  );
}

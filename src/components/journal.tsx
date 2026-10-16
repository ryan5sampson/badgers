import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScrollView } from 'react-native';

import { Avatar, Card, Row, T, timeAgo } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { byId, userName } from '@/data/rules';
import type { Db, JournalEntry } from '@/data/types';

export function JournalCard({ db, entry, showBadge = true }: { db: Db; entry: JournalEntry; showBadge?: boolean }) {
  const progress = byId(db.badge_progress, entry.progress_id);
  const badge = progress && byId(db.badges, progress.badge_id);
  const req = byId(db.requirements, entry.requirement_id);
  return (
    <Card onPress={progress ? () => router.push({ pathname: '/progress/[id]', params: { id: progress.id } }) : undefined}>
      <Row>
        <Avatar name={userName(db, entry.user_id)} size={28} />
        <T style={{ flex: 1 }}>
          <T style={{ fontWeight: '700' }}>{userName(db, entry.user_id)}</T>
          {showBadge && badge ? (
            <T variant="muted"> · {badge.name}</T>
          ) : !badge ? (
            <T variant="muted"> · journal</T>
          ) : null}
        </T>
        <T variant="small">{timeAgo(entry.created_at)}</T>
      </Row>
      {entry.photo_urls.length > 0 && (
        <ScrollView horizontal contentContainerStyle={{ gap: Spacing.sm }}>
          {entry.photo_urls.map((uri) => (
            <Image key={uri} source={{ uri }} style={{ width: 160, height: 120, borderRadius: Radius.sm }} contentFit="cover" />
          ))}
        </ScrollView>
      )}
      {!!entry.body && <T>{entry.body}</T>}
      {req && (
        <T variant="small" style={{ color: Colors.primary }}>
          Counts toward: {req.text}
        </T>
      )}
    </Card>
  );
}

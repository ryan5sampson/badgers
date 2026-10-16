import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { BadgeArt } from '@/components/badge-art';
import { Card, Icon, Pill, ProgressBar, Row, T } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { byId, checklist, displayStatus } from '@/data/rules';
import type { BadgeProgress, Db, Id } from '@/data/types';

const levelLabel = (level: string) => (level === 'master' ? 'Master' : 'Beginner');

export function StatusPill({ db, progress }: { db: Db; progress: BadgeProgress }) {
  const status = displayStatus(db, progress);
  if (status === 'ready') return <Pill label="Ready for award" tone="accent" />;
  if (status === 'awarded') return <Pill label="Earned" tone="primary" />;
  if (status === 'saved') return <Pill label="Saved" />;
  return <Pill label="In progress" tone="primary" />;
}

/** An in-progress or saved badge with its checklist progress. */
export function ProgressCard({ db, progress, showOwner }: { db: Db; progress: BadgeProgress; showOwner?: boolean }) {
  const badge = byId(db.badges, progress.badge_id);
  if (!badge) return null;
  const list = checklist(db, progress);
  const owner = byId(db.users, progress.user_id);
  return (
    <Card onPress={() => router.push({ pathname: '/progress/[id]', params: { id: progress.id } })}>
      <Row gap={Spacing.md}>
        <BadgeArt badge={badge} size={48} dimmed={progress.status === 'saved'} />
        <View style={{ flex: 1, gap: 2 }}>
          <T style={{ fontWeight: '700' }}>{badge.name}</T>
          <T variant="small">
            {showOwner && owner ? `${owner.name} · ` : ''}
            {levelLabel(progress.level)}
            {progress.status !== 'saved' ? ` · ${list.complete} of ${list.total} done` : ` · ${badge.effort_estimate}`}
          </T>
        </View>
        <StatusPill db={db} progress={progress} />
      </Row>
      {progress.status !== 'saved' && <ProgressBar value={list.complete} total={list.total} />}
    </Card>
  );
}

/**
 * The digital copy of a member's physical banner. In arrange mode, arrows
 * move a badge one slot so the layout can match the real banner.
 */
export function BannerGrid({
  db,
  tiles,
  arranging,
  onMove,
}: {
  db: Db;
  tiles: BadgeProgress[];
  arranging?: boolean;
  onMove?: (id: Id, dir: -1 | 1) => void;
}) {
  return (
    <View style={styles.banner}>
      <View style={styles.rod} />
      <View style={styles.grid}>
        {tiles.map((p, i) => {
          const badge = byId(db.badges, p.badge_id);
          if (!badge) return null;
          return (
            <View key={p.id} style={styles.tile}>
              <Pressable
                disabled={arranging}
                onPress={() => router.push({ pathname: '/progress/[id]', params: { id: p.id } })}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, alignItems: 'center', gap: 6 })}>
                <BadgeArt badge={badge} level={p.level} size={68} />
                <T numberOfLines={2} style={styles.tileLabel}>
                  {badge.name}
                </T>
              </Pressable>
              {arranging && (
                <Row gap={4}>
                  <ArrowButton icon="arrow-left" label={`Move ${badge.name} earlier`} disabled={i === 0} onPress={() => onMove?.(p.id, -1)} />
                  <ArrowButton icon="arrow-right" label={`Move ${badge.name} later`} disabled={i === tiles.length - 1} onPress={() => onMove?.(p.id, 1)} />
                </Row>
              )}
            </View>
          );
        })}
      </View>
      <View style={styles.notchRow}>
        <View style={styles.notchLeft} />
        <View style={styles.notchRight} />
      </View>
    </View>
  );
}

function ArrowButton({ icon, label, disabled, onPress }: { icon: 'arrow-left' | 'arrow-right'; label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[styles.arrow, disabled && { opacity: 0.3 }]}>
      <Icon name={icon} size={16} color={Colors.primaryText} />
    </Pressable>
  );
}

const BANNER = '#2F4A40';

const styles = StyleSheet.create({
  banner: { alignItems: 'stretch' },
  rod: { height: 10, borderRadius: 5, backgroundColor: '#8A6A43', marginHorizontal: -8 },
  grid: {
    backgroundColor: BANNER,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.sm,
    rowGap: Spacing.lg,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  tile: { width: 96, alignItems: 'center', gap: 6 },
  tileLabel: { color: '#F6F1E7', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  arrow: { width: 28, height: 24, borderRadius: Radius.sm, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  // The swallowtail cut at the bottom of the banner.
  notchRow: { flexDirection: 'row', height: 28 },
  notchLeft: { flex: 1, borderTopWidth: 28, borderTopColor: BANNER, borderRightWidth: 40, borderRightColor: 'transparent' },
  notchRight: { flex: 1, borderTopWidth: 28, borderTopColor: BANNER, borderLeftWidth: 40, borderLeftColor: 'transparent' },
});

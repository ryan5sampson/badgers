import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { BadgeArt } from '@/components/badge-art';
import { Card, Icon, Pill, ProgressBar, Row, T } from '@/components/ui';
import { Colors, Paper, Radius, Spacing, shade } from '@/constants/theme';
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
 * The digital copy of a member's physical banner, drawn as a cut-paper
 * pennant. In arrange mode, arrows move a badge one slot so the layout can
 * match the real banner.
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
  const [size, setSize] = useState({ w: 0, h: 0 });
  const { w, h } = size;
  const notch = 34;
  // Pennant body with a swallowtail cut at the bottom.
  const pennant = `M 0 0 H ${w} V ${h} L ${w / 2} ${h - notch} L 0 ${h} Z`;

  return (
    <View>
      <View style={styles.rod} />
      <View onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })} style={styles.banner}>
        {w > 0 && (
          <Svg width={w} height={h + 6} style={StyleSheet.absoluteFill}>
            <Path d={pennant} fill="rgba(80, 60, 30, 0.22)" transform="translate(0, 6)" />
            <Path d={pennant} fill={Colors.seaDeep} />
            <Path d={`M 10 0 H ${w - 10} V ${h - 14} L ${w / 2} ${h - notch - 12} L 10 ${h - 14} Z`} fill={shade(Colors.seaDeep, 0.08)} />
          </Svg>
        )}
        <View style={styles.grid}>
          {tiles.map((p, i) => {
            const badge = byId(db.badges, p.badge_id);
            if (!badge) return null;
            return (
              <View key={p.id} style={styles.tile}>
                <Pressable
                  disabled={arranging}
                  onPress={() => router.push({ pathname: '/progress/[id]', params: { id: p.id } })}
                  style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1, alignItems: 'center', gap: 6 })}>
                  <BadgeArt badge={badge} level={p.level} size={72} />
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
      <Icon name={icon} size={16} color={Colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rod: { height: 12, borderRadius: 6, backgroundColor: '#A87A4A', marginHorizontal: -10, boxShadow: Paper.low, zIndex: 1 },
  banner: { marginTop: -4, paddingBottom: 46 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
    rowGap: Spacing.lg,
  },
  tile: { width: 100, alignItems: 'center', gap: 6 },
  tileLabel: { color: Colors.cloud, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  arrow: { width: 30, height: 26, borderRadius: Radius.sm, backgroundColor: Colors.cloud, alignItems: 'center', justifyContent: 'center', boxShadow: Paper.low },
});

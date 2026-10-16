import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { G, Path, Polygon } from 'react-native-svg';

import { BadgeArt, HEX_RATIO, hexPoints } from '@/components/badge-art';
import { Card, Pill, ProgressBar, Row, T } from '@/components/ui';
import { Colors, Spacing, shade } from '@/constants/theme';
import { bannerSlots, byId, checklist, displayStatus } from '@/data/rules';
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

const COLS = 3;
const PAD = 16;
const GAP = 7;

/**
 * Honeycomb geometry for a pennant of a given width: three columns of
 * flat-topped hexagons, with the middle column dropped half a row so the
 * cells interlock. The bottom tapers to a point under the middle column.
 */
function layout(width: number, rows: number) {
  const hexW = (width - PAD * 2 - GAP * 2) / (1 + 0.75 * (COLS - 1));
  const hexH = hexW * HEX_RATIO;
  const step = hexH + GAP;
  const slot = (i: number) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    return { x: PAD + col * (0.75 * hexW + GAP), y: PAD + row * step + (col === 1 ? step / 2 : 0) };
  };
  const sideBottom = PAD + (rows - 1) * step + hexH;
  const midBottom = sideBottom + step / 2;
  const body = sideBottom + PAD;
  const half = width / 2;
  // Deep enough that the point clears the lowest middle cell's corners.
  const depth = Math.max(
    (midBottom + 10 - body) / ((half - hexW / 4) / half),
    (midBottom - hexH / 2 + 10 - body) / ((half - hexW / 2) / half),
    24,
  );
  return { hexW, hexH, slot, body, tip: body + depth, count: rows * COLS };
}

/** The most rows that fit in a height, but always enough for every badge. */
function rowsFor(width: number, height: number | undefined, minSlots: number) {
  const needed = Math.max(3, Math.ceil(minSlots / COLS));
  if (!height) return needed;
  let rows = 1;
  while (layout(width, rows + 1).tip + 8 <= height) rows++;
  return Math.max(rows, needed);
}

/**
 * The digital copy of a member's physical banner: a cut-paper pennant with
 * a honeycomb of badge slots. Badges show art only, no labels. In arrange
 * mode, tap a badge and then a slot to move it there.
 */
export function HoneycombBanner({
  db,
  userId,
  height,
  arranging,
  onPlace,
}: {
  db: Db;
  userId: Id;
  /** Fill this height with slots; otherwise show just enough rows. */
  height?: number;
  arranging?: boolean;
  onPlace?: (progressId: Id, slot: number) => void;
}) {
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<Id | null>(null);
  const slots = bannerSlots(db, userId);
  const maxSlot = Math.max(-1, ...slots.keys());
  const rows = width ? rowsFor(width, height, maxSlot + 1) : 0;
  const g = width ? layout(width, rows) : null;
  const pennant = g ? `M 0 0 H ${width} V ${g.body} L ${width / 2} ${g.tip} L 0 ${g.body} Z` : '';

  const tapSlot = (index: number) => {
    const tile = slots.get(index);
    if (!arranging) {
      if (tile) router.push({ pathname: '/progress/[id]', params: { id: tile.id } });
      return;
    }
    if (!selected) return setSelected(tile?.id ?? null);
    if (tile?.id !== selected) onPlace?.(selected, index);
    setSelected(null);
  };

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height: g ? g.tip + 8 : height ?? 320 }}>
      {g && (
        <>
          <Svg width={width} height={g.tip + 8} style={StyleSheet.absoluteFill}>
            <Path d={pennant} fill="rgba(80, 60, 30, 0.22)" transform="translate(0, 7)" />
            <Path d={pennant} fill={Colors.seaDeep} />
            {Array.from({ length: g.count }, (_, i) => {
              const { x, y } = g.slot(i);
              return (
                <G key={i}>
                  <Polygon points={hexPoints(x, y, g.hexW, g.hexH)} fill={shade(Colors.seaDeep, -0.22)} />
                  <Polygon points={hexPoints(x + 2, y + 3, g.hexW - 4, g.hexH - 4)} fill={shade(Colors.seaDeep, -0.12)} />
                </G>
              );
            })}
          </Svg>
          {Array.from({ length: g.count }, (_, i) => {
            const { x, y } = g.slot(i);
            const tile = slots.get(i);
            const badge = tile && byId(db.badges, tile.badge_id);
            const isSelected = !!tile && tile.id === selected;
            if (!badge && !arranging) return null;
            return (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={badge ? `${badge.name}, ${tile!.level}` : `Empty slot ${i + 1}`}
                onPress={() => tapSlot(i)}
                style={({ pressed }) => ({
                  position: 'absolute',
                  left: x,
                  top: y,
                  width: g.hexW,
                  height: g.hexH,
                  opacity: pressed ? 0.8 : 1,
                  transform: [{ scale: isSelected ? 1.08 : 1 }],
                })}>
                {badge && <BadgeArt badge={badge} level={tile!.level} size={g.hexW} dimmed={arranging && !!selected && !isSelected} />}
              </Pressable>
            );
          })}
        </>
      )}
    </View>
  );
}

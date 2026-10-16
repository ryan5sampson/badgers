import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, Path, Pattern, Image as SvgImage } from 'react-native-svg';

import { BadgeArt, HEX_RATIO, hexPath } from '@/components/badge-art';
import { Card, Pill, ProgressBar, Row, T } from '@/components/ui';
import { Colors, Spacing, shade } from '@/constants/theme';
import { bannerSlots, byId, checklist, displayStatus } from '@/data/rules';
import type { BadgeProgress, Db, Id } from '@/data/types';

const GRAIN = require('@/assets/images/paper-grain.png');

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
  // Slots count up from the bottom, so badges fill the banner from its
  // point upward: the middle cell of a row sits lowest, then its neighbors.
  const slot = (i: number) => {
    const fromBottom = Math.floor(i / COLS);
    const col = [1, 0, 2][i % COLS];
    const row = rows - 1 - fromBottom;
    return { x: PAD + col * (0.75 * hexW + GAP), y: PAD + row * step + (col === 1 ? step / 2 : 0) };
  };
  const sideBottom = PAD + (rows - 1) * step + hexH;
  const midBottom = sideBottom + step / 2;
  const body = sideBottom + PAD;
  const half = width / 2;
  // Deep enough that the point clears the lowest middle cell's corners.
  const depth = Math.max(
    (midBottom + 26 - body) / ((half - hexW / 4) / half),
    (midBottom - hexH / 2 + 26 - body) / ((half - hexW / 2) / half),
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
 * a honeycomb of badge slots, filled from the bottom up. Badges show art
 * only, no labels. In arrange mode, tap a badge and then a slot to move it
 * there.
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
  const pennantAt = (inset: number) =>
    g ? `M ${inset} ${inset} H ${width - inset} V ${g.body - inset} L ${width / 2} ${g.tip - inset * 1.8} L ${inset} ${g.body - inset} Z` : '';
  const pennant = pennantAt(0);
  // The slots are holes cut through the front sheets.
  const holes = g ? Array.from({ length: g.count }, (_, i) => g.slot(i)).map(({ x, y }) => hexPath(x, y, g.hexW, g.hexH)).join(' ') : '';
  const frame = `${pennant} ${holes}`;
  const panel = `${pennantAt(9)} ${holes}`;

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
            <Defs>
              <Pattern id="banner-grain" patternUnits="userSpaceOnUse" width={256} height={256}>
                <SvgImage href={GRAIN} width={256} height={256} />
              </Pattern>
            </Defs>
            {/* The whole banner's shadow on the page */}
            <Path d={pennant} fill="rgba(70, 48, 18, 0.14)" transform="translate(0, 9)" />
            <Path d={pennant} fill="rgba(70, 48, 18, 0.20)" transform="translate(0, 4)" />
            {/* Back sheet, seen through the holes */}
            <Path d={pennant} fill={shade(Colors.seaDeep, -0.32)} />
            {/* Frame sheet: casts a shadow into each hole, then sits on top */}
            <Path d={frame} fillRule="evenodd" fill="rgba(20, 14, 4, 0.22)" transform="translate(0, 7)" />
            <Path d={frame} fillRule="evenodd" fill="rgba(20, 14, 4, 0.30)" transform="translate(0, 3)" />
            <Path d={frame} fillRule="evenodd" fill={Colors.seaDeep} />
            {/* Panel sheet, inset from the frame and casting onto it */}
            <Path d={panel} fillRule="evenodd" fill="rgba(20, 14, 4, 0.28)" transform="translate(0, 3)" />
            <Path d={panel} fillRule="evenodd" fill={Colors.sea} />
            <Path d={frame} fillRule="evenodd" fill="url(#banner-grain)" opacity={0.6} />
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

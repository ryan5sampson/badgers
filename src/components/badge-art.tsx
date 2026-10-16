import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useId } from 'react';
import { View } from 'react-native';
import Svg, { ClipPath, Defs, G, Path, Polygon } from 'react-native-svg';

import { BadgeIcons, CategoryStyle, Colors, shade } from '@/constants/theme';
import type { Badge, Level } from '@/data/types';

/** Height-to-width ratio of a regular hexagon with a flat top and bottom. */
export const HEX_RATIO = Math.sqrt(3) / 2;

/** Points for a hexagon with a flat top and a flat bottom. */
export function hexPoints(x: number, y: number, w: number, h: number) {
  return [
    [x + w * 0.25, y],
    [x + w * 0.75, y],
    [x + w, y + h / 2],
    [x + w * 0.75, y + h],
    [x + w * 0.25, y + h],
    [x, y + h / 2],
  ]
    .map((p) => p.join(','))
    .join(' ');
}

/**
 * Placeholder badge art in a paper-cutout style: a hexagon patch in the
 * category color with layered hills cut into the bottom. Beginner badges
 * get a green rim and master badges a purple one; badges not yet earned
 * get a plain paper rim.
 */
export function BadgeArt({ badge, level, size = 56, dimmed }: { badge: Badge; level?: Level | null; size?: number; dimmed?: boolean }) {
  const clipId = `hex-${useId().replace(/:/g, '')}`;
  const { color, icon } = CategoryStyle[badge.category];
  const rim = level === 'master' ? Colors.masterRim : level === 'beginner' ? Colors.beginnerRim : Colors.cloud;

  const w = size;
  const lift = Math.max(2, size * 0.05);
  const h = size * HEX_RATIO + lift;
  const ring = Math.max(3, size * 0.09);
  const innerW = w - ring * 2;
  const innerH = h - lift - ring * 2;
  const ix = ring;
  const iy = ring;

  // Two layers of rolling hills, like stacked paper, across the bottom third.
  const hill = (top: number, phase: number) => {
    const y = iy + innerH * top;
    return `M ${ix} ${y} C ${ix + innerW * (0.3 + phase)} ${y - innerH * 0.16}, ${ix + innerW * (0.55 + phase)} ${y + innerH * 0.14}, ${ix + innerW} ${y - innerH * 0.04} L ${ix + innerW} ${iy + innerH} L ${ix} ${iy + innerH} Z`;
  };

  return (
    <View accessibilityLabel={`${badge.name}${level ? `, ${level}` : ''}`} style={{ width: w, height: h, opacity: dimmed ? 0.5 : 1 }}>
      <Svg width={w} height={h}>
        <Defs>
          <ClipPath id={clipId}>
            <Polygon points={hexPoints(ix, iy, innerW, innerH)} />
          </ClipPath>
        </Defs>
        {/* Paper shadow under the patch */}
        <Polygon points={hexPoints(0, lift, w, h - lift)} fill="rgba(120, 84, 34, 0.22)" />
        {/* Rim */}
        <Polygon points={hexPoints(0, 0, w, h - lift)} fill={rim} />
        {level && <Polygon points={hexPoints(ring * 0.45, ring * 0.45, w - ring * 0.9, h - lift - ring * 0.9)} fill={shade(rim, 0.18)} />}
        {/* Face with cut-paper hills */}
        <G clipPath={`url(#${clipId})`}>
          <Polygon points={hexPoints(ix, iy, innerW, innerH)} fill={color} />
          <Path d={hill(0.66, 0)} fill={shade(color, -0.12)} />
          <Path d={hill(0.8, 0.12)} fill={shade(color, -0.24)} />
        </G>
      </Svg>
      <View style={{ position: 'absolute', left: 0, right: 0, top: iy, height: innerH * 0.72, alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name={BadgeIcons[badge.name] ?? icon} size={size * 0.38} color={Colors.cloud} />
      </View>
    </View>
  );
}

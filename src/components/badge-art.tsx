import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useId } from 'react';
import { View } from 'react-native';
import Svg, { ClipPath, Defs, G, Path, Pattern, Polygon, Image as SvgImage } from 'react-native-svg';

import { BadgeIcons, CategoryStyle, Colors, LayerShadow, shade } from '@/constants/theme';
import type { Badge, Level } from '@/data/types';

const GRAIN = require('@/assets/images/paper-grain.png');

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

/** The same hexagon as an SVG path, for compound shapes with holes. */
export function hexPath(x: number, y: number, w: number, h: number) {
  return `M ${hexPoints(x, y, w, h).replace(/ /g, ' L ')} Z`;
}

/**
 * Placeholder badge art built like a cut-paper patch: a rim sheet, a face
 * sheet that casts a shadow onto the rim, rolling hills that each cast a
 * shadow onto the layer behind, and a cut-out icon. Beginner badges have a
 * green rim and master badges a purple one; badges not yet earned have a
 * plain paper rim.
 */
export function BadgeArt({ badge, level, size = 56, dimmed }: { badge: Badge; level?: Level | null; size?: number; dimmed?: boolean }) {
  const clipId = `hex-${useId().replace(/:/g, '')}`;
  const { color, icon } = CategoryStyle[badge.category];
  const rim = level === 'master' ? Colors.masterRim : level === 'beginner' ? Colors.beginnerRim : Colors.cloud;

  const w = size;
  const lift = Math.max(2, size * 0.05);
  const hexH = size * HEX_RATIO;
  const h = hexH + lift;
  const ring = Math.max(3, size * 0.1);
  const innerW = w - ring * 2;
  const innerH = hexH - ring * 2 * HEX_RATIO;
  const ix = ring;
  const iy = ring * HEX_RATIO;
  const step = Math.max(1, size * 0.025);

  const hill = (top: number, phase: number) => {
    const y = iy + innerH * top;
    return `M ${ix - 2} ${y} C ${ix + innerW * (0.3 + phase)} ${y - innerH * 0.16}, ${ix + innerW * (0.55 + phase)} ${y + innerH * 0.14}, ${ix + innerW + 2} ${y - innerH * 0.04} L ${ix + innerW + 2} ${iy + innerH + 2} L ${ix - 2} ${iy + innerH + 2} Z`;
  };
  const iconSize = size * 0.38;

  return (
    <View accessibilityLabel={`${badge.name}${level ? `, ${level}` : ''}`} style={{ width: w, height: h, opacity: dimmed ? 0.5 : 1 }}>
      <Svg width={w} height={h}>
        <Defs>
          <ClipPath id={clipId}>
            <Polygon points={hexPoints(ix, iy, innerW, innerH)} />
          </ClipPath>
          <Pattern id={`${clipId}-grain`} patternUnits="userSpaceOnUse" width={128} height={128}>
            <SvgImage href={GRAIN} width={128} height={128} />
          </Pattern>
        </Defs>
        {/* The patch's shadow on whatever it sits on, soft then crisp */}
        <Polygon points={hexPoints(-0.5, lift, w + 1, hexH)} fill="rgba(70, 48, 18, 0.16)" />
        <Polygon points={hexPoints(0, lift * 0.5, w, hexH)} fill="rgba(70, 48, 18, 0.22)" />
        {/* Rim sheet, with a lighter bevel sheet on top */}
        <Polygon points={hexPoints(0, 0, w, hexH)} fill={rim} />
        <Polygon points={hexPoints(ring * 0.35, ring * 0.35 * HEX_RATIO, w - ring * 0.7, hexH - ring * 0.7 * HEX_RATIO)} fill={shade(rim, level ? 0.16 : -0.04)} />
        {/* Face sheet casts a shadow onto the rim */}
        <Polygon points={hexPoints(ix, iy + step * 1.5, innerW, innerH)} fill={LayerShadow} />
        <G clipPath={`url(#${clipId})`}>
          <Polygon points={hexPoints(ix, iy, innerW, innerH)} fill={color} />
          {/* Sun-faded top of the face */}
          <Path d={hill(0.08, 0.1)} fill={shade(color, -0.04)} />
          {/* Each hill casts a shadow onto the one behind it */}
          <Path d={hill(0.62, 0)} fill={LayerShadow} transform={`translate(0, ${-step * 1.5})`} />
          <Path d={hill(0.62, 0)} fill={shade(color, -0.14)} />
          <Path d={hill(0.8, 0.12)} fill={LayerShadow} transform={`translate(0, ${-step * 1.5})`} />
          <Path d={hill(0.8, 0.12)} fill={shade(color, -0.28)} />
        </G>
        <Polygon points={hexPoints(0, 0, w, hexH)} fill={`url(#${clipId}-grain)`} opacity={0.8} />
      </Svg>
      {/* Cut-paper icon with its own shadow */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: iy, height: innerH * 0.72, alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name={BadgeIcons[badge.name] ?? icon} size={iconSize} color="rgba(50, 34, 12, 0.35)" style={{ position: 'absolute', transform: [{ translateY: step * 1.4 }] }} />
        <MaterialCommunityIcons name={BadgeIcons[badge.name] ?? icon} size={iconSize} color={Colors.cloud} />
      </View>
    </View>
  );
}

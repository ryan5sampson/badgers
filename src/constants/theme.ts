import type { ComponentProps } from 'react';
import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import type { Category } from '@/data/types';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/**
 * Paper-cutout palette: warm sand paper, sky, sea, and palm tones. Colors
 * are bright but slightly muted, like colored card stock.
 */
export const Colors = {
  background: '#F4E3C3',
  surface: '#FFFAF0',
  surfaceMuted: '#F1E6D0',
  border: '#E6D3AE',
  text: '#2C3A40',
  textMuted: '#6A7479',
  primary: '#22707E',
  primaryText: '#FFFAF0',
  primarySoft: '#D3EAEA',
  accent: '#E07258',
  accentSoft: '#FADDD2',
  sky: '#9ED0EA',
  skyDeep: '#6FB4DA',
  sea: '#3E97A8',
  seaDeep: '#22707E',
  sand: '#EBC888',
  sun: '#F6CB63',
  palm: '#5E9E5B',
  cloud: '#FFFDF7',
  beginnerRim: '#5E9E5B',
  masterRim: '#7A5BA6',
  danger: '#B5493A',
} as const;

/**
 * Paper shadows: a crisp offset edge plus a soft drop, so surfaces read as
 * layers of cut card stock.
 */
export const Paper = {
  raised: '0px 1px 1px rgba(90, 62, 24, 0.18), 0px 4px 0px rgba(90, 62, 24, 0.10), 0px 12px 20px -6px rgba(90, 62, 24, 0.38)',
  low: '0px 1px 1px rgba(90, 62, 24, 0.18), 0px 3px 0px rgba(90, 62, 24, 0.08), 0px 6px 10px -4px rgba(90, 62, 24, 0.30)',
  pressed: '0px 1px 1px rgba(90, 62, 24, 0.20)',
  inset: 'inset 0px 3px 5px rgba(90, 62, 24, 0.28)',
} as const;

/** Fill for the shadow a paper layer casts on the layer beneath it. */
export const LayerShadow = 'rgba(70, 48, 18, 0.30)';

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const Radius = { sm: 10, md: 18, lg: 26, pill: 999 } as const;
export const MaxContentWidth = 720;

export const CategoryStyle: Record<Category, { color: string; icon: IconName }> = {
  Make: { color: '#4F86B5', icon: 'hammer-wrench' },
  Move: { color: '#E07258', icon: 'bike' },
  Outdoors: { color: '#5E9E5B', icon: 'pine-tree' },
  Kitchen: { color: '#E5A23E', icon: 'chef-hat' },
  Arts: { color: '#D9688A', icon: 'palette' },
  Mind: { color: '#3E97A8', icon: 'lightbulb-on' },
  'Life Skills': { color: '#B98552', icon: 'home-heart' },
};

/** Stand-in badge art until real art exists; falls back to the category icon. */
export const BadgeIcons: Record<string, IconName> = {
  '3D Printing': 'printer-3d',
  'Bike Maintenance': 'bike',
  'Game Design': 'dice-multiple',
  Pottery: 'pot-mix',
  Bread: 'bread-slice',
  Knots: 'jump-rope',
  Sketching: 'draw',
};

/** Mixes a hex color toward black (amount < 0) or white (amount > 0). */
export function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const target = amount < 0 ? 0 : 255;
  const t = Math.abs(amount);
  const mix = (c: number) => Math.round(c + (target - c) * t);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

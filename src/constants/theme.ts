import type { ComponentProps } from 'react';
import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import type { Category } from '@/data/types';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export const Colors = {
  background: '#F6F1E7',
  surface: '#FFFFFF',
  surfaceMuted: '#EFE8DA',
  border: '#E2D9C8',
  text: '#2B2A28',
  textMuted: '#6E6A62',
  primary: '#2F5D50',
  primaryText: '#FFFFFF',
  primarySoft: '#DCE8E2',
  accent: '#B9831F',
  accentSoft: '#F6E7C6',
  beginnerBorder: '#A7B0B8',
  masterBorder: '#C9962B',
  danger: '#A4442E',
} as const;

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const Radius = { sm: 8, md: 12, lg: 20, pill: 999 } as const;
export const MaxContentWidth = 720;

export const CategoryStyle: Record<Category, { color: string; icon: IconName }> = {
  Make: { color: '#4C6A92', icon: 'hammer-wrench' },
  Move: { color: '#3F7D5A', icon: 'bike' },
  Outdoors: { color: '#5B7A2E', icon: 'pine-tree' },
  Kitchen: { color: '#B5653A', icon: 'chef-hat' },
  Arts: { color: '#8C4F7A', icon: 'palette' },
  Mind: { color: '#5B5296', icon: 'lightbulb-on' },
  'Life Skills': { color: '#2F7B85', icon: 'home-heart' },
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

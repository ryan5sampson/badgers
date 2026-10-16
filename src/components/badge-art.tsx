import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { View } from 'react-native';

import { BadgeIcons, CategoryStyle, Colors } from '@/constants/theme';
import type { Badge, Level } from '@/data/types';

/**
 * Placeholder badge art: a round patch in the category color. Beginner
 * badges get a silver border and master badges a gold one; badges not yet
 * earned get no border.
 */
export function BadgeArt({ badge, level, size = 56, dimmed }: { badge: Badge; level?: Level | null; size?: number; dimmed?: boolean }) {
  const { color, icon } = CategoryStyle[badge.category];
  const border = level === 'master' ? Colors.masterBorder : level === 'beginner' ? Colors.beginnerBorder : 'transparent';
  const ring = Math.max(3, Math.round(size / 14));
  return (
    <View
      accessibilityLabel={`${badge.name}${level ? `, ${level}` : ''}`}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: ring,
        borderColor: border,
        padding: level ? 2 : 0,
        opacity: dimmed ? 0.45 : 1,
      }}>
      <View
        style={{
          flex: 1,
          borderRadius: size,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <MaterialCommunityIcons name={BadgeIcons[badge.name] ?? icon} size={size * 0.46} color="#FFFFFF" />
      </View>
    </View>
  );
}

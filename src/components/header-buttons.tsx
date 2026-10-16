import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { Icon } from '@/components/ui';
import { Colors, Paper, type IconName } from '@/constants/theme';

/** A round paper button for the header. */
export function HeaderButton({ icon, label, onPress, tone = 'accent' }: { icon: IconName; label: string; onPress: () => void; tone?: 'accent' | 'paper' | 'primary' }) {
  const bg = tone === 'accent' ? Colors.accent : tone === 'primary' ? Colors.primary : Colors.surface;
  const fg = tone === 'paper' ? Colors.primary : Colors.primaryText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: pressed ? Paper.pressed : Paper.low,
        transform: [{ translateY: pressed ? 2 : 0 }],
      })}>
      <Icon name={icon} size={tone === 'accent' ? 22 : 20} color={fg} />
    </Pressable>
  );
}

/** The + button on every tab opens a new journal entry. */
export function NewEntryButton() {
  return <HeaderButton icon="plus" label="New journal entry" onPress={() => router.push('/journal/new')} />;
}

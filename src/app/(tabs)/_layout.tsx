import { Redirect, router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Pressable, type ColorValue } from 'react-native';

import { Icon } from '@/components/ui';
import { Colors, type IconName } from '@/constants/theme';
import { useStore } from '@/data/store';

function tabIcon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Icon name={name} color={color as string} size={size} />;
  };
}

/** The + button on every tab opens a new journal entry. */
function NewEntryButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="New journal entry"
      onPress={() => router.push('/journal/new')}
      style={({ pressed }) => ({
        marginRight: 16,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.75 : 1,
      })}>
      <Icon name="plus" size={22} color={Colors.primaryText} />
    </Pressable>
  );
}

export default function TabLayout() {
  const { meId } = useStore();
  if (!meId) return <Redirect href="/welcome" />;

  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: Colors.background },
        headerTitleStyle: { color: Colors.text, fontWeight: '800', fontSize: 20 },
        headerRight: () => <NewEntryButton />,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: { backgroundColor: Colors.surface, borderTopColor: Colors.border },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Banner', tabBarIcon: tabIcon('flag-variant') }} />
      <Tabs.Screen name="browser" options={{ title: 'Browser', tabBarIcon: tabIcon('compass') }} />
      <Tabs.Screen name="den" options={{ title: 'Den', tabBarLabel: 'Den', tabBarIcon: tabIcon('campfire') }} />
    </Tabs>
  );
}

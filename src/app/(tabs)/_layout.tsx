import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { View, type ColorValue } from 'react-native';

import { NewEntryButton } from '@/components/header-buttons';

import { Icon } from '@/components/ui';
import { Colors, type IconName } from '@/constants/theme';
import { useStore } from '@/data/store';

function tabIcon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Icon name={name} color={color as string} size={size} />;
  };
}

export default function TabLayout() {
  const { meId } = useStore();
  if (!meId) return <Redirect href="/welcome" />;

  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: Colors.background },
        headerTitleStyle: { color: Colors.text, fontWeight: '900', fontSize: 22 },
        headerRight: () => (
          <View style={{ marginRight: 16 }}>
            <NewEntryButton />
          </View>
        ),
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontWeight: '800' },
        tabBarStyle: { backgroundColor: Colors.surface, borderTopWidth: 0, boxShadow: '0px -2px 0px rgba(120, 84, 34, 0.08), 0px -6px 16px -6px rgba(120, 84, 34, 0.22)' },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Banner', tabBarIcon: tabIcon('flag-variant') }} />
      <Tabs.Screen name="browser" options={{ title: 'Browser', tabBarIcon: tabIcon('compass') }} />
      <Tabs.Screen name="den" options={{ title: 'Den', tabBarLabel: 'Den', tabBarIcon: tabIcon('campfire') }} />
    </Tabs>
  );
}

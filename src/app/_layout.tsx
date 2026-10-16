import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Colors } from '@/constants/theme';

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: Colors.background, card: Colors.background, primary: Colors.primary, text: Colors.text, border: Colors.border },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={theme}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShadowVisible: false, headerTintColor: Colors.primary, headerTitleStyle: { color: Colors.text, fontWeight: '800' }, headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="badge/[id]" options={{ title: '' }} />
        <Stack.Screen name="badge/edit" options={{ title: 'New badge', presentation: 'modal' }} />
        <Stack.Screen name="idea/new" options={{ title: 'Suggest a badge', presentation: 'modal' }} />
        <Stack.Screen name="journal/new" options={{ title: 'New journal entry', presentation: 'modal' }} />
        <Stack.Screen name="progress/[id]" options={{ title: '' }} />
        <Stack.Screen name="member/[id]" options={{ title: '' }} />
        <Stack.Screen name="clan" options={{ title: 'Clan' }} />
      </Stack>
    </ThemeProvider>
  );
}

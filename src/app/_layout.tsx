import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useSession } from '@/features/auth/use-session';
import { usePushNotifications } from '@/features/notifications/use-push-notifications';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { session, isLoading } = useSession();

  usePushNotifications(session?.user.id ?? null);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {!isLoading && (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={session !== null}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="room/[id]" />
          </Stack.Protected>
          <Stack.Protected guard={session === null}>
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="sign-up" />
          </Stack.Protected>
        </Stack>
      )}
    </ThemeProvider>
  );
}

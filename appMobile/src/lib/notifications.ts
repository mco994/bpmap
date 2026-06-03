import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Festival } from '@bpmap/shared';

const CHANNEL_ID = 'reminders';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationSetup(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Rappels festivals',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function scheduleFestivalReminder(festival: Festival): Promise<string | null> {
  if (!festival.startDate) return null;
  const start = new Date(festival.startDate).getTime();
  const now = Date.now();
  if (start <= now) return null;

  const sevenDaysBefore = start - SEVEN_DAYS_MS;
  const when = sevenDaysBefore > now ? sevenDaysBefore : now + 5000;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: festival.name,
      body: `Bientôt à ${festival.city} — pense à tes billets.`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(when),
      channelId: CHANNEL_ID,
    },
  });
}

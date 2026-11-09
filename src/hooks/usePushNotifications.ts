import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Linking } from 'react-native';
import { ApiService } from '../services/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  useEffect(() => {
    // 1. Реєструємо токен при запуску
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        ApiService.registerPushToken(token);
      }
    });

    // 2. Слухач кліків по пуш-сповіщеннях (SOS-перехоплення / відкриття посилань)
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { url?: string; shop?: string };
      
      // Якщо в даних пуша передано конкретне посилання — відкриваємо його
      if (data?.url) {
        Linking.openURL(data.url).catch((err) => {
          console.warn('Не вдалося відкрити посилання з пуша:', err);
        });
      } else {
        // Якщо посилання немає, але вказано магазин — відкриваємо стандартну адмінку за замовчуванням
        const shop = (data?.shop || '').toLowerCase();
        let fallbackUrl = 'https://my.prom.ua/cms/orders';

        if (shop.includes('rozetka')) {
          fallbackUrl = 'https://seller.rozetka.com.ua/';
        } else if (shop.includes('olx')) {
          fallbackUrl = 'https://www.olx.ua/myaccount/';
        }

        Linking.openURL(fallbackUrl).catch(() => {});
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);
}

async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Дозвіл на push-сповіщення не надано користувачем!');
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    console.warn('Push-сповіщення доступні лише на реальних фізичних пристроях.');
  }

  return token;
}
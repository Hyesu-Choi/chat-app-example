import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { savePushToken } from './api';
import { registerForPushNotificationsAsync } from './register';

// 앱이 켜져 있을 때 알림이 오면 배너로 표시
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications(userId: string | null) {
  const router = useRouter();
  const handledNotificationId = useRef<string | null>(null);

  // 로그인하면 이 기기의 푸시 토큰을 서버에 등록
  useEffect(() => {
    if (!userId) return;
    registerForPushNotificationsAsync().then((token) => {
      if (token) savePushToken(userId, token);
    });
  }, [userId]);

  // 알림을 탭하면 해당 방으로 이동 (앱이 꺼져 있다가 알림으로 켜진 경우 포함)
  const lastResponse = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!userId || !lastResponse) return;

    const notificationId = lastResponse.notification.request.identifier;
    if (handledNotificationId.current === notificationId) return;
    handledNotificationId.current = notificationId;

    const roomId = lastResponse.notification.request.content.data?.roomId;
    if (roomId) router.push(`/room/${roomId}`);
  }, [userId, lastResponse, router]);
}

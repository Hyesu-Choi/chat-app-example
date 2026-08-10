import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// 권한을 요청하고 이 기기의 Expo 푸시 토큰을 받아옵니다.
// 못 받는 환경(시뮬레이터, 권한 거부, EAS 프로젝트 미설정)이면 null을 반환합니다.
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // 시뮬레이터/에뮬레이터는 푸시 토큰을 받을 수 없음
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  // eas init을 하면 app.json의 extra.eas.projectId에 기록됨
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn('푸시 토큰을 받으려면 eas init으로 EAS 프로젝트를 연결하세요.');
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

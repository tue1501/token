import React, { useEffect, useState, createContext, useContext } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { registerRootComponent } from 'expo';

// Định nghĩa kiểu dữ liệu context
type NotificationContextType = {
  token: string | null;
  notifications: any[];
};

// Tạo context
export const NotificationContext = createContext<NotificationContextType>({
  token: null,
  notifications: [],
});

const App = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const register = async () => {
      if (!Device.isDevice) {
        console.log('⚠️ Cần thiết bị thật để lấy token');
        return;
      }

      // Yêu cầu quyền thông báo
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('🚫 Quyền bị từ chối');
        return;
      }

      try {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: 'fd9e6774-26b2-4e90-ba68-deeccd510bb2', // 🔧 THÊM NẾU CHẠY BARE WORKFLOW
        });
        console.log('📦 Token:', token);
        setExpoPushToken(token.data);
      } catch (err) {
        console.log('❌ Lỗi lấy token:', err);
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
        });
      }
    };

    register();

    // Lắng nghe thông báo đến
    const listener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📩 Nhận notification:', notification);
      setNotifications(prev => [...prev, notification]);
    });

    // Xoá listener khi unmount
    return () => listener.remove();
  }, []);

  return (
    <NotificationContext.Provider value={{ token: expoPushToken, notifications }}>
      <UI />
    </NotificationContext.Provider>
  );
};

const UI = () => {
  const { token, notifications } = useContext(NotificationContext);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📲 Expo Push Notification Viewer</Text>
      <Text style={styles.label}>Expo Push Token:</Text>
      <Text style={styles.token}>{token || '🔄 Đang lấy token...'}</Text>

      <Text style={styles.label}>Thông báo đã nhận:</Text>
      {notifications.length > 0 ? (
        notifications.map((n, i) => (
          <View key={i} style={styles.notificationBox}>
            <Text style={styles.text}>📨 {n.request?.content?.title || 'Không có tiêu đề'}</Text>
            <Text style={styles.text}>📋 {n.request?.content?.body || 'Không có nội dung'}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.text}>🚫 Không có thông báo nào</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 16, fontWeight: '600', marginTop: 15 },
  token: { fontSize: 14, color: '#333', marginTop: 5 },
  notificationBox: {
    backgroundColor: '#f1f8ff',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  text: { fontSize: 14, color: '#333' },
});

registerRootComponent(App);
export default App;

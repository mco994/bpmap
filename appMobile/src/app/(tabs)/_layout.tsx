import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'carte',
};

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="carte"
        options={{
          title: 'Carte',
          tabBarIcon: ({ color, size }) => <Ionicons name="map" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Événements',
          tabBarIcon: ({ color, size }) => <Ionicons name="list" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

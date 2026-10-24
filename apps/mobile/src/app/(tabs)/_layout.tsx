import { Tabs } from 'expo-router';
import {
  BookBookmarkIcon,
  ChefHatIcon,
  HeartIcon,
  BagIcon,
  UserCircleIcon,
} from '@solar-icons/react-native/bold';
import { tokens as t } from '@/constants/tokens';
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.color.link,
        tabBarInactiveTintColor: t.color.secondary,
        tabBarLabelStyle: { fontFamily: t.font.label },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => (
            <BookBookmarkIcon
              color={typeof color === 'string' ? color : t.color.secondary}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color, size }) => (
            <HeartIcon color={typeof color === 'string' ? color : t.color.secondary} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: 'Shopping',
          tabBarIcon: ({ color, size }) => (
            <BagIcon color={typeof color === 'string' ? color : t.color.secondary} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'Assistant',
          tabBarIcon: ({ color, size }) => (
            <ChefHatIcon
              color={typeof color === 'string' ? color : t.color.secondary}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <UserCircleIcon
              color={typeof color === 'string' ? color : t.color.secondary}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}

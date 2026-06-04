

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, FONT_WEIGHT } from '../constants/theme';

import DashboardScreen from '../screens/DashboardScreen';
import EventListScreen from '../screens/EventListScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
            Dashboard: { active: 'grid', inactive: 'grid-outline' },
            Events: { active: 'calendar', inactive: 'calendar-outline' },
            Calendar: { active: 'today', inactive: 'today-outline' },
            Profile: { active: 'person', inactive: 'person-outline' },
          };
          const iconSet = icons[route.name] || { active: 'ellipse', inactive: 'ellipse-outline' };
          return <Ionicons name={focused ? iconSet.active : iconSet.inactive} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.mutedLight,
        tabBarStyle: {
          backgroundColor: COLORS.primary,
          borderTopColor: COLORS.primary,
          borderTopWidth: 0,
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: FONT_SIZE.xs,
          fontWeight: FONT_WEIGHT.semibold,
        },
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: '700' },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Events" component={EventListScreen} options={{ title: 'Events' }} />
      <Tab.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Calendar' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

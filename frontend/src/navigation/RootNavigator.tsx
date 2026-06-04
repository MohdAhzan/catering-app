import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useStore';
import { COLORS } from '../constants/theme';

// Screens
import LoginScreen from '../screens/LoginScreen';
import MainTabs from './MainTabs';
import EventDetailScreen from '../screens/EventDetailScreen';
import CreateEventScreen from '../screens/CreateEventScreen';
import AddItemsScreen from '../screens/AddItemsScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
//import InvoicePreviewScreen from '../screens/InvoicePreviewScreen';
//import ActivityLogScreen from '../screens/ActivityLogScreen';
//import UserManagementScreen from '../screens/UserManagementScreen';
//import ReportsScreen from '../screens/ReportsScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: '700', fontSize: 16 },
        headerBackTitleVisible: false,
        contentStyle: { backgroundColor: COLORS.offWhite },
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="EventDetail"
            component={EventDetailScreen}
            options={{ title: 'Event Details' }}
          />
          <Stack.Screen
            name="CreateEvent"
            component={CreateEventScreen}
            options={({ route }: any) => ({
              title: route.params?.eventId ? 'Edit Event' : 'New Event',
            })}
          />
          <Stack.Screen
            name="AddItems"
            component={AddItemsScreen}
            options={({ route }: any) => ({
              title: route.params?.eventName ? `Items — ${route.params.eventName}` : 'Billing Items',
            })}
          />
          <Stack.Screen
            name="Expenses"
            component={ExpensesScreen}
            options={({ route }: any) => ({
              title: route.params?.eventName ? `Expenses — ${route.params.eventName}` : 'Expenses',
            })}
          />
        </>
      )}
    </Stack.Navigator>
  );
}



          //<Stack.Screen
          //  name="InvoicePreview"
          //  component={InvoicePreviewScreen}
          //  options={({ route }: any) => ({
          //    title: `Invoice #${route.params?.billNumber || ''}`,
          //  })}
          ///>
          //<Stack.Screen
          //  name="ActivityLogScreen"
          //  component={ActivityLogScreen}
          //  options={{ title: 'Activity Log' }}
          ///>
          //<Stack.Screen
          //  name="UserManagement"
          //  component={UserManagementScreen}
          //  options={{ title: 'User Management' }}
          ///>
          //<Stack.Screen
          //  name="Reports"
          //  component={ReportsScreen}
          //  options={{ title: 'Reports & P/L' }}
          ///>

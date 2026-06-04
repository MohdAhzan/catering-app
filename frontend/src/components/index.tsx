import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

export const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" />
  </View>
);

export const EmptyState = ({ title = 'No Data' }) => (
  <View style={{ padding: 24 }}>
    <Text>{title}</Text>
  </View>
);

export const Divider = () => (
  <View style={{ height: 1, backgroundColor: '#ddd', marginVertical: 8 }} />
);

export const SectionHeader = ({ title }) => (
  <Text style={{ fontSize: 18, fontWeight: '700', marginVertical: 8 }}>
    {title}
  </Text>
);

export const PrimaryButton = ({ title, onPress, disabled }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={{
      padding: 14,
      backgroundColor: '#0D1B2A',
      borderRadius: 10,
      alignItems: 'center',
      opacity: disabled ? 0.5 : 1,
    }}
  >
    <Text style={{ color: 'white', fontWeight: '700' }}>
      {title}
    </Text>
  </TouchableOpacity>
);

export const StatusBadge = ({ status }) => (
  <View style={{ padding: 6 }}>
    <Text>{status}</Text>
  </View>
);

export const StatCard = ({ title, value }) => (
  <View style={{ padding: 12 }}>
    <Text>{title}</Text>
    <Text>{value}</Text>
  </View>
);

export const ErrorBanner = ({ message }) => (
  <View style={{ padding: 12 }}>
    <Text>{message}</Text>
  </View>
);

export const ItemRow = ({ item }) => (
  <View style={{ padding: 8 }}>
    <Text>{item?.item_name}</Text>
  </View>
);

export const ExpenseRow = ({ item }) => (
  <View style={{ padding: 8 }}>
    <Text>{item?.description}</Text>
  </View>
);

export const TotalRow = ({ label, amount }) => (
  <View
    style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 8,
    }}
  >
    <Text>{label}</Text>
    <Text>{amount}</Text>
  </View>
);

export const InputField = (props) => null;

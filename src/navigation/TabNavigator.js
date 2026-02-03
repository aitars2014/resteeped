import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Search, Bookmark, Clock, User } from 'lucide-react-native';
import { colors, typography } from '../constants';
import { 
  DiscoveryScreen, 
  TeaDetailScreen, 
  TimerScreen, 
  CollectionScreen, 
  ProfileScreen 
} from '../screens';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Discovery Stack (includes Tea Detail)
const DiscoveryStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DiscoveryHome" component={DiscoveryScreen} />
    <Stack.Screen name="TeaDetail" component={TeaDetailScreen} />
  </Stack.Navigator>
);

// Collection Stack (includes Tea Detail)
const CollectionStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CollectionHome" component={CollectionScreen} />
    <Stack.Screen name="TeaDetail" component={TeaDetailScreen} />
  </Stack.Navigator>
);

// Timer Stack (can receive tea param)
const TimerStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="TimerHome" component={TimerScreen} />
  </Stack.Navigator>
);

// Profile Stack
const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileHome" component={ProfileScreen} />
  </Stack.Navigator>
);

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent.primary,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarStyle: {
          backgroundColor: colors.background.secondary,
          borderTopColor: colors.border.light,
          paddingTop: 8,
          height: 85,
        },
        tabBarLabelStyle: {
          ...typography.caption,
          marginTop: 4,
        },
        tabBarIcon: ({ color, size }) => {
          const iconSize = 24;
          switch (route.name) {
            case 'Discover':
              return <Search size={iconSize} color={color} />;
            case 'MyTeas':
              return <Bookmark size={iconSize} color={color} />;
            case 'Timer':
              return <Clock size={iconSize} color={color} />;
            case 'Profile':
              return <User size={iconSize} color={color} />;
            default:
              return null;
          }
        },
      })}
    >
      <Tab.Screen 
        name="Discover" 
        component={DiscoveryStack}
        options={{ tabBarLabel: 'Discover' }}
      />
      <Tab.Screen 
        name="MyTeas" 
        component={CollectionStack}
        options={{ tabBarLabel: 'My Teas' }}
      />
      <Tab.Screen 
        name="Timer" 
        component={TimerStack}
        options={{ tabBarLabel: 'Timer' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

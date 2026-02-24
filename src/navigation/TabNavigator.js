import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Search, Bookmark, Clock, User, Coffee } from 'lucide-react-native';
import { typography } from '../constants';
import { useTheme } from '../context';
import { 
  HomeScreen,
  DiscoveryScreen, 
  TeaDetailScreen, 
  TimerScreen, 
  CollectionScreen, 
  ProfileScreen,
  CompanyProfileScreen,
  BrewHistoryScreen,
  TeaShopsScreen,
  CompareTeasScreen,
  ActivityFeedScreen,
  TeawareScreen,
  AddTeaScreen,
  TeawareDetailScreen,
  UserProfileScreen,
  ContactScreen,
  PaywallScreen,
  SeasonalCollectionScreen,
  TeaFinderScreen,
} from '../screens';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Home Stack (main landing experience)
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="TeaDetail" component={TeaDetailScreen} />
    <Stack.Screen name="CompanyProfile" component={CompanyProfileScreen} />
    <Stack.Screen name="TeaShops" component={TeaShopsScreen} />
    <Stack.Screen name="ActivityFeed" component={ActivityFeedScreen} />
    <Stack.Screen name="UserProfile" component={UserProfileScreen} />
    <Stack.Screen name="CompareTeas" component={CompareTeasScreen} />
    <Stack.Screen name="TeawareDetail" component={TeawareDetailScreen} />
    <Stack.Screen name="SeasonalCollection" component={SeasonalCollectionScreen} />
    <Stack.Screen name="TeaFinder" component={TeaFinderScreen} />
    <Stack.Screen 
      name="Paywall" 
      component={PaywallScreen}
      options={{ presentation: 'modal' }}
    />
  </Stack.Navigator>
);

// Discovery Stack (search and browse)
const DiscoveryStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DiscoveryHome" component={DiscoveryScreen} />
    <Stack.Screen name="TeaFinder" component={TeaFinderScreen} />
    <Stack.Screen name="TeaDetail" component={TeaDetailScreen} />
    <Stack.Screen name="CompanyProfile" component={CompanyProfileScreen} />
    <Stack.Screen name="Teaware" component={TeawareScreen} />
    <Stack.Screen name="TeawareDetail" component={TeawareDetailScreen} />
    <Stack.Screen 
      name="Paywall" 
      component={PaywallScreen}
      options={{ presentation: 'modal' }}
    />
  </Stack.Navigator>
);

// Collection Stack (My Teas)
const CollectionStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CollectionHome" component={CollectionScreen} />
    <Stack.Screen name="TeaDetail" component={TeaDetailScreen} />
    <Stack.Screen name="CompanyProfile" component={CompanyProfileScreen} />
    <Stack.Screen 
      name="AddTea" 
      component={AddTeaScreen}
      options={{ 
        headerShown: true,
        headerTitle: 'Add Tea',
        headerBackTitle: 'Back',
      }}
    />
    <Stack.Screen 
      name="Paywall" 
      component={PaywallScreen}
      options={{ 
        presentation: 'modal',
      }}
    />
  </Stack.Navigator>
);

// Timer Stack
const TimerStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="TimerHome" component={TimerScreen} />
  </Stack.Navigator>
);

// Profile Stack
const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileHome" component={ProfileScreen} />
    <Stack.Screen name="BrewHistory" component={BrewHistoryScreen} />
    <Stack.Screen name="TeaDetail" component={TeaDetailScreen} />
    <Stack.Screen name="CompareTeas" component={CompareTeasScreen} />
    <Stack.Screen name="Teaware" component={TeawareScreen} />
    <Stack.Screen name="TeawareDetail" component={TeawareDetailScreen} />
    <Stack.Screen name="Contact" component={ContactScreen} />
    <Stack.Screen 
      name="Paywall" 
      component={PaywallScreen}
      options={{ presentation: 'modal' }}
    />
  </Stack.Navigator>
);

export const TabNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.tabBar.active,
        tabBarInactiveTintColor: theme.tabBar.inactive,
        tabBarStyle: {
          backgroundColor: theme.tabBar.background,
          borderTopColor: theme.tabBar.border,
          borderTopWidth: 1,
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
            case 'Home':
              return <Home size={iconSize} color={color} />;
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
        name="Home" 
        component={HomeStack}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="Discover" 
        component={DiscoveryStack}
        options={{ tabBarLabel: 'Discover' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Reset Discovery stack to root when tab is pressed
            // This ensures tapping Discover always shows teas, not teaware
            navigation.navigate('Discover', { screen: 'DiscoveryHome', params: {} });
          },
        })}
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

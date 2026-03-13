import React from 'react';
import {View, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import LocksScreen from '../screens/LocksScreen';
import PeopleScreen from '../screens/PeopleScreen';
import EventsScreen from '../screens/EventsScreen';
import IQsScreen from '../screens/IQsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

function IQsTabIcon({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) {
  return (
    <View>
      <Icon
        name={focused ? 'chart-bar' : 'chart-bar'}
        size={size}
        color={color}
      />
      {/* Red badge dot */}
      <View style={styles.badge} />
    </View>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#1565c0',
          tabBarInactiveTintColor: '#aaa',
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: '#e0e0e0',
            paddingBottom: 4,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
          },
        }}>
        <Tab.Screen
          name="Locks"
          component={LocksScreen}
          options={{
            tabBarIcon: ({color, size}) => (
              <Icon name="lock-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="People"
          component={PeopleScreen}
          options={{
            tabBarIcon: ({color, size}) => (
              <Icon name="account-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Events"
          component={EventsScreen}
          options={{
            tabBarIcon: ({color, size}) => (
              <Icon name="clock-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="IQs"
          component={IQsScreen}
          options={{
            tabBarIcon: ({color, size, focused}) => (
              <IQsTabIcon color={color} size={size} focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarIcon: ({color, size}) => (
              <Icon name="cog-outline" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f44336',
  },
});

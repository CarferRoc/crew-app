import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { theme } from '../theme';

import { CrewsScreen } from '../screens/CrewsScreen';
import { CrewDetailScreen } from '../screens/CrewDetailScreen';
import { CarWarScreen } from '../screens/CarWarScreen';
import { RewardsScreen } from '../screens/RewardsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const CrewsStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="CrewsList" component={CrewsScreen} />
        <Stack.Screen name="CrewDetail" component={CrewDetailScreen} />
    </Stack.Navigator>
);

export const AppNavigator = () => {
    return (
        <NavigationContainer theme={{
            dark: true,
            colors: {
                primary: theme.colors.primary,
                background: theme.colors.background,
                card: theme.colors.surface,
                text: theme.colors.text,
                border: theme.colors.border,
                notification: theme.colors.primary,
            }
        }}>
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: theme.colors.primary,
                    tabBarInactiveTintColor: theme.colors.textMuted,
                    tabBarStyle: {
                        backgroundColor: theme.colors.surface,
                        borderTopColor: theme.colors.border,
                        paddingBottom: 8,
                        height: 60,
                    },
                }}
            >
                <Tab.Screen
                    name="Crews"
                    component={CrewsStack}
                    options={{ tabBarLabel: 'Crews' }}
                />
                <Tab.Screen
                    name="Global"
                    component={CarWarScreen}
                    options={{ tabBarLabel: 'Guerra' }}
                />
                <Tab.Screen
                    name="Rewards"
                    component={RewardsScreen}
                    options={{ tabBarLabel: 'Premios' }}
                />
                <Tab.Screen
                    name="Profile"
                    component={ProfileScreen}
                    options={{ tabBarLabel: 'Perfil' }}
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
};

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { theme, darkTheme, lightTheme } from '../theme';

import { CrewsScreen } from '../screens/CrewsScreen';
import { CrewDetailScreen } from '../screens/CrewDetailScreen';
import { CarWarScreen } from '../screens/CarWarScreen';
import { RewardsScreen } from '../screens/RewardsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { JoinCrewScreen } from '../screens/JoinCrewScreen';
import { CreateCrewScreen } from '../screens/CreateCrewScreen';
import { InviteMemberScreen } from '../screens/InviteMemberScreen';
import { MyInvitesScreen } from '../screens/MyInvitesScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { AddCarScreen } from '../screens/AddCarScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { AdminPanelScreen } from '../screens/AdminPanelScreen';
import { DirectMessagesScreen } from '../screens/DirectMessagesScreen';
import { ChatViewScreen } from '../screens/ChatViewScreen';
import { useStore } from '../store/useStore';

import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const CrewsStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="CrewsList" component={CrewsScreen} />
        <Stack.Screen name="CrewDetail" component={CrewDetailScreen} />
        <Stack.Screen name="JoinCrew" component={JoinCrewScreen} />
        <Stack.Screen name="CreateCrew" component={CreateCrewScreen} />
        <Stack.Screen name="InviteMember" component={InviteMemberScreen} />
        <Stack.Screen name="MyInvites" component={MyInvitesScreen} />
    </Stack.Navigator>
);

const ProfileStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ProfileMain" component={ProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="AddCar" component={AddCarScreen} />
        <Stack.Screen name="MyInvites" component={MyInvitesScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="AdminPanel" component={AdminPanelScreen} />
    </Stack.Navigator>
);

const MessagesStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MessagesMain" component={DirectMessagesScreen} />
        <Stack.Screen name="ChatView" component={ChatViewScreen} />
    </Stack.Navigator>
);

const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
);

export const AppNavigator = () => {
    const { currentUser, isDarkMode } = useStore();
    const activeTheme = isDarkMode ? darkTheme : lightTheme;

    return (
        <NavigationContainer theme={{
            dark: isDarkMode,
            colors: {
                primary: activeTheme.colors.primary,
                background: activeTheme.colors.background,
                card: activeTheme.colors.surface,
                text: activeTheme.colors.text,
                border: activeTheme.colors.border,
                notification: activeTheme.colors.primary,
            }
        }}>
            {!currentUser ? (
                <AuthStack />
            ) : (
                <Tab.Navigator
                    screenOptions={({ route }) => ({
                        headerShown: false,
                        tabBarActiveTintColor: activeTheme.colors.primary,
                        tabBarInactiveTintColor: activeTheme.colors.textMuted,
                        tabBarStyle: {
                            backgroundColor: activeTheme.colors.surface,
                            borderTopColor: activeTheme.colors.border,
                            height: 65,
                            paddingBottom: 10,
                            paddingTop: 5,
                            borderTopWidth: 1,
                            elevation: 8,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: -2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                        },
                        tabBarIcon: ({ focused, color, size }) => {
                            let iconName: any;

                            if (route.name === 'CrewsTab') {
                                iconName = focused ? 'people' : 'people-outline';
                            } else if (route.name === 'Global') {
                                iconName = focused ? 'trophy' : 'trophy-outline';
                            } else if (route.name === 'Rewards') {
                                iconName = focused ? 'gift' : 'gift-outline';
                            } else if (route.name === 'MessagesTab') {
                                iconName = focused ? 'mail' : 'mail-outline';
                            } else if (route.name === 'ProfileTab') {
                                iconName = focused ? 'person' : 'person-outline';
                            }

                            return <Ionicons name={iconName} size={size} color={color} />;
                        },
                        tabBarLabelStyle: {
                            fontSize: 11,
                            fontWeight: '600',
                        }
                    })}
                >
                    <Tab.Screen
                        name="CrewsTab"
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
                    {/*
                    <Tab.Screen
                        name="MessagesTab"
                        component={MessagesStack}
                        options={{ tabBarLabel: 'Mensajes' }}
                    />
                    */}
                    <Tab.Screen
                        name="ProfileTab"
                        component={ProfileStack}
                        options={{ tabBarLabel: 'Perfil' }}
                    />
                </Tab.Navigator>
            )}
        </NavigationContainer>
    );
};

import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme, useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { useStore } from '../store/useStore';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const SectionHeader = ({ title, theme }: { title: string, theme: any }) => (
    <Text style={[styles.sectionHeader, { color: theme.colors.primary }]}>{title}</Text>
);

const SettingItem = ({
    icon,
    title,
    value,
    onPress,
    type = 'link',
    theme,
    subtitle
}: {
    icon: any,
    title: string,
    value?: boolean | string,
    onPress?: () => void,
    type?: 'link' | 'switch' | 'info',
    theme: any,
    subtitle?: string
}) => (
    <TouchableOpacity
        style={[styles.settingRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        onPress={type === 'switch' ? undefined : onPress}
        disabled={type === 'info'}
    >
        <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Ionicons name={icon} size={20} color={theme.colors.text} />
            </View>
            <View>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>{title}</Text>
                {subtitle && <Text style={[styles.settingSubtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>}
            </View>
        </View>

        {type === 'switch' && (
            <Switch
                value={value as boolean}
                onValueChange={onPress as any}
                trackColor={{ false: '#767577', true: theme.colors.primary }}
                thumbColor={value ? '#fff' : '#f4f3f4'}
            />
        )}

        {type === 'link' && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {typeof value === 'string' && <Text style={{ color: theme.colors.textMuted, marginRight: 8, fontSize: 12 }}>{value}</Text>}
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
            </View>
        )}

        {type === 'info' && (
            <Text style={{ color: theme.colors.textMuted, fontSize: 14 }}>{value as string}</Text>
        )}
    </TouchableOpacity>
);

export const SettingsScreen = ({ navigation }: any) => {
    const { t } = useTranslation();
    const { isDarkMode, setDarkMode, currentUser, setLanguage, language } = useStore();
    const activeTheme = useAppTheme();

    // Local state for notifications (would be connected to store/backend in real app)
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    // Legal Modals
    const [privacyVisible, setPrivacyVisible] = useState(false);
    const [termsVisible, setTermsVisible] = useState(false);

    const getLanguageLabel = (code: string) => {
        switch (code) {
            case 'es': return 'Español';
            case 'en': return 'English';
            case 'fr': return 'Français';
            case 'de': return 'Deutsch';
            case 'it': return 'Italiano';
            case 'pt': return 'Português';
            default: return code;
        }
    };

    const handleLanguageChange = () => {
        Alert.alert(
            t('settings.language'),
            t('settings.language'), // "Select language" if mapped, using title as placeholder
            [
                { text: "Español", onPress: () => setLanguage("es") },
                { text: "English", onPress: () => setLanguage("en") },
                { text: "Français", onPress: () => setLanguage("fr") },
                { text: "Deutsch", onPress: () => setLanguage("de") },
                { text: "Italiano", onPress: () => setLanguage("it") },
                { text: "Português", onPress: () => setLanguage("pt") },
                { text: t('common.cancel'), style: "cancel" }
            ]
        );
    };

    const handleSignOut = async () => {
        Alert.alert(
            t('settings.signOutConfirmTitle'),
            t('settings.signOutConfirmMessage'),
            [
                { text: t('common.cancel'), style: "cancel" },
                {
                    text: t('settings.signOut'),
                    style: "destructive",
                    onPress: async () => {
                        await supabase.auth.signOut();
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
            <Header title={t('settings.title')} showBack onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.content}>

                {/* General Section */}
                <SectionHeader title={t('settings.general')} theme={activeTheme} />
                <SettingItem
                    icon="moon-outline"
                    title={t('settings.darkMode')}
                    type="switch"
                    value={isDarkMode}
                    onPress={() => setDarkMode(!isDarkMode)}
                    theme={activeTheme}
                />
                <SettingItem
                    icon="language-outline"
                    title={t('settings.language')}
                    value={getLanguageLabel(language)}
                    onPress={handleLanguageChange}
                    theme={activeTheme}
                />

                {/* Account Section */}
                <SectionHeader title={t('settings.account')} theme={activeTheme} />
                <SettingItem
                    icon="person-outline"
                    title={t('settings.myProfile')}
                    subtitle={currentUser?.email}
                    type="link"
                    onPress={() => navigation.navigate('EditProfile')}
                    theme={activeTheme}
                />
                <SettingItem
                    icon="time-outline"
                    title={t('settings.myActivity')}
                    subtitle={t('settings.myActivity')} // Or a different subtitle
                    type="link"
                    onPress={() => navigation.navigate('EventHistory')}
                    theme={activeTheme}
                />
                <SettingItem
                    icon="calendar-number-outline"
                    title={t('settings.memberSince')}
                    type="info"
                    value={currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString() : 'N/A'}
                    theme={activeTheme}
                />

                {/* Notifications Section */}
                <SectionHeader title={t('settings.notifications')} theme={activeTheme} />
                <SettingItem
                    icon="notifications-outline"
                    title={t('settings.pushNotifications')}
                    type="switch"
                    value={notificationsEnabled}
                    onPress={() => setNotificationsEnabled(!notificationsEnabled)}
                    theme={activeTheme}
                />

                {/* Legal Section */}
                <SectionHeader title={t('settings.info')} theme={activeTheme} />
                <SettingItem
                    icon="shield-checkmark-outline"
                    title={t('settings.privacyPolicy')}
                    onPress={() => setPrivacyVisible(true)}
                    theme={activeTheme}
                />
                <SettingItem
                    icon="document-text-outline"
                    title={t('settings.termsOfService')}
                    onPress={() => setTermsVisible(true)}
                    theme={activeTheme}
                />
                <SettingItem
                    icon="information-circle-outline"
                    title={t('settings.appVersion')}
                    type="info"
                    value="1.0.0"
                    theme={activeTheme}
                />

                <TouchableOpacity
                    style={[styles.signOutButton, { borderColor: activeTheme.colors.error }]}
                    onPress={handleSignOut}
                >
                    <Text style={[styles.signOutText, { color: activeTheme.colors.error }]}>{t('settings.signOut')}</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Simple Modal for Privacy/Terms */}
            <Modal visible={privacyVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={[styles.modalContainer, { backgroundColor: activeTheme.colors.background }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: activeTheme.colors.text }]}>{t('settings.privacyPolicy')}</Text>
                        <TouchableOpacity onPress={() => setPrivacyVisible(false)}>
                            <Ionicons name="close" size={24} color={activeTheme.colors.text} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalContent}>
                        <Text style={[styles.modalText, { color: activeTheme.colors.text }]}>
                            {t('settings.privacyPolicy')}...
                        </Text>
                    </ScrollView>
                </View>
            </Modal>

            <Modal visible={termsVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={[styles.modalContainer, { backgroundColor: activeTheme.colors.background }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: activeTheme.colors.text }]}>{t('settings.termsOfService')}</Text>
                        <TouchableOpacity onPress={() => setTermsVisible(false)}>
                            <Ionicons name="close" size={24} color={activeTheme.colors.text} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalContent}>
                        <Text style={[styles.modalText, { color: activeTheme.colors.text }]}>
                            {t('settings.termsOfService')}...
                        </Text>
                    </ScrollView>
                </View>
            </Modal>

        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20 },
    sectionHeader: {
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 24,
        marginBottom: 8,
        marginLeft: 4,
        letterSpacing: 1,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    settingSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    signOutButton: {
        marginTop: 40,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    signOutText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalContent: {
        flex: 1,
    },
    modalText: {
        fontSize: 16,
        lineHeight: 24,
    }
});

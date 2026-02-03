import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { CrewCard } from '../components/CrewCard';
import { Button } from '../components/Button';
import { useStore } from '../store/useStore';
import { Ionicons } from '@expo/vector-icons';

export const CrewsScreen = ({ navigation }: any) => {
    const { t } = useTranslation();
    const { currentUser, crews, fetchCrews } = useStore();
    const theme = useAppTheme();
    const [refreshing, setRefreshing] = React.useState(false);

    const loadData = async () => {
        setRefreshing(true);
        await fetchCrews();
        setRefreshing(false);
    };

    React.useEffect(() => {
        loadData();
    }, []);

    if (!currentUser) return null;

    const myCrews = crews.filter(c => c.members.includes(currentUser.id) || c.createdBy === currentUser.id);
    const otherCrews = crews.filter(c => !c.members.includes(currentUser.id) && c.createdBy !== currentUser.id);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Header
                title={t('crews.title')}
                rightAction={
                    (currentUser.role === 'admin' || currentUser.role === 'lider') ? (
                        <TouchableOpacity onPress={() => navigation.navigate('CreateCrew')}>
                            <Ionicons name="add" size={28} color={theme.colors.primary} />
                        </TouchableOpacity>
                    ) : undefined
                }
            />

            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={theme.colors.primary} />}
            >
                {myCrews.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="star" size={16} color={theme.colors.primary} style={{ marginRight: 8 }} />
                            <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>{t('crews.myCrews')}</Text>
                        </View>
                        {myCrews.map(crew => (
                            <CrewCard
                                key={crew.id}
                                crew={crew}
                                onPress={() => navigation.navigate('CrewDetail', { crewId: crew.id })}
                            />
                        ))}
                    </View>
                )}

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="globe-outline" size={16} color={theme.colors.textMuted} style={{ marginRight: 8 }} />
                        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>{t('crews.explore')}</Text>
                    </View>

                    {otherCrews.length > 0 ? (
                        otherCrews.map(crew => (
                            <CrewCard
                                key={crew.id}
                                crew={crew}
                                onPress={() => navigation.navigate('CrewDetail', { crewId: crew.id })}
                            />
                        ))
                    ) : (
                        <View style={[styles.empty, { backgroundColor: theme.colors.surface }]}>
                            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>{t('crews.noCrewsAvailable')}</Text>
                        </View>
                    )}
                </View>

                <Button
                    title={t('crews.joinByCode')}
                    variant="outline"
                    icon={<Ionicons name="key-outline" size={18} color={theme.colors.text} />}
                    onPress={() => navigation.navigate('JoinCrew')}
                    style={styles.joinBtn}
                />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scroll: {
        padding: 16,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingLeft: 4,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    empty: {
        padding: 24,
        alignItems: 'center',
        borderRadius: 12,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#333',
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 14,
    },
    joinBtn: {
        marginTop: 12,
    },
});

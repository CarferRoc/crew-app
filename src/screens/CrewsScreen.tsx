import React from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView } from 'react-native';
import { theme, useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { CrewCard } from '../components/CrewCard';
import { Button } from '../components/Button';
import { useStore } from '../store/useStore';

export const CrewsScreen = ({ navigation }: any) => {
    const { currentUser, crews, fetchCrews } = useStore();
    const activeTheme = useAppTheme();

    React.useEffect(() => {
        fetchCrews();
    }, []);

    if (!currentUser) return null;

    const myCrews = crews.filter(c => c.members.includes(currentUser.id) || c.createdBy === currentUser.id);
    const otherCrews = crews.filter(c => !c.members.includes(currentUser.id) && c.createdBy !== currentUser.id);

    return (
        <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
            <Header title="Mis Crews" />
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: activeTheme.colors.textMuted }]}>Tus Crews</Text>
                    {myCrews.length > 0 ? (
                        myCrews.map(crew => (
                            <CrewCard
                                key={crew.id}
                                crew={crew}
                                onPress={() => navigation.navigate('CrewDetail', { crewId: crew.id })}
                            />
                        ))
                    ) : (
                        <View style={[styles.empty, { backgroundColor: activeTheme.colors.surface }]}>
                            <Text style={[styles.emptyText, { color: activeTheme.colors.textMuted }]}>No perteneces a ninguna crew aún.</Text>
                        </View>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: activeTheme.colors.textMuted }]}>Descubrir Crews</Text>
                    {otherCrews.map(crew => (
                        <CrewCard
                            key={crew.id}
                            crew={crew}
                            onPress={() => navigation.navigate('CrewDetail', { crewId: crew.id })}
                        />
                    ))}
                </View>

                <Button
                    title="Unirse por invitación"
                    variant="outline"
                    onPress={() => navigation.navigate('JoinCrew')}
                    style={styles.joinBtn}
                />

                {(currentUser.role === 'admin' || currentUser.role === 'lider') && (
                    <Button
                        title="Crear Nueva Crew"
                        onPress={() => navigation.navigate('CreateCrew')}
                        style={styles.adminBtn}
                    />
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scroll: {
        padding: theme.spacing.m,
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        ...theme.typography.h3,
        marginBottom: theme.spacing.m,
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    empty: {
        padding: theme.spacing.xl,
        alignItems: 'center',
        borderRadius: theme.roundness.m,
    },
    emptyText: {
        textAlign: 'center',
    },
    joinBtn: {
        marginTop: theme.spacing.m,
        marginBottom: theme.spacing.m,
    },
    adminBtn: {
        marginBottom: theme.spacing.xxl,
    },
});

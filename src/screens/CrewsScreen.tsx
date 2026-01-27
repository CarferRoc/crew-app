import React from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView } from 'react-native';
import { theme } from '../theme';
import { Header } from '../components/Header';
import { CrewCard } from '../components/CrewCard';
import { Button } from '../components/Button';
import { useStore } from '../store/useStore';

export const CrewsScreen = ({ navigation }: any) => {
    const { crews, currentUser } = useStore();

    const myCrews = crews.filter(c => c.members.includes(currentUser.id));
    const otherCrews = crews.filter(c => !c.members.includes(currentUser.id));

    return (
        <View style={styles.container}>
            <Header title="Mis Crews" />
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tus Crews</Text>
                    {myCrews.length > 0 ? (
                        myCrews.map(crew => (
                            <CrewCard
                                key={crew.id}
                                crew={crew}
                                onPress={() => navigation.navigate('CrewDetail', { crewId: crew.id })}
                            />
                        ))
                    ) : (
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>No perteneces a ninguna crew aún.</Text>
                        </View>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Descubrir Crews</Text>
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
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scroll: {
        padding: theme.spacing.m,
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        ...theme.typography.h3,
        color: theme.colors.textMuted,
        marginBottom: theme.spacing.m,
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    empty: {
        padding: theme.spacing.xl,
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.m,
    },
    emptyText: {
        color: theme.colors.textMuted,
        textAlign: 'center',
    },
    joinBtn: {
        marginTop: theme.spacing.m,
        marginBottom: theme.spacing.xxl,
    },
});

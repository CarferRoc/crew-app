import React from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import { theme } from '../theme';
import { Header } from '../components/Header';
import { VoucherCard } from '../components/VoucherCard';
import { useStore } from '../store/useStore';

export const RewardsScreen = () => {
    const { vouchers, currentUser, redeemVoucher } = useStore();

    const progress = Math.min(currentUser.pointsPersonal / 500, 1);

    return (
        <View style={styles.container}>
            <Header title="Premios y Vales" />
            <FlatList
                data={vouchers}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={() => (
                    <View style={styles.header}>
                        <View style={styles.pointsCard}>
                            <Text style={styles.pointsLabel}>Tus Puntos Personales</Text>
                            <Text style={styles.pointsValue}>{currentUser.pointsPersonal}</Text>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                            </View>
                            <Text style={styles.progressText}>Faltan {500 - currentUser.pointsPersonal} pts para el nivel Pro</Text>
                        </View>
                        <Text style={styles.sectionTitle}>Catálogo Tuning</Text>
                    </View>
                )}
                renderItem={({ item }) => (
                    <VoucherCard
                        voucher={item}
                        onRedeem={() => redeemVoucher(item.id, currentUser.id)}
                        canRedeem={currentUser.pointsPersonal >= item.pointsCost}
                    />
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    list: {
        padding: theme.spacing.m,
    },
    header: {
        marginBottom: theme.spacing.l,
    },
    pointsCard: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.l,
        borderRadius: theme.roundness.l,
        marginBottom: theme.spacing.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.primary + '40',
    },
    pointsLabel: {
        color: theme.colors.textMuted,
        fontSize: 12,
        textTransform: 'uppercase',
    },
    pointsValue: {
        ...theme.typography.h1,
        fontSize: 48,
        color: theme.colors.text,
        marginVertical: 8,
    },
    progressBarBg: {
        width: '100%',
        height: 8,
        backgroundColor: theme.colors.surfaceVariant,
        borderRadius: 4,
        marginVertical: 12,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: 4,
    },
    progressText: {
        fontSize: 10,
        color: theme.colors.textMuted,
    },
    sectionTitle: {
        ...theme.typography.h3,
        color: theme.colors.textMuted,
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
});

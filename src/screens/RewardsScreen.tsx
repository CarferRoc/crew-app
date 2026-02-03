import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import { theme, useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { VoucherCard } from '../components/VoucherCard';
import { useStore } from '../store/useStore';

export const RewardsScreen = () => {
    const { t } = useTranslation();
    const { vouchers, currentUser, redeemVoucher } = useStore();
    const activeTheme = useAppTheme();

    if (!currentUser) return null;

    const progress = Math.min(currentUser.pointsPersonal / 500, 1);

    return (
        <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
            <Header title={t('rewards.title')} />
            <FlatList
                data={vouchers}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={() => (
                    <View style={styles.header}>
                        <View style={[styles.pointsCard, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.primary + '40' }]}>
                            <Text style={[styles.pointsLabel, { color: activeTheme.colors.textMuted }]}>{t('rewards.yourPoints')}</Text>
                            <Text style={[styles.pointsValue, { color: activeTheme.colors.text }]}>{currentUser.pointsPersonal}</Text>
                            <View style={[styles.progressBarBg, { backgroundColor: activeTheme.colors.surfaceVariant }]}>
                                <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: activeTheme.colors.primary }]} />
                            </View>
                            <Text style={[styles.progressText, { color: activeTheme.colors.textMuted }]}>{t('rewards.pointsToPro', { points: 500 - currentUser.pointsPersonal })}</Text>
                        </View>
                        <Text style={[styles.sectionTitle, { color: activeTheme.colors.textMuted }]}>{t('rewards.tuningCatalog')}</Text>
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
    },
    list: {
        padding: theme.spacing.m,
    },
    header: {
        marginBottom: theme.spacing.l,
    },
    pointsCard: {
        padding: theme.spacing.l,
        borderRadius: theme.roundness.l,
        marginBottom: theme.spacing.xl,
        alignItems: 'center',
        borderWidth: 1,
    },
    pointsLabel: {
        fontSize: 12,
        textTransform: 'uppercase',
    },
    pointsValue: {
        ...theme.typography.h1,
        fontSize: 48,
        marginVertical: 8,
    },
    progressBarBg: {
        width: '100%',
        height: 8,
        borderRadius: 4,
        marginVertical: 12,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 10,
    },
    sectionTitle: {
        ...theme.typography.h3,
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
});

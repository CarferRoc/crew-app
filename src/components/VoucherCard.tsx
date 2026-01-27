import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme, useAppTheme } from '../theme';
import { RewardVoucher } from '../models/types';

interface VoucherCardProps {
    voucher: RewardVoucher;
    onRedeem: () => void;
    canRedeem: boolean;
}

export const VoucherCard: React.FC<VoucherCardProps> = ({ voucher, onRedeem, canRedeem }) => {
    const activeTheme = useAppTheme();

    return (
        <View style={[styles.container, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }, voucher.isRedeemed && styles.redeemed]}>
            <View style={[styles.left, { borderRightColor: activeTheme.colors.border }]}>
                <Text style={[styles.brand, { color: activeTheme.colors.primary }]}>{voucher.brand}</Text>
                <Text style={[styles.title, { color: activeTheme.colors.text }]}>{voucher.title}</Text>
                <Text style={[styles.description, { color: activeTheme.colors.textMuted }]} numberOfLines={2}>{voucher.description}</Text>
            </View>
            <View style={styles.right}>
                <View style={styles.priceContainer}>
                    <Text style={[styles.price, { color: activeTheme.colors.text }]}>{voucher.pointsCost}</Text>
                    <Text style={[styles.pts, { color: activeTheme.colors.textMuted }]}>PTS</Text>
                </View>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: activeTheme.colors.secondary }, (!canRedeem || voucher.isRedeemed) && [styles.buttonDisabled, { backgroundColor: activeTheme.colors.surfaceVariant }]]}
                    onPress={onRedeem}
                    disabled={!canRedeem || voucher.isRedeemed}
                >
                    <Text style={[styles.buttonText, { color: activeTheme.colors.white }]}>
                        {voucher.isRedeemed ? 'CANJEADO' : 'CANJEAR'}
                    </Text>
                </TouchableOpacity>
            </View>
            {/* Ticket cut-outs (purely UI) */}
            <View style={[styles.cutTop, { backgroundColor: activeTheme.colors.background }]} />
            <View style={[styles.cutBottom, { backgroundColor: activeTheme.colors.background }]} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: theme.spacing.m,
        borderRadius: theme.roundness.m,
        flexDirection: 'row',
        marginBottom: theme.spacing.m,
        borderWidth: 1,
        overflow: 'hidden',
    },
    redeemed: {
        opacity: 0.6,
    },
    left: {
        flex: 1,
        paddingRight: theme.spacing.m,
        borderRightWidth: 1,
        borderStyle: 'dashed',
    },
    right: {
        width: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    brand: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    title: {
        ...theme.typography.h3,
        fontSize: 18,
        marginVertical: 4,
    },
    description: {
        ...theme.typography.caption,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    price: {
        ...theme.typography.h2,
    },
    pts: {
        fontSize: 10,
        marginLeft: 4,
    },
    button: {
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: theme.roundness.s,
    },
    buttonText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    buttonDisabled: {
    },
    cutTop: {
        position: 'absolute',
        top: -10,
        right: 90,
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    cutBottom: {
        position: 'absolute',
        bottom: -10,
        right: 90,
        width: 20,
        height: 20,
        borderRadius: 10,
    },
});

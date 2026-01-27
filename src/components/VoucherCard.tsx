import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { RewardVoucher } from '../models/types';

interface VoucherCardProps {
    voucher: RewardVoucher;
    onRedeem: () => void;
    canRedeem: boolean;
}

export const VoucherCard: React.FC<VoucherCardProps> = ({ voucher, onRedeem, canRedeem }) => {
    return (
        <View style={[styles.container, voucher.isRedeemed && styles.redeemed]}>
            <View style={styles.left}>
                <Text style={styles.brand}>{voucher.brand}</Text>
                <Text style={styles.title}>{voucher.title}</Text>
                <Text style={styles.description} numberOfLines={2}>{voucher.description}</Text>
            </View>
            <View style={styles.right}>
                <View style={styles.priceContainer}>
                    <Text style={styles.price}>{voucher.pointsCost}</Text>
                    <Text style={styles.pts}>PTS</Text>
                </View>
                <TouchableOpacity
                    style={[styles.button, (!canRedeem || voucher.isRedeemed) && styles.buttonDisabled]}
                    onPress={onRedeem}
                    disabled={!canRedeem || voucher.isRedeemed}
                >
                    <Text style={styles.buttonText}>
                        {voucher.isRedeemed ? 'CANJEADO' : 'CANJEAR'}
                    </Text>
                </TouchableOpacity>
            </View>
            {/* Ticket cut-outs (purely UI) */}
            <View style={styles.cutTop} />
            <View style={styles.cutBottom} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.m,
        borderRadius: theme.roundness.m,
        flexDirection: 'row',
        marginBottom: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
    },
    redeemed: {
        opacity: 0.6,
    },
    left: {
        flex: 1,
        paddingRight: theme.spacing.m,
        borderRightWidth: 1,
        borderRightColor: theme.colors.border,
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
        color: theme.colors.primary,
        textTransform: 'uppercase',
    },
    title: {
        ...theme.typography.h3,
        fontSize: 18,
        color: theme.colors.text,
        marginVertical: 4,
    },
    description: {
        ...theme.typography.caption,
        color: theme.colors.textMuted,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    price: {
        ...theme.typography.h2,
        color: theme.colors.text,
    },
    pts: {
        fontSize: 10,
        color: theme.colors.textMuted,
        marginLeft: 4,
    },
    button: {
        backgroundColor: theme.colors.secondary,
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: theme.roundness.s,
    },
    buttonText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: theme.colors.white,
    },
    buttonDisabled: {
        backgroundColor: theme.colors.surfaceVariant,
    },
    cutTop: {
        position: 'absolute',
        top: -10,
        right: 90,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: theme.colors.background,
    },
    cutBottom: {
        position: 'absolute',
        bottom: -10,
        right: 90,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: theme.colors.background,
    },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatBarProps {
    label: string;
    value: number;
    baseValue: number;
    color: string;
}

export const StatBar = ({ label, value, baseValue, color }: StatBarProps) => {
    const diff = value - baseValue;
    return (
        <View style={styles.statRow}>
            <Text style={styles.statLabel}>{label}</Text>
            <View style={styles.statBarContainer}>
                <View style={[styles.statBarBase, { width: `${baseValue}%` }]} />
                {diff > 0 && (
                    <View style={[styles.statBarDiff, { left: `${baseValue}%`, width: `${diff}%`, backgroundColor: '#32D74B' }]} />
                )}
                {diff < 0 && (
                    <View style={[styles.statBarDiff, { left: `${value}%`, width: `${Math.abs(diff)}%`, backgroundColor: '#FF453A' }]} />
                )}
            </View>
            <Text style={styles.statValue}>
                {value}
                {diff !== 0 && <Text style={{ color: diff > 0 ? '#32D74B' : '#FF453A' }}> {diff > 0 ? '+' : ''}{diff}</Text>}
            </Text>
        </View>
    );
};

export const TechnicalRow = ({ label, value }: { label: string, value: string | number }) => {
    return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ color: '#8E8E93', fontSize: 13 }}>{label}</Text>
            <Text style={{ color: 'white', fontSize: 13, fontWeight: '500' }}>{value}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    statRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    statLabel: { width: 40, fontSize: 12, fontWeight: '700', color: '#888' },
    statBarContainer: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' },
    statBarBase: { height: '100%', backgroundColor: '#FFF' },
    statBarDiff: { position: 'absolute', height: '100%' },
    statValue: { width: 40, fontSize: 12, fontWeight: '700', color: '#FFF', textAlign: 'right' },
});

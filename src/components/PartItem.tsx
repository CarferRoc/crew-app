import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../theme';
import { PartType, PartQuality } from '../models/types';
import { getPartName } from '../lib/gameplay';

interface PartItemProps {
    type: PartType;
    quality: PartQuality;
    isEquipped: boolean;
    onPress: () => void;
}

export const PartItem = ({ type, quality, isEquipped, onPress }: PartItemProps) => {
    const activeTheme = useAppTheme();

    const getQualityColor = () => {
        switch (quality) {
            case 'high': return '#FFD700'; // Gold
            case 'mid': return '#007AFF'; // Blue
            case 'low': return '#CD7F32'; // Bronze
            default: return '#888';
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.partItem,
                { borderColor: isEquipped ? activeTheme.colors.primary : 'transparent', borderWidth: 1 }
            ]}
            onPress={onPress}
        >
            <View style={[styles.qualityDot, { backgroundColor: getQualityColor() }]} />
            <Text style={[styles.partName, { color: activeTheme.colors.text }]}>{getPartName(type)}</Text>
            <Text style={styles.qualityText}>{quality.toUpperCase()}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    partItem: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        width: 80,
    },
    qualityDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
    partName: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
    qualityText: { fontSize: 8, color: '#888', marginTop: 2 },
});

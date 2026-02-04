import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';

export const RankingLigaScreen = () => {
    const activeTheme = useAppTheme();

    return (
        <View style={styles.container}>
            <View style={styles.centerPlace}>
                <Ionicons name="stats-chart" size={64} color={activeTheme.colors.textMuted} />
                <Text style={{ color: activeTheme.colors.text, fontSize: 20, fontWeight: '800', marginTop: 16 }}>
                    CLASIFICACIÓN
                </Text>
                <Text style={{ color: activeTheme.colors.textMuted, textAlign: 'center', marginTop: 8, paddingHorizontal: 40 }}>
                    La clasificación de la liga estará disponible próximamente tras la resolución de la primera carrera.
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerPlace: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

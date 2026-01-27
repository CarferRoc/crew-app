import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { theme, useAppTheme } from '../theme';

interface HeaderProps {
    title: string;
    showBack?: boolean;
    onBack?: () => void;
    rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack, onBack, rightAction }) => {
    const activeTheme = useAppTheme();

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: activeTheme.colors.background }]}>
            <View style={[styles.container, { borderBottomColor: activeTheme.colors.border, borderBottomWidth: 0.5 }]}>
                <View style={styles.left}>
                    {showBack && (
                        <TouchableOpacity onPress={onBack} style={styles.backButton}>
                            <Text style={[styles.backIcon, { color: activeTheme.colors.text }]}>←</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={[styles.title, { color: activeTheme.colors.text }]}>{title}</Text>
                <View style={styles.right}>
                    {rightAction}
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
    },
    container: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.m,
    },
    left: {
        width: 40,
    },
    right: {
        width: 40,
        alignItems: 'flex-end',
    },
    backButton: {
        padding: 8,
    },
    backIcon: {
        fontSize: 24,
    },
    title: {
        ...theme.typography.h3,
        textAlign: 'center',
    },
});

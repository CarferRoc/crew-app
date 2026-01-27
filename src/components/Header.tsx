import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

interface HeaderProps {
    title: string;
    showBack?: boolean;
    onBack?: () => void;
    rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack, onBack, rightAction }) => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.left}>
                    {showBack && (
                        <TouchableOpacity onPress={onBack} style={styles.backButton}>
                            <Text style={styles.backIcon}>←</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={styles.title}>{title}</Text>
                <View style={styles.right}>
                    {rightAction}
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: theme.colors.background,
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
        color: theme.colors.text,
        fontSize: 24,
    },
    title: {
        ...theme.typography.h3,
        color: theme.colors.text,
        textAlign: 'center',
    },
});

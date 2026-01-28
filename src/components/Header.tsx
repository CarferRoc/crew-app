import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';

interface HeaderProps {
    title: string;
    showBack?: boolean;
    onBack?: () => void;
    rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack, onBack, rightAction }) => {
    const theme = useAppTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
            <SafeAreaView>
                <View style={styles.content}>
                    <View style={styles.left}>
                        {showBack && (
                            <TouchableOpacity onPress={onBack} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
                        {title.toUpperCase()}
                    </Text>

                    <View style={styles.right}>
                        {rightAction}
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: Platform.OS === 'android' ? 40 : 0,
        borderBottomWidth: 1,
        elevation: 0,
        zIndex: 100,
    },
    content: {
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    left: {
        width: 40,
        alignItems: 'flex-start',
    },
    right: {
        width: 40,
        alignItems: 'flex-end',
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 2,
        flex: 1,
        textAlign: 'center',
    },
    backButton: {
        padding: 4,
    }
});

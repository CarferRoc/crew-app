import React from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';
import { useAppTheme } from '../theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, style, ...props }) => {
    const theme = useAppTheme();

    return (
        <View style={styles.container}>
            {label && <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>}
            <View style={[
                styles.inputContainer,
                {
                    backgroundColor: theme.colors.surface,
                    borderColor: error ? theme.colors.error : theme.colors.border
                }
            ]}>
                {icon && <View style={styles.icon}>{icon}</View>}
                <TextInput
                    style={[styles.input, { color: theme.colors.text }, style]}
                    placeholderTextColor={theme.colors.textMuted}
                    {...props}
                />
            </View>
            {error && <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 12,
        textTransform: 'uppercase',
        fontWeight: 'bold',
        marginBottom: 8,
        letterSpacing: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 10,
    },
    error: {
        fontSize: 12,
        marginTop: 4,
    }
});

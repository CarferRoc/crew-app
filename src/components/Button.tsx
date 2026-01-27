import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    style?: ViewStyle;
    textStyle?: TextStyle;
    disabled?: boolean;
    loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    style,
    textStyle,
    disabled,
    loading
}) => {
    const getStyles = () => {
        switch (variant) {
            case 'secondary':
                return {
                    container: { backgroundColor: theme.colors.surfaceVariant },
                    text: { color: theme.colors.text }
                };
            case 'outline':
                return {
                    container: {
                        backgroundColor: 'transparent',
                        borderWidth: 1,
                        borderColor: theme.colors.primary
                    },
                    text: { color: theme.colors.primary }
                };
            default:
                return {
                    container: { backgroundColor: theme.colors.primary },
                    text: { color: theme.colors.white }
                };
        }
    };

    const currentStyles = getStyles();

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            style={[
                styles.container,
                currentStyles.container,
                (disabled || loading) && styles.disabled,
                style
            ]}
        >
            <Text style={[styles.text, currentStyles.text, textStyle]}>
                {loading ? 'Cargando...' : title}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 50,
        borderRadius: theme.roundness.m,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.l,
        ...theme.shadows.soft,
    },
    text: {
        ...theme.typography.button,
    },
    disabled: {
        opacity: 0.5,
    },
});

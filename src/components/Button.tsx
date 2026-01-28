import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, View } from 'react-native';
import { useAppTheme } from '../theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
    textStyle,
    icon
}) => {
    const theme = useAppTheme();

    const getBackgroundColor = () => {
        if (disabled) return theme.colors.surfaceVariant;
        switch (variant) {
            case 'primary': return theme.colors.primary;
            case 'secondary': return theme.colors.secondary;
            case 'danger': return theme.colors.error;
            case 'outline': return 'transparent';
            default: return theme.colors.primary;
        }
    };

    const getBorderColor = () => {
        if (variant === 'outline') return theme.colors.border;
        return 'transparent';
    };

    const getTextColor = () => {
        if (disabled) return theme.colors.textMuted;
        if (variant === 'outline') return theme.colors.text;
        return '#FFFFFF';
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    backgroundColor: getBackgroundColor(),
                    borderColor: getBorderColor(),
                    borderWidth: variant === 'outline' ? 1 : 0,
                },
                style
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <>
                    {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
                    <Text style={[styles.text, { color: getTextColor() }, theme.typography.button, textStyle]}>
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        height: 50,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginVertical: 4,
    },
    text: {
        textAlign: 'center',
    }
});

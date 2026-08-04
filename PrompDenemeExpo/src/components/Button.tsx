import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, ViewStyle, TextStyle } from 'react-native';
import { Colors, Radius, Typography } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({ 
  title, 
  variant = 'primary', 
  icon, 
  style, 
  textStyle, 
  ...rest 
}: ButtonProps) {
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          button: { backgroundColor: Colors.light.brandTertiary },
          text: { color: Colors.light.brandPrimary }
        };
      case 'danger':
        return {
          button: { backgroundColor: Colors.light.error },
          text: { color: Colors.light.surface }
        };
      case 'primary':
      default:
        return {
          button: { backgroundColor: Colors.light.brandPrimary },
          text: { color: Colors.light.onBrandPrimary }
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <TouchableOpacity 
      style={[
        styles.button,
        variantStyles.button,
        rest.disabled && styles.disabled,
        style
      ]} 
      activeOpacity={0.8}
      {...rest}
    >
      {icon && (
        <Ionicons 
          name={icon} 
          size={20} 
          color={variantStyles.text.color} 
          style={styles.icon} 
        />
      )}
      <Text style={[styles.text, variantStyles.text, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  text: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semiBold as any,
  },
  icon: {
    marginRight: 8,
  },
  disabled: {
    opacity: 0.5,
  }
});

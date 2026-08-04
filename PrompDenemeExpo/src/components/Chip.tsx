import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps } from 'react-native';
import { Colors, Radius, Typography } from '../constants/theme';

interface ChipProps extends TouchableOpacityProps {
  label: string;
  active?: boolean;
}

export function Chip({ label, active = false, style, ...rest }: ChipProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.chip,
        active ? styles.chipActive : styles.chipInactive,
        style
      ]}
      {...rest}
    >
      <Text style={[styles.text, active ? styles.textActive : styles.textInactive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    height: 36,
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: Colors.light.brandPrimary,
  },
  chipInactive: {
    backgroundColor: Colors.light.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  text: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.medium as any,
  },
  textActive: {
    color: Colors.light.onBrandPrimary,
  },
  textInactive: {
    color: Colors.light.onSurface,
  }
});

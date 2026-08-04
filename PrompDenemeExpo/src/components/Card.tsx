import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { Colors, Radius } from '../constants/theme';

interface CardProps extends ViewProps {
  padding?: number;
  children: React.ReactNode;
}

export function Card({ children, style, padding = 16, ...rest }: CardProps) {
  return (
    <View 
      style={[
        styles.card, 
        { padding },
        style
      ]} 
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: Radius.lg,
  }
});

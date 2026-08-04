import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Radius, Typography } from '../constants/theme';

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('moffi_token');
        // Wait 400ms as requested
        setTimeout(() => {
          if (token) {
            router.replace('/(tabs)');
          } else {
            router.replace('/(auth)/login');
          }
        }, 400);
      } catch (e) {
        setTimeout(() => router.replace('/(auth)/login'), 400);
      }
    };

    checkToken();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoBox}>
        <Text style={styles.logoText}>M</Text>
      </View>
      <Text style={styles.subtitle}>Evcil dostların dijital dünyası</Text>
      <ActivityIndicator size="large" color={Colors.light.brandPrimary} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    width: 96,
    height: 96,
    backgroundColor: Colors.light.brandPrimary,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoText: {
    color: Colors.light.onBrandPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: Typography.sizes.xl,
    color: Colors.light.onSurfaceSecondary,
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  }
});

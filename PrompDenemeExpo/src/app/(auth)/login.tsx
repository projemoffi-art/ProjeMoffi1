import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Typography } from '../../constants/theme';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (email === 'demo@moffi.app' && password === 'demo1234') {
      await AsyncStorage.setItem('moffi_token', 'dummy-token');
      router.replace('/(tabs)');
    } else {
      setError('Geçersiz e-posta veya şifre.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>M</Text>
            </View>
            <Text style={styles.title}>Moffi'ye hoş geldin</Text>
            <Text style={styles.subtitle}>Evcil dostların için tek platform</Text>
          </View>

          <Card padding={24} style={styles.card}>
            <Input 
              label="E-posta" 
              placeholder="E-posta adresiniz" 
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              testID="login-email-input"
            />
            <Input 
              label="Şifre" 
              placeholder="Şifreniz" 
              secureTextEntry
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              error={error}
              testID="login-password-input"
            />
            <Button 
              title="Giriş yap" 
              onPress={handleLogin}
              style={styles.submitBtn}
              testID="login-submit-button"
            />
            
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Hesabın yok mu? </Text>
              <Text 
                style={styles.footerLink} 
                onPress={() => router.push('/(auth)/register')}
                testID="login-register-link"
              >
                Kayıt ol
              </Text>
            </View>
          </Card>

          <Text style={styles.demoInfo}>Demo: demo@moffi.app / demo1234</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBox: {
    width: 72,
    height: 72,
    backgroundColor: Colors.light.brandPrimary,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    color: Colors.light.onBrandPrimary,
    fontSize: 32,
    fontWeight: '700',
  },
  title: {
    fontSize: Typography.sizes.h3,
    fontWeight: '600',
    color: Colors.light.onSurface,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Typography.sizes.lg,
    color: Colors.light.onSurfaceSecondary,
  },
  card: {
    marginBottom: 24,
  },
  submitBtn: {
    marginTop: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: Colors.light.onSurface,
    fontSize: Typography.sizes.lg,
  },
  footerLink: {
    color: Colors.light.brandPrimary,
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
  },
  demoInfo: {
    textAlign: 'center',
    color: Colors.light.onSurfaceSecondary,
    fontSize: Typography.sizes.md,
  }
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../constants/theme';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
            <Text style={styles.title}>Kayıt Ol</Text>
            <Text style={styles.subtitle}>Moffi ailesine katılın</Text>
          </View>

          <Card padding={24}>
            <Input 
              label="Ad Soyad" 
              placeholder="Adınız Soyadınız" 
              value={name}
              onChangeText={setName}
              testID="register-name-input"
            />
            <Input 
              label="Kullanıcı adı" 
              placeholder="@kullaniciadi" 
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              testID="register-username-input"
            />
            <Input 
              label="E-posta" 
              placeholder="E-posta adresiniz" 
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              testID="register-email-input"
            />
            <Input 
              label="Şifre" 
              placeholder="En az 6 karakter" 
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              testID="register-password-input"
            />
            <Button 
              title="Kayıt ol" 
              onPress={() => router.replace('/(tabs)')}
              style={styles.submitBtn}
              testID="register-submit-button"
            />
            
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Zaten hesabın var mı? </Text>
              <Text 
                style={styles.footerLink} 
                onPress={() => router.back()}
                testID="register-login-link"
              >
                Giriş yap
              </Text>
            </View>
          </Card>
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
});

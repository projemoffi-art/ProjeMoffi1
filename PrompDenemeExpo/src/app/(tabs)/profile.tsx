import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Radius, Typography } from '../../constants/theme';
import { Button } from '../../components/Button';
import AsyncStorage from '@react-native-async-storage/async-storage';

const menuItems = [
  { id: '1', title: 'NFC / QR Kimlik', icon: 'qr-code-outline' },
  { id: '2', title: 'Kayıp Hayvan Sistemi', icon: 'location-outline' },
  { id: '3', title: 'Siparişlerim', icon: 'receipt-outline', route: '/orders' },
  { id: '4', title: 'Favorilerim', icon: 'heart-outline' },
  { id: '5', title: 'Cüzdan & Adresler', icon: 'wallet-outline' },
  { id: '6', title: 'Bağış Yap', icon: 'gift-outline' },
  { id: '7', title: 'Etkinlikler', icon: 'calendar-outline' },
  { id: '8', title: 'Bilgi Merkezi', icon: 'book-outline' },
  { id: '9', title: 'Mini Oyunlar', icon: 'game-controller-outline' },
  { id: '10', title: 'İşletme Paneli', icon: 'briefcase-outline' },
  { id: '11', title: 'Ayarlar', icon: 'settings-outline' },
];

export default function Profile() {
  const router = useRouter();

  const handleLogout = async () => {
    await AsyncStorage.removeItem('moffi_token');
    router.replace('/(auth)/login');
  };

  const handleMenuPress = (route?: string) => {
    if (route) {
      router.push(route as any);
    }
  };

  return (
    <ScrollView style={styles.container} bounces={false} contentContainerStyle={styles.scroll}>
      <LinearGradient
        colors={[Colors.light.brandPrimary, '#1D4230']}
        style={styles.cover}
      >
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop' }} 
          style={styles.avatar} 
        />
        <Text style={styles.name}>Moffi Demo</Text>
        <Text style={styles.username}>@moffi_demo</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>1,234</Text>
            <Text style={styles.statLabel}>Takipçi</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>256</Text>
            <Text style={styles.statLabel}>Takip</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>42</Text>
            <Text style={styles.statLabel}>Gönderi</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.coinCard}>
        <View style={styles.coinIconBox}>
          <Ionicons name="logo-bitcoin" size={24} color={Colors.light.warning} />
        </View>
        <View style={styles.coinContent}>
          <Text style={styles.coinLabel}>Moffi Coin</Text>
          <Text style={styles.coinValue}>2,450</Text>
        </View>
        <TouchableOpacity style={styles.rewardButton}>
          <Ionicons name="flash" size={14} color={Colors.light.onBrandPrimary} style={{ marginRight: 4 }} />
          <Text style={styles.rewardButtonText}>Günlük Ödül</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menuList}>
        {menuItems.map(item => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.menuItem} 
            activeOpacity={0.7}
            onPress={() => handleMenuPress(item.route)}
          >
            <View style={styles.menuIconBox}>
              <Ionicons name={item.icon as any} size={20} color={Colors.light.onBrandTertiary} />
            </View>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.light.onSurfaceSecondary} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.light.error} />
        <Text style={styles.logoutText}>Çıkış Yap</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Moffi v1.0 · Made with 🐾</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  scroll: {
    paddingBottom: 40,
  },
  cover: {
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40, // safe area equivalent roughly
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: Colors.light.surface,
    marginBottom: 12,
  },
  name: {
    fontSize: Typography.sizes.h5,
    fontWeight: '700',
    color: Colors.light.onBrandPrimary,
    marginBottom: 2,
  },
  username: {
    fontSize: Typography.sizes.md,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.sizes.xxl,
    fontWeight: '700',
    color: Colors.light.onBrandPrimary,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  coinCard: {
    marginHorizontal: 16,
    marginTop: -20,
    padding: 16,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.brandTertiary,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  coinIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  coinContent: {
    flex: 1,
  },
  coinLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: '500',
    color: Colors.light.onBrandTertiary,
  },
  coinValue: {
    fontSize: Typography.sizes.h4,
    fontWeight: '700',
    color: Colors.light.onBrandTertiary,
  },
  rewardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.brandPrimary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  rewardButtonText: {
    color: Colors.light.onBrandPrimary,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  },
  menuList: {
    padding: 16,
    gap: 4,
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: Radius.md,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.brandTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTitle: {
    flex: 1,
    fontSize: Typography.sizes.lg,
    fontWeight: '500',
    color: Colors.light.onSurface,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.surfaceSecondary,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: Radius.md,
    marginTop: 8,
    gap: 8,
  },
  logoutText: {
    color: Colors.light.error,
    fontSize: Typography.sizes.xl,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    fontSize: Typography.sizes.xs,
    color: Colors.light.onSurfaceSecondary,
    marginTop: 24,
  }
});

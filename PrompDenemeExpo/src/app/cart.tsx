import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Colors, Radius, Typography } from '../constants/theme';
import { Button } from '../components/Button';
import { mockProducts } from '../utils/mockData';

export default function Cart() {
  const router = useRouter();
  const [items, setItems] = useState([
    { ...mockProducts[0], qty: 1 },
    { ...mockProducts[2], qty: 1 }
  ]);

  const updateQty = (id: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const total = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.light.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sepetim</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="bag-outline" size={64} color={Colors.light.onSurfaceSecondary} />
          <Text style={styles.emptyTitle}>Sepetin boş</Text>
          <Text style={styles.emptySubtitle}>Henüz bir ürün eklemedin.</Text>
          <Button title="Mağazaya Git" onPress={() => router.back()} style={{ marginTop: 24 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.light.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sepetim</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.itemsList}>
          {items.map(item => (
            <View key={item.id} style={styles.cartCard}>
              <Image source={item.image} style={styles.itemImage} />
              <View style={styles.itemContent}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.itemPrice}>{item.price} ₺</Text>
                
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, -1)}>
                    <Ionicons name="remove" size={16} color={Colors.light.onSurface} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.qty}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, 1)}>
                    <Ionicons name="add" size={16} color={Colors.light.onSurface} />
                  </TouchableOpacity>
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity onPress={() => removeItem(item.id)}>
                    <Ionicons name="trash-outline" size={20} color={Colors.light.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Toplam ({items.length} ürün)</Text>
          <Text style={styles.totalPrice}>{total} ₺</Text>
        </View>
        <Button 
          title="Ödemeye Geç" 
          icon="lock-closed"
          onPress={() => router.push('/orders')}
        />
        <Text style={styles.secureText}>🔒 Güvenli ödeme · Stripe ile korunuyor</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  backBtn: {
    padding: 4,
    width: 32,
  },
  headerTitle: {
    fontSize: Typography.sizes.h6,
    fontWeight: '700',
    color: Colors.light.onSurface,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: Typography.sizes.h5,
    fontWeight: '700',
    color: Colors.light.onSurface,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: Typography.sizes.lg,
    color: Colors.light.onSurfaceSecondary,
  },
  scroll: {
    padding: 16,
    paddingBottom: 160,
  },
  itemsList: {
    gap: 12,
  },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surfaceSecondary,
    padding: 12,
    borderRadius: Radius.lg,
    gap: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
  },
  itemContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.light.onSurface,
  },
  itemPrice: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.light.brandPrimary,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  qtyText: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.light.onSurface,
    minWidth: 20,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.surface,
    padding: 16,
    borderTopWidth: 0.5,
    borderTopColor: Colors.light.border,
    paddingBottom: 32, // SafeArea padding
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: Typography.sizes.lg,
    color: Colors.light.onSurface,
  },
  totalPrice: {
    fontSize: Typography.sizes.h4,
    fontWeight: '700',
    color: Colors.light.brandPrimary,
  },
  secureText: {
    fontSize: Typography.sizes.xs,
    color: Colors.light.onSurfaceSecondary,
    textAlign: 'center',
    marginTop: 12,
  }
});

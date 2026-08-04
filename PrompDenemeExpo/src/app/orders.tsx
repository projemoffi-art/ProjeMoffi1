import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Colors, Radius, Typography } from '../constants/theme';
import { mockProducts } from '../utils/mockData';
import { Card } from '../components/Card';

export default function Orders() {
  const router = useRouter();
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    // Polling simulation
    const timer = setTimeout(() => {
      setPolling(false);
    }, 4500); // 3 * 1.5s
    return () => clearTimeout(timer);
  }, []);

  const orders = [
    {
      id: 'ORDER84920492',
      status: polling ? 'pending' : 'preparing',
      date: '27 Tem 2026, 14:30',
      items: [mockProducts[0], mockProducts[2]],
      total: 798,
    },
    {
      id: 'ORDER19384729',
      status: 'shipped',
      date: '20 Tem 2026, 09:15',
      items: [mockProducts[1]],
      total: 199,
    },
    {
      id: 'ORDER55839201',
      status: 'delivered',
      date: '10 Tem 2026, 11:20',
      items: [mockProducts[3], mockProducts[4], mockProducts[5]],
      total: 497,
    },
    {
      id: 'ORDER99382012',
      status: 'cancelled',
      date: '05 Tem 2026, 16:45',
      items: [mockProducts[2]],
      total: 449,
    }
  ];

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: '#FFF3CD', text: '#8B6914', icon: 'time', label: 'Ödeme Bekliyor' };
      case 'preparing':
        return { bg: '#E4EDE7', text: '#1D4230', icon: 'checkmark-circle', label: 'Ödendi · Hazırlanıyor' };
      case 'shipped':
        return { bg: '#DBEEFD', text: '#0F5478', icon: 'car', label: 'Kargoda' };
      case 'delivered':
        return { bg: '#E4EDE7', text: '#1D4230', icon: 'checkmark-done', label: 'Teslim Edildi' };
      case 'cancelled':
        return { bg: '#FBE0E0', text: '#8B2525', icon: 'close-circle', label: 'İptal' };
      default:
        return { bg: '#E0E5E0', text: '#3A4B40', icon: 'ellipse', label: 'Bilinmiyor' };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.light.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Siparişlerim</Text>
        <View style={styles.backBtn} />
      </View>

      {polling && (
        <View style={styles.pollingBanner}>
          <ActivityIndicator size="small" color={Colors.light.brandPrimary} />
          <Text style={styles.pollingText}>Ödemen kontrol ediliyor...</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll}>
        {orders.map(order => {
          const pill = getStatusPill(order.status);
          
          return (
            <Card key={order.id} padding={12} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderId}>#{order.id.slice(0, 8)}</Text>
                  <Text style={styles.orderDate}>{order.date}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
                  <Ionicons name={pill.icon as any} size={14} color={pill.text} style={{ marginRight: 4 }} />
                  <Text style={[styles.statusText, { color: pill.text }]}>{pill.label}</Text>
                </View>
              </View>
              
              <View style={styles.thumbnailsRow}>
                {order.items.slice(0, 4).map((item, idx) => (
                  <Image key={idx} source={item.image} style={styles.thumbnail} />
                ))}
                {order.items.length > 4 && (
                  <View style={styles.moreThumbnail}>
                    <Text style={styles.moreThumbnailText}>+{order.items.length - 4}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.orderFooter}>
                <Text style={styles.orderItemsCount}>{order.items.length} ürün</Text>
                <Text style={styles.orderTotal}>{order.total},00 ₺</Text>
              </View>

              <View style={styles.demoWarning}>
                <Text style={styles.demoWarningText}>🧪 Demo ödeme</Text>
              </View>
            </Card>
          );
        })}
      </ScrollView>
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
  pollingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.brandTertiary,
    paddingVertical: 12,
    gap: 8,
  },
  pollingText: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.onBrandTertiary,
    fontWeight: '500',
  },
  scroll: {
    padding: 16,
    gap: 16,
  },
  orderCard: {
    gap: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderId: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.light.onSurface,
  },
  orderDate: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.onSurfaceSecondary,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  thumbnailsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surfaceTertiary,
  },
  moreThumbnail: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.brandTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreThumbnailText: {
    color: Colors.light.brandPrimary,
    fontWeight: '700',
    fontSize: Typography.sizes.md,
  },
  divider: {
    height: 0.5,
    backgroundColor: Colors.light.border,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItemsCount: {
    fontSize: Typography.sizes.md,
    color: Colors.light.onSurfaceSecondary,
  },
  orderTotal: {
    fontSize: Typography.sizes.h6,
    fontWeight: '700',
    color: Colors.light.brandPrimary,
  },
  demoWarning: {
    position: 'absolute',
    bottom: 12,
    left: 80,
  },
  demoWarningText: {
    fontSize: 10,
    color: Colors.light.warning,
    fontWeight: '600',
  }
});

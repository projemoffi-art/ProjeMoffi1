import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Radius, Typography } from '../../constants/theme';
import { mockProducts, mockCategories } from '../../utils/mockData';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';

export default function Shop() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [activeCategory, setActiveCategory] = useState('Tümü');

  const numColumns = 2;
  const paddingHorizontal = 16;
  const gap = 12;
  const cardWidth = (width - paddingHorizontal * 2 - gap) / numColumns;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mağaza</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="search-outline" size={24} color={Colors.light.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerIcon}
            onPress={() => router.push('/cart')}
          >
            <Ionicons name="bag-outline" size={24} color={Colors.light.onSurface} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/tryon')}>
          <View style={styles.tryOnBanner}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&h=400&fit=crop' }} 
              style={StyleSheet.absoluteFillObject} 
              contentFit="cover"
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.65)']}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.bannerContent}>
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles" size={10} color={Colors.light.brandPrimary} />
                <Text style={styles.aiBadgeText}>YAPAY ZEKA</Text>
              </View>
              <Text style={styles.bannerTitle}>Sanal Giydirme</Text>
              <Text style={styles.bannerSubtitle}>Evcil dostuna ürünü denemeden önce gör</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            {mockCategories.map(cat => (
              <Chip 
                key={cat} 
                label={cat} 
                active={activeCategory === cat}
                onPress={() => setActiveCategory(cat)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.productsGrid}>
          {mockProducts.map(product => (
            <Card key={product.id} padding={0} style={[styles.productCard, { width: cardWidth }]}>
              <Image source={product.image} style={styles.productImage} contentFit="cover" />
              <View style={styles.productContent}>
                <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                <Text style={styles.productColor}>{product.color}</Text>
                <View style={styles.productBottomRow}>
                  <Text style={styles.productPrice}>{product.price} ₺</Text>
                  <TouchableOpacity style={styles.addButton}>
                    <Ionicons name="add" size={20} color={Colors.light.onBrandPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))}
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: Typography.sizes.h2,
    fontWeight: '700',
    color: Colors.light.onSurface,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIcon: {
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.light.brandSecondary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.light.surface,
    fontSize: 10,
    fontWeight: '700',
  },
  scroll: {
    paddingBottom: 24,
  },
  tryOnBanner: {
    marginHorizontal: 16,
    height: 160,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 16,
    marginBottom: 16,
  },
  bannerContent: {
    alignItems: 'flex-start',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    marginBottom: 8,
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.brandPrimary,
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: Typography.sizes.h4,
    fontWeight: '700',
    color: Colors.light.surface,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: Typography.sizes.md,
    color: 'rgba(255,255,255,0.8)',
  },
  categoriesContainer: {
    height: 56,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  productCard: {
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
  },
  productContent: {
    padding: 12,
  },
  productName: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.light.onSurface,
    minHeight: 36,
  },
  productColor: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.onSurfaceSecondary,
    marginTop: 4,
    marginBottom: 8,
  },
  productBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: Typography.sizes.xxl,
    fontWeight: '700',
    color: Colors.light.brandPrimary,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.brandPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

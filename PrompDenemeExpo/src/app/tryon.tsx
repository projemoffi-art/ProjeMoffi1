import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Radius, Typography } from '../constants/theme';
import { Button } from '../components/Button';
import { mockProducts } from '../utils/mockData';

export default function TryOn() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [result, setResult] = useState<boolean>(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
      setResult(false);
    }
  };

  const handleTryOn = () => {
    setResult(true);
  };

  const selectedProduct = mockProducts.find(p => p.id === selectedProductId);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.light.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Sanal Giydirme</Text>
          <Text style={styles.headerSubtitle}>AI ile evcil dostuna ürünü dene</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {!result ? (
          <>
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>1. Evcil hayvan fotoğrafı</Text>
              <TouchableOpacity style={styles.photoPicker} onPress={pickImage} activeOpacity={0.8}>
                {photo ? (
                  <Image source={{ uri: photo }} style={styles.pickedPhoto} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="cloud-upload" size={38} color={Colors.light.brandPrimary} />
                    <Text style={styles.photoPlaceholderTitle}>Fotoğraf seç</Text>
                    <Text style={styles.photoPlaceholderSubtitle}>Galeriden seç veya kameradan çek</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>2. Ürün seç</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productsScroll}>
                {mockProducts.map(product => {
                  const isSelected = selectedProductId === product.id;
                  return (
                    <TouchableOpacity
                      key={product.id}
                      style={[styles.productPill, isSelected && styles.productPillSelected]}
                      onPress={() => {
                        setSelectedProductId(product.id);
                        setResult(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Image source={product.image} style={styles.pillImage} />
                      <View style={styles.pillContent}>
                        <Text style={styles.pillName} numberOfLines={1}>{product.name}</Text>
                        <Text style={styles.pillPrice}>{product.price} ₺</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <Button 
              title="AI ile Giydir" 
              icon="sparkles" 
              onPress={handleTryOn}
              disabled={!photo || !selectedProductId}
              style={styles.ctaButton}
            />
          </>
        ) : (
          <View style={styles.resultContainer}>
            <Text style={styles.stepTitle}>Sonuç</Text>
            <View style={styles.resultImageBox}>
              {/* Fake overlay blending for demo */}
              {photo && <Image source={{ uri: photo }} style={styles.resultBaseImage} />}
              {selectedProduct && (
                <Image 
                  source={selectedProduct.image} 
                  style={styles.resultOverlayImage} 
                  contentFit="contain"
                />
              )}
            </View>
            
            <Button 
              title="Sepete Ekle" 
              variant="secondary"
              icon="bag-add" 
              onPress={() => router.push('/cart')}
              style={styles.addToCartBtn}
            />
            <Button 
              title="Yeni Fotoğraf Dene" 
              variant="ghost" 
              onPress={() => setResult(false)}
              style={styles.retryBtn}
              textStyle={{ color: Colors.light.onSurfaceSecondary }}
            />
          </View>
        )}
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
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.sizes.h6,
    fontWeight: '700',
    color: Colors.light.onSurface,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.onSurfaceSecondary,
    marginTop: 2,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  stepContainer: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.light.onSurface,
    marginBottom: 12,
  },
  photoPicker: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  pickedPhoto: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderTitle: {
    fontSize: Typography.sizes.xxl,
    fontWeight: '600',
    color: Colors.light.onSurface,
    marginTop: 12,
    marginBottom: 4,
  },
  photoPlaceholderSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.onSurfaceSecondary,
  },
  productsScroll: {
    gap: 12,
  },
  productPill: {
    width: 130,
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: Radius.md,
    padding: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  productPillSelected: {
    backgroundColor: Colors.light.brandTertiary,
    borderColor: Colors.light.brandPrimary,
  },
  pillImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.sm,
    marginBottom: 8,
  },
  pillContent: {
    alignItems: 'center',
  },
  pillName: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.light.onSurface,
    marginBottom: 4,
  },
  pillPrice: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.light.brandPrimary,
  },
  ctaButton: {
    marginTop: 16,
  },
  resultContainer: {
    alignItems: 'center',
  },
  resultImageBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.light.surfaceTertiary,
    marginBottom: 24,
  },
  resultBaseImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  resultOverlayImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    opacity: 0.9,
  },
  addToCartBtn: {
    width: '100%',
    marginBottom: 12,
  },
  retryBtn: {
    width: '100%',
  }
});

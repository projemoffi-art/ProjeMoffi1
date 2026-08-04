import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors, Radius, Typography } from '../../constants/theme';
import { mockPets, mockVets } from '../../utils/mockData';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';

export default function Health() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.headerTitle}>Sağlık</Text>

        <TouchableOpacity activeOpacity={0.8}>
          <View style={styles.emergencyBanner}>
            <View style={styles.bannerIconContainer}>
              <Ionicons name="alert-circle" size={24} color={Colors.light.onBrandPrimary} />
            </View>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>Kayıp Hayvan İhbarı</Text>
              <Text style={styles.bannerSubtitle}>Yakındaki kullanıcılara anında bildirim gönder</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={Colors.light.onBrandPrimary} />
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Evcil Hayvanlarım</Text>
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="add" size={16} color={Colors.light.onBrandPrimary} />
              <Text style={styles.addButtonText}>Ekle</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petsScroll}>
            {mockPets.map(pet => (
              <Card key={pet.id} padding={12} style={styles.petCard}>
                <Image source={pet.avatar} style={styles.petAvatar} />
                <Text style={styles.petName}>{pet.name}</Text>
                <Text style={styles.petInfo}>{pet.breed} · {pet.age} yaş</Text>
                <TouchableOpacity style={styles.deleteChip}>
                  <Ionicons name="trash-outline" size={16} color={Colors.light.error} />
                </TouchableOpacity>
              </Card>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Hatırlatmalar</Text>
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="add" size={16} color={Colors.light.onBrandPrimary} />
              <Text style={styles.addButtonText}>Ekle</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.remindersList}>
            <Card padding={12} style={styles.reminderCard}>
              <View style={styles.reminderIconBox}>
                <Ionicons name="medkit-outline" size={20} color={Colors.light.brandPrimary} />
              </View>
              <View style={styles.reminderContent}>
                <Text style={styles.reminderTitle}>İç Dış Parazit Aşısı</Text>
                <Text style={styles.reminderDate}>Aşı · 22 Ekim 2023</Text>
              </View>
              <TouchableOpacity>
                <Ionicons name="close" size={20} color={Colors.light.onSurfaceSecondary} />
              </TouchableOpacity>
            </Card>
            <Card padding={12} style={styles.reminderCard}>
              <View style={styles.reminderIconBox}>
                <Ionicons name="restaurant-outline" size={20} color={Colors.light.brandPrimary} />
              </View>
              <View style={styles.reminderContent}>
                <Text style={styles.reminderTitle}>Mama Siparişi</Text>
                <Text style={styles.reminderDate}>Alışveriş · 25 Ekim 2023</Text>
              </View>
              <TouchableOpacity>
                <Ionicons name="close" size={20} color={Colors.light.onSurfaceSecondary} />
              </TouchableOpacity>
            </Card>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginLeft: 16, marginBottom: 12 }]}>Yakındaki Veterinerler</Text>
          <View style={styles.vetsList}>
            {mockVets.map(vet => (
              <Card key={vet.id} padding={0} style={styles.vetCard}>
                <Image source={vet.image} style={styles.vetImage} contentFit="cover" />
                <View style={styles.vetContent}>
                  <View style={styles.vetTitleRow}>
                    <Text style={styles.vetName}>{vet.name}</Text>
                    {vet.is24_7 && (
                      <View style={styles.badge247}>
                        <Text style={styles.badge247Text}>7/24</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.vetAddress}>{vet.address}</Text>
                  <View style={styles.vetMetaRow}>
                    <Ionicons name="star" size={14} color={Colors.light.warning} />
                    <Text style={styles.vetRating}>{vet.rating} ({vet.reviews})</Text>
                    <Text style={styles.metaDot}>·</Text>
                    <Text style={styles.vetHours}>{vet.hours}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
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
  scroll: {
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: Typography.sizes.h2,
    fontWeight: '700',
    color: Colors.light.brandPrimary,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  emergencyBanner: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.brandSecondary,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  bannerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '600',
    color: Colors.light.onBrandPrimary,
  },
  bannerSubtitle: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: Typography.sizes.h6,
    fontWeight: '600',
    color: Colors.light.onSurface,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.brandPrimary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    gap: 4,
  },
  addButtonText: {
    color: Colors.light.onBrandPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: '500',
  },
  petsScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  petCard: {
    width: 140,
    alignItems: 'center',
  },
  petAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 12,
  },
  petName: {
    fontSize: Typography.sizes.xl,
    fontWeight: '600',
    color: Colors.light.onSurface,
  },
  petInfo: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.onSurfaceSecondary,
    marginTop: 2,
  },
  deleteChip: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  remindersList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  reminderIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.brandTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.light.onSurface,
  },
  reminderDate: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.onSurfaceSecondary,
    marginTop: 2,
  },
  vetsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  vetCard: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  vetImage: {
    width: 96,
    height: 96,
  },
  vetContent: {
    flex: 1,
    padding: 12,
  },
  vetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  vetName: {
    fontSize: Typography.sizes.xl,
    fontWeight: '600',
    color: Colors.light.onSurface,
    flex: 1,
  },
  badge247: {
    backgroundColor: Colors.light.brandSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badge247Text: {
    color: Colors.light.onBrandPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
  vetAddress: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.onSurfaceSecondary,
    marginBottom: 8,
  },
  vetMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vetRating: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.onSurfaceSecondary,
    marginLeft: 4,
  },
  metaDot: {
    marginHorizontal: 4,
    color: Colors.light.onSurfaceSecondary,
  },
  vetHours: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.onSurfaceSecondary,
  }
});

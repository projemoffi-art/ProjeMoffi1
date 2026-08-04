import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../constants/theme';
import { mockStories, mockPosts } from '../../utils/mockData';

export default function Feed() {
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState(mockPosts);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const toggleLike = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 };
      }
      return p;
    }));
  };

  const renderStory = ({ item }: { item: typeof mockStories[0] }) => {
    return (
      <View style={styles.storyContainer}>
        <View style={[styles.storyRing, item.isMe && styles.storyRingDashed]}>
          <Image source={item.avatar} style={styles.storyAvatar} />
          {item.isMe && (
            <View style={styles.storyAddBadge}>
              <Ionicons name="add" size={12} color={Colors.light.onBrandPrimary} />
            </View>
          )}
        </View>
        <Text style={styles.storyName} numberOfLines={1}>{item.name}</Text>
      </View>
    );
  };

  const renderPost = ({ item }: { item: typeof mockPosts[0] }) => {
    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <Image source={item.user.avatar} style={styles.postAvatar} />
          <View style={styles.postUserInfo}>
            <Text style={styles.postUserName}>{item.user.name}</Text>
            <Text style={styles.postUserHandle}>@{item.user.username}</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={20} color={Colors.light.onSurface} />
          </TouchableOpacity>
        </View>

        <Image source={item.image} style={styles.postImage} contentFit="cover" />

        <View style={styles.postActions}>
          <View style={styles.postActionsLeft}>
            <TouchableOpacity onPress={() => toggleLike(item.id)}>
              <Ionicons 
                name={item.isLiked ? 'heart' : 'heart-outline'} 
                size={24} 
                color={item.isLiked ? Colors.light.brandSecondary : Colors.light.onSurface} 
              />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="chatbubble-outline" size={24} color={Colors.light.onSurface} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="paper-plane-outline" size={24} color={Colors.light.onSurface} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity>
            <Ionicons name="bookmark-outline" size={24} color={Colors.light.onSurface} />
          </TouchableOpacity>
        </View>

        <View style={styles.postFooter}>
          <Text style={styles.likesText}>{item.likes} beğeni</Text>
          <Text style={styles.captionText}>
            <Text style={{ fontWeight: '700' }}>{item.user.username}</Text> {item.caption}
          </Text>
          <TouchableOpacity>
            <Text style={styles.commentsText}>{item.commentsCount} yorumu gör</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const ListHeader = () => (
    <View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesScroll}
      >
        {mockStories.map(item => (
          <React.Fragment key={item.id}>
            {renderStory({ item })}
          </React.Fragment>
        ))}
      </ScrollView>
      <View style={styles.divider} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.logo}>Moffi</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="search-outline" size={24} color={Colors.light.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="paper-plane-outline" size={24} color={Colors.light.onSurface} />
          </TouchableOpacity>
        </View>
      </View>
      
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={renderPost}
        ListHeaderComponent={ListHeader}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={Colors.light.brandPrimary} 
          />
        }
      />
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.light.surface,
  },
  logo: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.light.brandPrimary,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIcon: {
    padding: 6,
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: 20,
    shadowColor: Colors.light.brandPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  storiesScroll: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  storyContainer: {
    width: 76,
    alignItems: 'center',
  },
  storyRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2.5,
    borderColor: Colors.light.brandPrimary,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: Colors.light.surfaceSecondary,
  },
  storyRingDashed: {
    borderStyle: 'dashed',
    borderColor: Colors.light.brandSecondary,
    backgroundColor: Colors.light.surface,
  },
  storyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  storyAddBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.light.brandPrimary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: Colors.light.surface,
  },
  storyName: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.onSurface,
  },
  divider: {
    height: 0,
  },
  postCard: {
    marginBottom: 20,
    backgroundColor: Colors.light.surfaceSecondary,
    marginHorizontal: 16,
    borderRadius: 24,
    shadowColor: Colors.light.brandPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  postAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  postUserInfo: {
    flex: 1,
  },
  postUserName: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.light.onSurface,
  },
  postUserHandle: {
    fontSize: Typography.sizes.sm,
    fontWeight: '500',
    color: Colors.light.onSurfaceSecondary,
  },
  postImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.light.surfaceTertiary,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  postActionsLeft: {
    flexDirection: 'row',
    gap: 16,
  },
  postFooter: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 6,
  },
  likesText: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.light.onSurface,
  },
  captionText: {
    fontSize: Typography.sizes.lg,
    color: Colors.light.onSurface,
    lineHeight: 20,
  },
  commentsText: {
    fontSize: Typography.sizes.md,
    color: Colors.light.onSurfaceSecondary,
    fontWeight: '500',
    marginTop: 4,
  }
});

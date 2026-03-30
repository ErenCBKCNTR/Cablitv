import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@react-navigation/native';
import { CHANNELS, Channel } from '../constants/channels';
import { ChannelItem } from '../components/ChannelItem';
import { MediaPlayer } from '../components/MediaPlayer';
import { Ionicons } from '@expo/vector-icons';

export const LiveTVScreen = () => {
  const { colors } = useTheme() as any;
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);

  const tvChannels = CHANNELS.filter((c) => c.type === 'tv');

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const favs = await AsyncStorage.getItem('@tv_favorites');
      if (favs) {
        setFavorites(JSON.parse(favs));
      }
    } catch (e) {
      console.error('Failed to load TV favorites', e);
    }
  };

  const toggleFavorite = async (channelId: string) => {
    let newFavs = [...favorites];
    if (newFavs.includes(channelId)) {
      newFavs = newFavs.filter((id) => id !== channelId);
    } else {
      newFavs.push(channelId);
    }
    setFavorites(newFavs);
    try {
      await AsyncStorage.setItem('@tv_favorites', JSON.stringify(newFavs));
    } catch (e) {
      console.error('Failed to save TV favorite', e);
    }
  };

  const filteredChannels = tvChannels.filter((channel) =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedChannels = [...filteredChannels].sort((a, b) => {
    const aFav = favorites.includes(a.id) ? 1 : 0;
    const bFav = favorites.includes(b.id) ? 1 : 0;
    return bFav - aFav; // Favorites first
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.icon} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Televizyon Kanalı Ara..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={sortedChannels}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <ChannelItem
            channel={item}
            isFavorite={favorites.includes(item.id)}
            onPress={() => setActiveChannel(item)}
            onToggleFavorite={() => toggleFavorite(item.id)}
            colors={colors}
          />
        )}
        contentContainerStyle={styles.listContent}
      />

      {activeChannel && (
         <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
           <MediaPlayer
             channel={activeChannel}
             onClose={() => setActiveChannel(null)}
             colors={colors}
           />
         </KeyboardAvoidingView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  row: {
    flex: 1,
    justifyContent: 'flex-start',
  },
});

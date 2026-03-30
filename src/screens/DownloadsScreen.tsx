import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image } from 'react-native';
import { useTheme } from '@react-navigation/native';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';

export const DownloadsScreen = () => {
  const { colors } = useTheme() as any;
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status === 'granted') {
        loadAssets();
      }
    })();
  }, []);

  const loadAssets = async () => {
    try {
      // Find our specific album if it exists
      const album = await MediaLibrary.getAlbumAsync('MediaApp İndirilenler');

      if (album) {
        const result = await MediaLibrary.getAssetsAsync({
          album: album,
          first: 50,
          mediaType: ['video', 'audio', 'photo'],
        });
        setAssets(result.assets);
      } else {
        setAssets([]);
      }
    } catch (error) {
      console.error('Error loading assets', error);
      Alert.alert('Hata', 'İndirilen dosyalar yüklenirken bir sorun oluştu.');
    }
  };

  const handleShare = async (uri: string) => {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    } else {
      Alert.alert('Hata', 'Paylaşım bu cihazda desteklenmiyor.');
    }
  };

  const handleDelete = (asset: MediaLibrary.Asset) => {
    Alert.alert(
        'Emin misiniz?',
        'Bu dosyayı silmek istediğinize emin misiniz?',
        [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Sil',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await MediaLibrary.deleteAssetsAsync([asset]);
                        loadAssets(); // Reload the list
                    } catch (error) {
                        console.error('Delete error', error);
                        Alert.alert('Hata', 'Dosya silinemedi.');
                    }
                }
            }
        ]
    );
  };

  if (hasPermission === false) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Galeri erişim izni verilmedi.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {assets.length === 0 ? (
        <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={60} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Henüz indirilmiş bir dosya bulunmuyor.
            </Text>
        </View>
      ) : (
        <FlatList
          data={assets}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.itemContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                {item.mediaType === 'video' ? (
                     <Ionicons name="videocam-outline" size={40} color={colors.primary} style={styles.icon} />
                ) : item.mediaType === 'audio' ? (
                     <Ionicons name="musical-notes-outline" size={40} color={colors.primary} style={styles.icon} />
                ) : (
                     <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                )}

              <View style={styles.infoContainer}>
                <Text style={[styles.filename, { color: colors.text }]} numberOfLines={2}>
                  {item.filename}
                </Text>
                <Text style={[styles.filesize, { color: colors.textSecondary }]}>
                  {item.mediaType.toUpperCase()}
                </Text>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={() => handleShare(item.uri)} style={styles.actionBtn}>
                   <Ionicons name="share-social-outline" size={24} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                   <Ionicons name="trash-outline" size={24} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
      marginTop: 16,
      fontSize: 16,
      textAlign: 'center',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  icon: {
      marginRight: 16,
  },
  thumbnail: {
      width: 40,
      height: 40,
      borderRadius: 8,
      marginRight: 16,
  },
  infoContainer: {
    flex: 1,
  },
  filename: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  filesize: {
    fontSize: 12,
    marginTop: 4,
  },
  actionButtons: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  actionBtn: {
      marginLeft: 16,
      padding: 4,
  }
});

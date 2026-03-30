import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, Text } from 'react-native';
import { useTheme, useNavigation } from '@react-navigation/native';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

export const DownloadsScreen = () => {
  const { colors } = useTheme() as any;
  const navigation = useNavigation() as any;
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [activeMediaUri, setActiveMediaUri] = useState<string | null>(null);

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
    Alert.alert('Emin misiniz?', 'Bu dosyayı silmek istediğinize emin misiniz?', [
        { text: 'İptal', style: 'cancel' },
        {
            text: 'Sil',
            style: 'destructive',
            onPress: async () => {
                try {
                    await MediaLibrary.deleteAssetsAsync([asset]);
                    loadAssets();
                } catch (error) {
                    console.error('Delete error', error);
                    Alert.alert('Hata', 'Dosya silinemedi.');
                }
            }
        }
    ]);
  };

  // As requested, integrating mediaelement/mediaelement using an embedded webview player.
  // We use MediaElement.js wrapped in a simple HTML string to play the active media natively.
  const renderMediaElementPlayer = (uri: string) => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/mediaelement/4.2.17/mediaelementplayer.min.css">
            <style>
                body, html { margin: 0; padding: 0; background: #000; height: 100%; display: flex; justify-content: center; align-items: center; overflow: hidden; }
                .mejs__container { width: 100% !important; height: 100% !important; }
            </style>
        </head>
        <body>
            <video id="player" controls preload="auto" style="max-width: 100%;">
                <source src="${uri}" type="video/mp4">
            </video>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/mediaelement/4.2.17/mediaelement-and-player.min.js"></script>
            <script>
                document.addEventListener('DOMContentLoaded', function() {
                    new MediaElementPlayer('player', {
                        features: ['playpause', 'progress', 'current', 'duration', 'tracks', 'volume', 'fullscreen'],
                        success: function(media) { media.play(); }
                    });
                });
            </script>
        </body>
        </html>
      `;

      return (
          <View style={styles.playerContainer}>
             <View style={styles.playerHeader}>
                 <Text style={styles.playerTitle} numberOfLines={1}>MediaElement.js Oynatıcı</Text>
                 <TouchableOpacity onPress={() => setActiveMediaUri(null)}>
                     <Ionicons name="close-circle" size={32} color="#FFF" />
                 </TouchableOpacity>
             </View>
             <WebView
                source={{ html }}
                style={{ flex: 1, backgroundColor: '#000' }}
                javaScriptEnabled={true}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
             />
          </View>
      );
  };

  if (hasPermission === false) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Galeri erişim izni verilmedi.</Text>
      </View>
    );
  }

  if (activeMediaUri) {
      return renderMediaElementPlayer(activeMediaUri);
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
            <TouchableOpacity
                style={[styles.itemContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
                onPress={() => setActiveMediaUri(item.uri)}
            >
                <Ionicons
                    name={item.mediaType === 'video' ? "videocam-outline" : "musical-notes-outline"}
                    size={40}
                    color={colors.primary}
                    style={styles.icon}
                />

              <View style={styles.infoContainer}>
                <Text style={[styles.filename, { color: colors.text }]} numberOfLines={2}>
                  {item.filename}
                </Text>
                <Text style={[styles.filesize, { color: colors.textSecondary }]}>
                  {item.mediaType.toUpperCase()} Oynat
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
            </TouchableOpacity>
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
      padding: 8,
  },
  playerContainer: {
      flex: 1,
      backgroundColor: '#000',
  },
  playerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      paddingTop: Platform.OS === 'ios' ? 48 : 24,
      backgroundColor: '#222',
  },
  playerTitle: {
      color: '#FFF',
      fontSize: 18,
      fontWeight: 'bold',
  }
});

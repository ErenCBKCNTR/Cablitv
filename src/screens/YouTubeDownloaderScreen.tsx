import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import ytdl from 'react-native-ytdl';

export const YouTubeDownloaderScreen = () => {
  const { colors } = useTheme() as any;
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [availableFormats, setAvailableFormats] = useState<any[]>([]);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const requestPermissions = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  };

  const fetchVideoInfo = async () => {
    if (!url.trim() || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
      Alert.alert('Hata', 'Lütfen geçerli bir YouTube linki giriniz.');
      return;
    }

    setIsFetchingInfo(true);
    setAvailableFormats([]);
    setVideoInfo(null);

    try {
      // Fetch all metadata like Tyrrrz's YoutubeExplode does
      const info = await ytdl.getInfo(url);

      setVideoInfo({
          title: info.videoDetails.title,
          author: info.videoDetails.author.name,
          lengthSeconds: info.videoDetails.lengthSeconds,
          thumbnailUrl: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1]?.url // Get highest quality thumbnail
      });

      const formats = info.formats;
      const videoOptions: any[] = [];

      const seenResolutions = new Set();

      // Filter for formats that contain BOTH video and audio natively (up to 720p usually on YouTube)
      // High-resolution formats (1080p+) often don't contain audio streams natively on YouTube (DASH formats).
      // Tyrrrz's app merges them with FFmpeg. Since we don't have FFmpeg in React Native, we offer the best
      // pre-muxed formats available to ensure the downloaded video has sound.
      formats.forEach((f: any) => {
          if (f.hasVideo && f.hasAudio && f.qualityLabel) {
              const res = f.qualityLabel;
              if (!seenResolutions.has(res)) {
                  seenResolutions.add(res);
                  videoOptions.push({
                      type: 'video',
                      resolution: res,
                      format_id: f.itag,
                      url: f.url,
                      ext: 'mp4' // Best compatible container
                  });
              }
          }
      });

      // Sort video options by highest resolution
      videoOptions.sort((a, b) => {
         const numA = parseInt(a.resolution);
         const numB = parseInt(b.resolution);
         return numB - numA;
      });

      // Find the best audio-only format
      const audioFormats = ytdl.filterFormats(formats, 'audioonly');
      if (audioFormats.length > 0) {
          // Sort by highest audio bitrate
          audioFormats.sort((a: any, b: any) => (b.audioBitrate || 0) - (a.audioBitrate || 0));
          videoOptions.push({
             type: 'audio',
             resolution: `Sadece Ses (${audioFormats[0].audioBitrate}kbps MP3)`,
             format_id: audioFormats[0].itag,
             url: audioFormats[0].url,
             ext: 'mp3'
          });
      }

      setAvailableFormats(videoOptions);

    } catch (e) {
      console.error("Info Fetch Error", e);
      Alert.alert('Hata', 'Video bilgileri alınamadı. Link hatalı veya video kısıtlı olabilir.');
    } finally {
      setIsFetchingInfo(false);
    }
  };

  const formatDuration = (secondsStr: string) => {
      if (!secondsStr) return "Bilinmiyor";
      const totalSeconds = parseInt(secondsStr, 10);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const pad = (num: number) => num.toString().padStart(2, '0');

      if (hours > 0) {
          return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
      }
      return `${pad(minutes)}:${pad(seconds)}`;
  };

  const handleDownloadFormat = async (formatOption: any) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Hata', 'Dosya kaydetmek için depolama erişim izni gereklidir.');
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      // In rare cases where signature deciphering throws an error at download time, we fetch the fresh URL again using the format ID
      let realDownloadUrl = formatOption.url;

      const safeTitle = videoInfo?.title.replace(/[^a-zA-Z0-9\u011E\u011F\u0130\u0131\u015E\u015F\u00D6\u00F6\u00C7\u00E7\u00DC\u00FC\s]/g, '_').substring(0, 40) || 'Video';
      const fileUri = FileSystem.documentDirectory + `${safeTitle}_${Date.now()}.${formatOption.ext}`;

      const downloadResumable = FileSystem.createDownloadResumable(
        realDownloadUrl,
        fileUri,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          setDownloadProgress(progress);
        }
      );

      const downloadResult = await downloadResumable.downloadAsync();

      if (downloadResult && downloadResult.uri) {
         const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
         await MediaLibrary.createAlbumAsync('MediaApp İndirilenler', asset, false);
         Alert.alert('Başarılı', `"${safeTitle}" başarıyla indirildi ve "İndirilen Dosyalar" klasörüne eklendi.`);

         // Reset state
         setUrl('');
         setAvailableFormats([]);
         setVideoInfo(null);
      } else {
         throw new Error("Dosya kaydedilemedi.");
      }

    } catch (error) {
       console.error(error);
       Alert.alert('Hata', 'İndirme işlemi sırasında bir hata oluştu. Bağlantı zaman aşımına uğramış olabilir.');
    } finally {
       setIsDownloading(false);
       setDownloadProgress(0);
    }
  };

  return (
    <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerIconContainer}>
             <Ionicons name="logo-youtube" size={80} color="#FF0000" />
             <Text style={[styles.title, { color: colors.text }]}>YouTube Gelişmiş İndirici</Text>
             <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Müzik ve Videoları Cihazınıza Kaydedin</Text>
        </View>

        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="link" size={24} color={colors.icon} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Örn: https://youtu.be/NXthCwi4YQ8"
            placeholderTextColor={colors.textSecondary}
            value={url}
            onChangeText={(text) => {
               setUrl(text);
               if(availableFormats.length > 0) {
                   setAvailableFormats([]);
                   setVideoInfo(null);
               }
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {!isDownloading && availableFormats.length === 0 && (
            <TouchableOpacity
                style={[styles.downloadButton, { backgroundColor: colors.primary }]}
                onPress={fetchVideoInfo}
                disabled={isFetchingInfo || url.length < 5}
            >
                {isFetchingInfo ? (
                   <View style={styles.loadingRow}>
                     <ActivityIndicator color="#FFF" />
                     <Text style={styles.progressText}>Video Bilgileri Alınıyor...</Text>
                   </View>
                ) : (
                   <>
                     <Ionicons name="search" size={24} color="#FFF" style={{marginRight: 8}} />
                     <Text style={styles.downloadButtonText}>Video Bilgilerini Bul</Text>
                   </>
                )}
            </TouchableOpacity>
        )}

        {isDownloading && (
           <View style={[styles.downloadingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
               <ActivityIndicator color={colors.primary} size="large" />
               <Text style={[styles.progressTextDark, { color: colors.text }]}>İndiriliyor: {Math.round(downloadProgress * 100)}%</Text>
           </View>
        )}

        {videoInfo && !isDownloading && (
            <View style={[styles.videoInfoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {videoInfo.thumbnailUrl && (
                    <Image source={{ uri: videoInfo.thumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />
                )}
                <View style={styles.videoDetails}>
                    <Text style={[styles.videoTitle, { color: colors.text }]} numberOfLines={2}>{videoInfo.title}</Text>
                    <Text style={[styles.videoAuthor, { color: colors.textSecondary }]} numberOfLines={1}>{videoInfo.author}</Text>
                    <Text style={[styles.videoDuration, { color: colors.textSecondary }]}>Süre: {formatDuration(videoInfo.lengthSeconds)}</Text>
                </View>
            </View>
        )}

        {availableFormats.length > 0 && !isDownloading && (
            <View style={[styles.optionsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.optionsTitle, { color: colors.text }]}>İndirme Formatını Seçin</Text>

                {availableFormats.map((option, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[styles.optionItem, { borderBottomColor: colors.border }]}
                        onPress={() => handleDownloadFormat(option)}
                    >
                        <Ionicons
                           name={option.type === 'video' ? "videocam-outline" : "musical-notes-outline"}
                           size={28}
                           color={colors.primary}
                        />
                        <View style={{marginLeft: 16, flex: 1}}>
                            <Text style={[styles.optionText, { color: colors.text }]}>
                                {option.resolution} {option.type === 'video' ? '(Video + Ses)' : ''}
                            </Text>
                            <Text style={{color: colors.textSecondary, fontSize: 12, marginTop: 4}}>Format: {option.ext.toUpperCase()}</Text>
                        </View>
                        <View style={styles.downloadIconWrapper}>
                           <Ionicons name="download" size={20} color="#FFF" />
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  headerIconContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginTop: 16,
      textAlign: 'center',
  },
  subtitle: {
      fontSize: 14,
      marginTop: 8,
      textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 24,
  },
  inputIcon: {
      marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  downloadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: 56,
      borderRadius: 12,
  },
  downloadButtonText: {
      color: '#FFF',
      fontSize: 18,
      fontWeight: 'bold',
  },
  loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  progressText: {
      color: '#FFF',
      marginLeft: 12,
      fontWeight: 'bold',
      fontSize: 16,
  },
  progressTextDark: {
      marginTop: 16,
      fontWeight: 'bold',
      fontSize: 18,
  },
  downloadingCard: {
      width: '100%',
      padding: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      borderWidth: 1,
      elevation: 2,
  },
  videoInfoCard: {
      width: '100%',
      borderRadius: 12,
      borderWidth: 1,
      overflow: 'hidden',
      marginBottom: 24,
      elevation: 2,
  },
  thumbnail: {
      width: '100%',
      height: 200,
  },
  videoDetails: {
      padding: 16,
  },
  videoTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
  },
  videoAuthor: {
      fontSize: 14,
      marginBottom: 4,
  },
  videoDuration: {
      fontSize: 14,
      fontWeight: '500',
  },
  optionsContainer: {
      width: '100%',
      borderRadius: 12,
      borderWidth: 1,
      padding: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
  },
  optionsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
  },
  optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
  },
  optionText: {
      fontSize: 16,
      fontWeight: 'bold',
  },
  downloadIconWrapper: {
      backgroundColor: '#007BFF', // Primary action color
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
  }
});

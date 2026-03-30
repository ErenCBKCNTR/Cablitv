import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import ytdl from 'react-native-ytdl';

export const YouTubeDownloaderScreen = () => {
  const { colors } = useTheme() as any;
  const [url, setUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
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
    setVideoTitle('');

    try {
      // Equivalent to yt_dlp extract_info(url, download=False)
      const info = await ytdl.getInfo(url);
      setVideoTitle(info.videoDetails.title);

      // Filter formats similar to python script
      const formats = info.formats;
      const videoOptions: any[] = [];

      // We want to show distinct resolutions that have video
      const seenResolutions = new Set();

      formats.forEach((f: any) => {
          if (f.hasVideo && f.qualityLabel) {
              const res = f.qualityLabel;
              if (!seenResolutions.has(res)) {
                  seenResolutions.add(res);
                  videoOptions.push({
                      type: 'video',
                      resolution: res,
                      format_id: f.itag,
                      url: f.url,
                      ext: f.container || 'mp4'
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
          videoOptions.push({
             type: 'audio',
             resolution: 'Sadece Ses (MP3)',
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

  const handleDownloadFormat = async (formatOption: any) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Hata', 'Dosya kaydetmek için galeri erişim izni gereklidir.');
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const realDownloadUrl = formatOption.url;
      const safeTitle = videoTitle.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
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
         Alert.alert('Başarılı', `Video/Ses başarıyla indirildi ve "İndirilen Dosyalar" klasörüne eklendi.`);

         // Reset state
         setUrl('');
         setAvailableFormats([]);
         setVideoTitle('');
      } else {
         throw new Error("Dosya kaydedilemedi.");
      }

    } catch (error) {
       console.error(error);
       Alert.alert('Hata', 'İndirme işlemi sırasında bir hata oluştu. Lütfen bağlantınızı kontrol edin.');
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
             <Text style={[styles.title, { color: colors.text }]}>YouTube İndirici</Text>
             <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sınırsız Video ve Ses İndirici</Text>
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
               if(availableFormats.length > 0) setAvailableFormats([]); // clear options on new url
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
                     <Text style={styles.progressText}>Bilgiler Alınıyor...</Text>
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

        {availableFormats.length > 0 && !isDownloading && (
            <View style={[styles.optionsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.optionsTitle, { color: colors.text }]} numberOfLines={2}>
                    {videoTitle}
                </Text>
                <Text style={[styles.optionsSubtitle, { color: colors.textSecondary }]}>İndirmek istediğiniz kaliteyi seçin:</Text>

                {availableFormats.map((option, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[styles.optionItem, { borderBottomColor: colors.border }]}
                        onPress={() => handleDownloadFormat(option)}
                    >
                        <Ionicons
                           name={option.type === 'video' ? "videocam-outline" : "musical-notes-outline"}
                           size={24}
                           color={colors.text}
                        />
                        <View style={{marginLeft: 16, flex: 1}}>
                            <Text style={[styles.optionText, { color: colors.text }]}>
                                {option.resolution} {option.type === 'video' ? '(Video)' : ''}
                            </Text>
                        </View>
                        <Ionicons name="download-outline" size={24} color={colors.primary} />
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
  optionsContainer: {
      width: '100%',
      marginTop: 16,
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
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8,
      textAlign: 'center',
  },
  optionsSubtitle: {
      fontSize: 14,
      marginBottom: 16,
      textAlign: 'center',
  },
  optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
  },
  optionText: {
      fontSize: 16,
      fontWeight: '500',
  }
});

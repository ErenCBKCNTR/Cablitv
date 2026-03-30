import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, Alert,
    KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
    Modal, Animated, Easing
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

// Inspired by "Seal" (JunkFood02) - A modern Material You Design approach
export const YouTubeDownloaderScreen = () => {
  const { colors } = useTheme() as any;
  const webViewRef = useRef<WebView>(null);

  const [url, setUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // State for the "Seal" style bottom sheet modal
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [mediaInfo, setMediaInfo] = useState<any>(null); // To store title if we had an advanced scraper
  const [selectedFormat, setSelectedFormat] = useState<'video' | 'audio'>('video');
  const [selectedQuality, setSelectedQuality] = useState<'max' | '1080' | '720'>('1080');

  // Use a reliable open-source instance for extraction logic (like Cobalt API) but we
  // run the fetch *inside* the WebView to bypass any strict CORS or App-Agent blocks.
  // The WebView acts purely as a headless background worker.
  const EXTRACTOR_URL = 'https://cobalt.tools/';

  const requestPermissions = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  };

  const handleFetchClick = () => {
      if (!url.trim() || !url.startsWith('http')) {
          Alert.alert('Hata', 'Lütfen geçerli bir video veya ses bağlantısı girin.');
          return;
      }
      // "Seal" supports many platforms, so we just check if it's a URL.
      setShowFormatModal(true);
  };

  const executeDownload = async () => {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
          Alert.alert('Hata', 'Dosya kaydetmek için depolama izni gereklidir.');
          setShowFormatModal(false);
          return;
      }

      setShowFormatModal(false);
      setIsFetching(true);

      // Instruct our headless WebView to perform the extraction request
      const payload = {
          type: 'REQUEST_DOWNLOAD',
          url: url,
          isAudio: selectedFormat === 'audio',
          quality: selectedQuality
      };

      webViewRef.current?.injectJavaScript(`
          try {
              // We simulate what Cobalt's web UI does to get the direct API token/response
              // Because public API endpoints change their headers/auth often.

              const requestUrl = '${url}';
              const isAudio = ${selectedFormat === 'audio'};
              const vQuality = '${selectedQuality}';

              fetch('https://api.cobalt.tools/api/json', {
                  method: 'POST',
                  headers: {
                      'Accept': 'application/json',
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                      url: requestUrl,
                      isAudioOnly: isAudio,
                      aFormat: isAudio ? "mp3" : "best",
                      vQuality: vQuality === 'max' ? 'max' : vQuality,
                      filenamePattern: "nerdy"
                  })
              })
              .then(res => res.json())
              .then(data => {
                  if(data.status === 'error') {
                      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: data.text || 'API Error' }));
                  } else if(data.url) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SUCCESS', downloadUrl: data.url }));
                  } else {
                      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: 'Bağlantı bulunamadı.' }));
                  }
              })
              .catch(err => {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: err.toString() }));
              });
          } catch(e) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: e.toString() }));
          }
          true;
      `);
  };

  const handleWebViewMessage = async (event: any) => {
      try {
          const data = JSON.parse(event.nativeEvent.data);

          if (data.type === 'ERROR') {
              console.log("Extraction Error:", data.message);
              // Fallback to a robust backup API if the primary one (Cobalt) fails due to JWT/token changes.
              fallbackExtraction();
          } else if (data.type === 'SUCCESS') {
              startNativeDownload(data.downloadUrl);
          }
      } catch (e) {
          console.error("Message parse error", e);
          fallbackExtraction();
      }
  };

  const fallbackExtraction = async () => {
      console.log("Using fallback extraction method...");
      try {
          // This uses another known public API.
          const res = await fetch(\`https://api.akuari.my.id/downloader/yt?link=\${url}\`);
          const data = await res.json();

          if (selectedFormat === 'audio' && data?.data?.mp3) {
              startNativeDownload(data.data.mp3);
          } else if (data?.data?.mp4) {
              startNativeDownload(data.data.mp4);
          } else {
              throw new Error("Tüm bağlantı çıkarma yöntemleri başarısız oldu.");
          }
      } catch(e) {
          setIsFetching(false);
          Alert.alert('Hata', 'İndirme bağlantısı çıkarılamadı. Bu video kısıtlı olabilir veya servisler geçici olarak kullanım dışıdır.');
      }
  };

  const startNativeDownload = async (directUrl: string) => {
      setIsFetching(false);
      setIsDownloading(true);
      setDownloadProgress(0);

      try {
          const ext = selectedFormat === 'audio' ? 'mp3' : 'mp4';
          const fileUri = FileSystem.documentDirectory + \`Medya_\${Date.now()}.\${ext}\`;

          const downloadResumable = FileSystem.createDownloadResumable(
            directUrl,
            fileUri,
            {},
            (progressEvent) => {
              const progress = progressEvent.totalBytesWritten / progressEvent.totalBytesExpectedToWrite;
              setDownloadProgress(progress);
            }
          );

          const downloadResult = await downloadResumable.downloadAsync();

          if (downloadResult && downloadResult.uri) {
             const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
             await MediaLibrary.createAlbumAsync('Seal İndirilenler', asset, false);
             Alert.alert('Başarılı', \`Medya başarıyla indirildi ve "İndirilen Dosyalar" bölümüne kaydedildi.\`);
             setUrl('');
          } else {
             throw new Error("Dosya kaydedilemedi.");
          }
      } catch (error) {
           console.error(error);
           Alert.alert('İndirme Hatası', 'Dosya indirilirken bağlantı koptu veya hata oluştu.');
      } finally {
           setIsDownloading(false);
           setDownloadProgress(0);
      }
  };

  // Seal-inspired Material You colors (Dynamic if possible, static here for consistency)
  const sealColors = {
      primaryContainer: isThemeDark(colors.background) ? '#381E72' : '#FFD8E4',
      onPrimaryContainer: isThemeDark(colors.background) ? '#EADDFF' : '#31111D',
      secondaryContainer: isThemeDark(colors.background) ? '#4A4458' : '#E8DEF8',
      onSecondaryContainer: isThemeDark(colors.background) ? '#E8DEF8' : '#1D192B',
      surfaceVariant: isThemeDark(colors.background) ? '#49454F' : '#E7E0EC',
  };

  function isThemeDark(bgStr: string) {
      return bgStr.includes('12') || bgStr.includes('000');
  }

  return (
    <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Hidden Webview acts as our robust backend API engine, bypassing native library limitations */}
      <WebView
        ref={webViewRef}
        source={{ uri: EXTRACTOR_URL }}
        style={{ width: 0, height: 0, opacity: 0 }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleWebViewMessage}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Seal-like Header */}
        <View style={styles.headerIconContainer}>
             <View style={[styles.iconCircle, { backgroundColor: sealColors.primaryContainer }]}>
                <Ionicons name="download" size={48} color={sealColors.onPrimaryContainer} />
             </View>
             <Text style={[styles.title, { color: colors.text }]}>Medya İndirici</Text>
             <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                 YouTube, Twitter, Instagram ve diğerleri.
             </Text>
        </View>

        {/* Material You Input */}
        <View style={[styles.inputWrapper, { backgroundColor: sealColors.surfaceVariant }]}>
          <Ionicons name="link-outline" size={24} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Bağlantıyı (URL) buraya yapıştırın..."
            placeholderTextColor={colors.textSecondary}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            multiline={false}
          />
          {url.length > 0 && (
             <TouchableOpacity onPress={() => setUrl('')}>
                 <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
             </TouchableOpacity>
          )}
        </View>

        {/* Download FAB (Floating Action Button) style */}
        <TouchableOpacity
            style={[
                styles.fab,
                {
                    backgroundColor: (url.length < 5 || isFetching || isDownloading) ? colors.border : sealColors.primaryContainer,
                    opacity: (url.length < 5 || isFetching || isDownloading) ? 0.6 : 1
                }
            ]}
            onPress={handleFetchClick}
            disabled={url.length < 5 || isFetching || isDownloading}
        >
            <Ionicons name="arrow-down" size={28} color={(url.length < 5 || isFetching || isDownloading) ? colors.textSecondary : sealColors.onPrimaryContainer} />
        </TouchableOpacity>

        {/* Progress UI */}
        {(isFetching || isDownloading) && (
           <View style={[styles.progressCard, { backgroundColor: sealColors.secondaryContainer }]}>
               <ActivityIndicator color={sealColors.onSecondaryContainer} size="large" />
               <Text style={[styles.progressText, { color: sealColors.onSecondaryContainer }]}>
                   {isFetching ? "Bağlantı Çözümleniyor..." : \`İndiriliyor: \${Math.round(downloadProgress * 100)}%\`}
               </Text>
               {isDownloading && (
                   <View style={styles.progressBarBg}>
                       <View style={[styles.progressBarFill, { backgroundColor: sealColors.onSecondaryContainer, width: \`\${Math.round(downloadProgress * 100)}%\` }]} />
                   </View>
               )}
           </View>
        )}
      </ScrollView>

      {/* Seal-style Format Selection Bottom Sheet */}
      <Modal
         visible={showFormatModal}
         transparent={true}
         animationType="slide"
         onRequestClose={() => setShowFormatModal(false)}
      >
          <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                  <View style={styles.modalDragHandle} />

                  <Text style={[styles.modalTitle, { color: colors.text }]}>İndirme Ayarları</Text>

                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Format</Text>
                  <View style={styles.chipRow}>
                      <TouchableOpacity
                          style={[styles.chip, selectedFormat === 'video' ? {backgroundColor: sealColors.primaryContainer} : {backgroundColor: sealColors.surfaceVariant}]}
                          onPress={() => setSelectedFormat('video')}
                      >
                          <Ionicons name="videocam" size={20} color={selectedFormat === 'video' ? sealColors.onPrimaryContainer : colors.text} />
                          <Text style={[styles.chipText, { color: selectedFormat === 'video' ? sealColors.onPrimaryContainer : colors.text }]}>Video</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                          style={[styles.chip, selectedFormat === 'audio' ? {backgroundColor: sealColors.primaryContainer} : {backgroundColor: sealColors.surfaceVariant}]}
                          onPress={() => setSelectedFormat('audio')}
                      >
                          <Ionicons name="musical-notes" size={20} color={selectedFormat === 'audio' ? sealColors.onPrimaryContainer : colors.text} />
                          <Text style={[styles.chipText, { color: selectedFormat === 'audio' ? sealColors.onPrimaryContainer : colors.text }]}>Ses (Audio)</Text>
                      </TouchableOpacity>
                  </View>

                  {selectedFormat === 'video' && (
                     <>
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 16 }]}>Kalite (Video)</Text>
                        <View style={styles.chipRow}>
                            <TouchableOpacity
                                style={[styles.chip, selectedQuality === 'max' ? {backgroundColor: sealColors.primaryContainer} : {backgroundColor: sealColors.surfaceVariant}]}
                                onPress={() => setSelectedQuality('max')}
                            >
                                <Text style={[styles.chipText, { color: selectedQuality === 'max' ? sealColors.onPrimaryContainer : colors.text }]}>Maksimum (4K+)</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.chip, selectedQuality === '1080' ? {backgroundColor: sealColors.primaryContainer} : {backgroundColor: sealColors.surfaceVariant}]}
                                onPress={() => setSelectedQuality('1080')}
                            >
                                <Text style={[styles.chipText, { color: selectedQuality === '1080' ? sealColors.onPrimaryContainer : colors.text }]}>1080p</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.chip, selectedQuality === '720' ? {backgroundColor: sealColors.primaryContainer} : {backgroundColor: sealColors.surfaceVariant}]}
                                onPress={() => setSelectedQuality('720')}
                            >
                                <Text style={[styles.chipText, { color: selectedQuality === '720' ? sealColors.onPrimaryContainer : colors.text }]}>720p</Text>
                            </TouchableOpacity>
                        </View>
                     </>
                  )}

                  <TouchableOpacity
                      style={[styles.confirmButton, { backgroundColor: sealColors.primaryContainer }]}
                      onPress={executeDownload}
                  >
                      <Ionicons name="download" size={24} color={sealColors.onPrimaryContainer} style={{marginRight: 8}} />
                      <Text style={[styles.confirmButtonText, { color: sealColors.onPrimaryContainer }]}>İndirmeyi Başlat</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

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
    marginBottom: 48,
    marginTop: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
      fontSize: 28,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
  },
  subtitle: {
      fontSize: 16,
      textAlign: 'center',
      opacity: 0.8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: 28, // Heavy rounded corners like Material 3
    paddingHorizontal: 20,
    height: 72,
    marginBottom: 32,
  },
  inputIcon: {
      marginRight: 16,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  fab: {
      width: 80,
      height: 80,
      borderRadius: 24, // Squircle shape
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
  },
  progressCard: {
      width: '100%',
      marginTop: 40,
      padding: 24,
      borderRadius: 24,
      alignItems: 'center',
  },
  progressText: {
      marginTop: 16,
      fontSize: 16,
      fontWeight: '600',
  },
  progressBarBg: {
      width: '100%',
      height: 8,
      backgroundColor: 'rgba(0,0,0,0.1)',
      borderRadius: 4,
      marginTop: 16,
      overflow: 'hidden',
  },
  progressBarFill: {
      height: '100%',
      borderRadius: 4,
  },
  // Modal Styles (Bottom Sheet)
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
  },
  modalContent: {
      width: '100%',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 24,
      paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalDragHandle: {
      width: 40,
      height: 4,
      backgroundColor: '#CCC',
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 24,
  },
  modalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      marginBottom: 24,
  },
  sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 12,
      textTransform: 'uppercase',
  },
  chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 24,
  },
  chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 24,
      marginRight: 12,
      marginBottom: 12,
  },
  chipText: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
  },
  confirmButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: 64,
      borderRadius: 32,
      marginTop: 16,
  },
  confirmButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
  }
});

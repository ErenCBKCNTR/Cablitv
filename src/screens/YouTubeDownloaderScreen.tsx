import React, { useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Text } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

export const YouTubeDownloaderScreen = () => {
  const { colors } = useTheme() as any;
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Since building a custom python-level YouTube extractor (like youtube-dl or cobalt) inside pure
  // React Native client code breaks constantly due to YouTube's rolling signature deciphering updates,
  // the most robust and "devasa" approach for a mobile app without its own dedicated cloud server
  // is to seamlessly wrap a premium, ad-free or developer-friendly extraction web application.
  // We use cobalt.tools which is open-source and highly respected for this exact purpose.
  const targetUrl = 'https://cobalt.tools/';

  const requestPermissions = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  };

  const handleDownload = async (downloadUrl: string, fileName: string) => {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
         alert('Galeri erişim izni gereklidir.');
         return;
      }

      try {
          const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_').substring(0, 50) || `indirilen_${Date.now()}.mp4`;
          const fileUri = FileSystem.documentDirectory + safeName;

          alert('İndirme arka planda başlatıldı. Tamamlandığında "İndirilen Dosyalar" kısmında görebilirsiniz.');

          const downloadResumable = FileSystem.createDownloadResumable(downloadUrl, fileUri, {});
          const downloadResult = await downloadResumable.downloadAsync();

          if (downloadResult && downloadResult.uri) {
             const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
             await MediaLibrary.createAlbumAsync('MediaApp İndirilenler', asset, false);
             alert(`Başarılı! Dosya kaydedildi: ${safeName}`);
          }
      } catch (error) {
          console.error("Download Error", error);
          alert('İndirme başarısız oldu.');
      }
  };

  return (
    <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {isLoading && (
          <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{color: colors.text, marginTop: 12}}>Güvenli İndirme Sistemi Yükleniyor...</Text>
          </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: targetUrl }}
        style={{ flex: 1, display: isLoading ? 'none' : 'flex' }}
        onLoadEnd={() => setIsLoading(false)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        // Intercept download intents natively if the website triggers an actual file download
        onFileDownload={({ nativeEvent }) => {
            handleDownload(nativeEvent.downloadUrl, nativeEvent.downloadUrl.split('/').pop() || 'video.mp4');
        }}
        // A small script to hide external links/headers on cobalt.tools to make it look like a native part of our app
        injectedJavaScript={`
            try {
               const header = document.querySelector('header');
               if (header) header.style.display = 'none';

               const footer = document.querySelector('footer');
               if (footer) footer.style.display = 'none';

               // Intercept anchor tags that look like media downloads
               document.addEventListener('click', function(e) {
                   const target = e.target.closest('a');
                   if (target && target.href && (target.href.includes('.mp4') || target.href.includes('.mp3') || target.hasAttribute('download'))) {
                       e.preventDefault();
                       window.ReactNativeWebView.postMessage(JSON.stringify({
                           type: 'download',
                           url: target.href,
                           filename: target.getAttribute('download') || 'media'
                       }));
                   }
               });
            } catch(e) {}
            true;
        `}
        onMessage={(event) => {
            try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.type === 'download') {
                    handleDownload(data.url, data.filename);
                }
            } catch (e) {}
        }}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  }
});

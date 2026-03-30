import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export const YouTubeDownloaderScreen = () => {
  const { colors } = useTheme() as any;
  const [url, setUrl] = useState('');
  const [showOptions, setShowOptions] = useState(false);

  const handleDownload = () => {
    if (!url.trim() || !url.includes('youtube.com') && !url.includes('youtu.be')) {
      Alert.alert('Hata', 'Lütfen geçerli bir YouTube linki giriniz.');
      return;
    }
    setShowOptions(true);
  };

  const handleOptionSelect = (option: string) => {
      setShowOptions(false);
      Alert.alert('İndiriliyor', `${option} formatında indirme işlemi başlatıldı (Mock).`);
      setUrl('');
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
        </View>

        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="link" size={24} color={colors.icon} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="YouTube Linki Yapıştırın..."
            placeholderTextColor={colors.textSecondary}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity
            style={[styles.downloadButton, { backgroundColor: colors.primary }]}
            onPress={handleDownload}
        >
            <Ionicons name="download-outline" size={24} color="#FFF" style={{marginRight: 8}} />
            <Text style={styles.downloadButtonText}>İndir</Text>
        </TouchableOpacity>

        {showOptions && (
            <View style={[styles.optionsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.optionsTitle, { color: colors.text }]}>İndirme Seçenekleri</Text>

                <TouchableOpacity style={[styles.optionItem, { borderBottomColor: colors.border }]} onPress={() => handleOptionSelect('MP4 1080p')}>
                    <Ionicons name="videocam-outline" size={24} color={colors.text} />
                    <Text style={[styles.optionText, { color: colors.text }]}>Video (MP4) - 1080p HD</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.optionItem, { borderBottomColor: colors.border }]} onPress={() => handleOptionSelect('MP4 720p')}>
                    <Ionicons name="videocam-outline" size={24} color={colors.text} />
                    <Text style={[styles.optionText, { color: colors.text }]}>Video (MP4) - 720p</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem} onPress={() => handleOptionSelect('MP3 Yüksek Kalite')}>
                    <Ionicons name="musical-notes-outline" size={24} color={colors.text} />
                    <Text style={[styles.optionText, { color: colors.text }]}>Ses (MP3) - Yüksek Kalite</Text>
                </TouchableOpacity>
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
  optionsContainer: {
      width: '100%',
      marginTop: 32,
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
      marginLeft: 16,
  }
});

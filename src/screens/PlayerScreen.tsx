import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, useTheme } from '@react-navigation/native';
import { Video, ResizeMode, AVPlaybackStatus, Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Channel } from '../constants/channels';

export const PlayerScreen = () => {
  const route = useRoute() as any;
  const navigation = useNavigation() as any;
  const { colors } = useTheme() as any;
  const channel: Channel = route.params?.channel;

  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Ensure audio plays even if the device is on silent mode (important for radio)
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
      } catch (e) {
        console.error("Audio config error:", e);
      }
    };
    setupAudio();

    if (!channel) {
      navigation.goBack();
    }
  }, [channel, navigation]);

  if (!channel) return null;

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <View style={[styles.header, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {channel.name}
        </Text>
        <View style={{ width: 28 }} /> {/* Placeholder for balance */}
      </View>

      <View style={styles.playerWrapper}>
        {isLoading && !errorMsg && (
          <View style={styles.loadingContainer}>
             <ActivityIndicator size="large" color={colors.primary} />
             <Text style={styles.loadingText}>Yükleniyor...</Text>
          </View>
        )}
        {errorMsg ? (
           <View style={styles.loadingContainer}>
              <Ionicons name="warning-outline" size={48} color={colors.error} />
              <Text style={styles.errorText}>{errorMsg}</Text>
           </View>
        ) : null}

        <Video
          ref={videoRef}
          style={styles.video}
          source={{ uri: channel.streamUrl }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping={false}
          onPlaybackStatusUpdate={(status) => {
             setStatus(status);
             if (status.isLoaded) {
                 setIsLoading(false);
             } else if (status.error) {
                 setIsLoading(false);
                 setErrorMsg("Medya oynatılamadı. Link bozuk olabilir.");
             }
          }}
          onError={(error) => {
              console.error("Video Error:", error);
              setIsLoading(false);
              setErrorMsg("Bağlantı hatası.");
          }}
          shouldPlay
        />

        {channel.type === 'radio' && !isLoading && !errorMsg && (
            <View style={[styles.overlay, { backgroundColor: '#111' }]} pointerEvents="none">
               <Ionicons name="radio" size={100} color={colors.primary} />
               <Text style={styles.radioText}>{channel.name} Dinleniyor</Text>
               <View style={styles.waveAnimation}>
                  {/* Just a static representation for now, could use Reanimated for real waves */}
                  <Ionicons name="pulse" size={40} color={colors.primary} />
               </View>
            </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48, // Safe area approx
    paddingBottom: 16,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
  },
  playerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%', // Take full screen
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    zIndex: 1,
  },
  loadingText: {
    color: '#FFF',
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: '#FF6B6B',
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  radioText: {
    color: '#FFF',
    fontSize: 20,
    marginTop: 24,
    fontWeight: '500',
  },
  waveAnimation: {
    marginTop: 20,
  }
});

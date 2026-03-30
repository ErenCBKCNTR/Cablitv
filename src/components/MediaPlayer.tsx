import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Channel } from '../constants/channels';
import { Ionicons } from '@expo/vector-icons';

interface MediaPlayerProps {
  channel: Channel | null;
  onClose: () => void;
  colors: any;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({ channel, onClose, colors }) => {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // When a new channel is selected, start loading
  useEffect(() => {
    if (channel) {
      setIsLoading(true);
    }
  }, [channel]);

  if (!channel) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={[styles.headerTitle, { color: '#FFF' }]} numberOfLines={1}>
          Playing: {channel.name}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close-circle" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.playerContainer}>
        {isLoading && (
          <View style={styles.loadingContainer}>
             <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
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
             }
          }}
          onError={(error) => {
              console.error("Video Error:", error);
              setIsLoading(false);
          }}
          shouldPlay // auto play when loaded
        />
        {/* If it's a radio, we might want to overlay a logo since there's no video feed */}
        {channel.type === 'radio' && !isLoading && (
            <View style={[styles.overlay, { backgroundColor: colors.surface }]} pointerEvents="none">
               <Ionicons name="radio" size={80} color={colors.primary} />
            </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 300, // Fixed height for the inline player
    borderTopWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    marginLeft: 16,
  },
  playerContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  video: {
    flex: 1,
    width: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0, // Behind controls if any
  }
});

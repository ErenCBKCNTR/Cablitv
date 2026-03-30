import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Channel } from '../constants/channels';

interface ChannelItemProps {
  channel: Channel;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
  colors: any;
}

export const ChannelItem: React.FC<ChannelItemProps> = ({
  channel,
  isFavorite,
  onPress,
  onToggleFavorite,
  colors,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {channel.logoUrl ? (
          <Image
            source={{ uri: channel.logoUrl }}
            style={styles.logo}
            resizeMode="contain"
          />
        ) : (
          <Ionicons
            name={channel.type === 'radio' ? 'radio-outline' : 'tv-outline'}
            size={40}
            color={colors.icon}
          />
        )}
      </View>
      <View style={styles.infoContainer}>
        <Text
          style={[styles.nameText, { color: colors.text }]}
          numberOfLines={2}
        >
          {channel.name}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={onToggleFavorite}
      >
        <Ionicons
          name={isFavorite ? 'star' : 'star-outline'}
          size={24}
          color={isFavorite ? colors.starOn : colors.starOff}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '30%', // Makes them smaller, fitting 3 in a row
    margin: '1.6%', // Tighter margins
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 2, // Lighter shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    aspectRatio: 1, // Keep it square
  },
  imageContainer: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.02)', // slight tint for contrast if logos have transparent bg
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  nameText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    padding: 4,
  },
});

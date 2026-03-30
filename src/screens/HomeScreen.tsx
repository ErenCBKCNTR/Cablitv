import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { CHANNELS } from '../constants/channels';

export const HomeScreen = () => {
  const navigation = useNavigation() as any;
  const { colors } = useTheme() as any;

  const featuredRadios = CHANNELS.filter(c => c.type === 'radio').slice(0, 4);
  const featuredTvs = CHANNELS.filter(c => c.type === 'tv').slice(0, 4);

  const navigateTo = (screenName: string) => {
    navigation.navigate(screenName);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Hoş Geldiniz</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Yeni nesil medya deneyimine hazır olun.
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Hızlı Erişim</Text>
        </View>
        <View style={styles.quickAccessGrid}>
          <TouchableOpacity
            style={[styles.quickAccessCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigateTo('Canlı Radyo')}
          >
            <Ionicons name="radio" size={40} color={colors.primary} />
            <Text style={[styles.quickAccessText, { color: colors.text }]}>Canlı Radyo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAccessCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigateTo('Canlı TV')}
          >
            <Ionicons name="tv" size={40} color={colors.primary} />
            <Text style={[styles.quickAccessText, { color: colors.text }]}>Canlı TV</Text>
          </TouchableOpacity>

          <TouchableOpacity
             style={[styles.quickAccessCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
             onPress={() => navigateTo('YouTube İndirici')}
          >
            <Ionicons name="logo-youtube" size={40} color="#FF0000" />
            <Text style={[styles.quickAccessText, { color: colors.text }]}>YouTube İndirici</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Öne Çıkan TV Kanalları</Text>
            <TouchableOpacity onPress={() => navigateTo('Canlı TV')}>
               <Text style={{ color: colors.primary }}>Tümü</Text>
            </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {featuredTvs.map(channel => (
            <TouchableOpacity
                key={channel.id}
                style={[styles.featuredCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => navigateTo('Canlı TV')}
            >
                {channel.logoUrl ? (
                    <Image source={{ uri: channel.logoUrl }} style={styles.featuredLogo} resizeMode="contain" />
                ) : (
                    <Ionicons name="tv-outline" size={40} color={colors.icon} />
                )}
                <Text style={[styles.featuredText, { color: colors.text }]} numberOfLines={1}>{channel.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={[styles.section, { paddingBottom: 40 }]}>
        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Öne Çıkan Radyolar</Text>
            <TouchableOpacity onPress={() => navigateTo('Canlı Radyo')}>
               <Text style={{ color: colors.primary }}>Tümü</Text>
            </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {featuredRadios.map(channel => (
            <TouchableOpacity
                key={channel.id}
                style={[styles.featuredCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => navigateTo('Canlı Radyo')}
            >
                {channel.logoUrl ? (
                    <Image source={{ uri: channel.logoUrl }} style={styles.featuredLogo} resizeMode="contain" />
                ) : (
                    <Ionicons name="radio-outline" size={40} color={colors.icon} />
                )}
                <Text style={[styles.featuredText, { color: colors.text }]} numberOfLines={1}>{channel.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  quickAccessCard: {
    width: '46%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginHorizontal: '2%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickAccessText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  horizontalScroll: {
      paddingHorizontal: 16,
  },
  featuredCard: {
      width: 120,
      height: 120,
      borderRadius: 12,
      borderWidth: 1,
      marginRight: 16,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 8,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
  },
  featuredLogo: {
      width: '100%',
      height: 60,
      marginBottom: 8,
  },
  featuredText: {
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'center',
  }
});

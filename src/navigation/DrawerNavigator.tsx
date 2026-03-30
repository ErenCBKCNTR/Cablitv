import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { HomeScreen } from '../screens/HomeScreen';
import { LiveRadioScreen } from '../screens/LiveRadioScreen';
import { LiveTVScreen } from '../screens/LiveTVScreen';
import { YouTubeDownloaderScreen } from '../screens/YouTubeDownloaderScreen';
import { DownloadsScreen } from '../screens/DownloadsScreen';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, StyleSheet } from 'react-native';

const Drawer = createDrawerNavigator();

interface DrawerNavigatorProps {
  toggleTheme: () => void;
  isDarkTheme: boolean;
  colors: any;
}

export const DrawerNavigator: React.FC<DrawerNavigatorProps> = ({ toggleTheme, isDarkTheme, colors }) => {
  return (
    <Drawer.Navigator
      initialRouteName="Ana Sayfa"
      screenOptions={{
        headerRight: () => (
          <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
            <Ionicons
              name={isDarkTheme ? 'sunny' : 'moon'}
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        ),
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        drawerStyle: {
          backgroundColor: colors.surface,
        },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.text,
      }}
    >
      <Drawer.Screen
        name="Ana Sayfa"
        component={HomeScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Canlı Radyo"
        component={LiveRadioScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="radio-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Canlı TV"
        component={LiveTVScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="tv-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="YouTube İndirici"
        component={YouTubeDownloaderScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="logo-youtube" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="İndirilen Dosyalar"
        component={DownloadsScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="folder-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  themeToggle: {
    marginRight: 16,
  },
});

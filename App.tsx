import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from './src/constants/colors';
import { DrawerNavigator } from './src/navigation/DrawerNavigator';
import { createStackNavigator } from '@react-navigation/stack';
import { PlayerScreen } from './src/screens/PlayerScreen';

const Stack = createStackNavigator();

export default function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const themePref = await AsyncStorage.getItem('@theme_pref');
      if (themePref !== null) {
        setIsDarkTheme(themePref === 'dark');
      }
    } catch (e) {
      console.error('Failed to load theme preference', e);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    try {
      await AsyncStorage.setItem('@theme_pref', newTheme ? 'dark' : 'light');
    } catch (e) {
      console.error('Failed to save theme preference', e);
    }
  };

  const currentColors = isDarkTheme ? Colors.dark : Colors.light;

  const MyTheme = {
    ...(isDarkTheme ? NavigationDarkTheme : DefaultTheme),
    colors: {
      ...(isDarkTheme ? NavigationDarkTheme.colors : DefaultTheme.colors),
      primary: currentColors.primary,
      background: currentColors.background,
      card: currentColors.surface,
      text: currentColors.text,
      border: currentColors.border,
      // Custom colors we added
      surface: currentColors.surface,
      textSecondary: currentColors.textSecondary,
      icon: currentColors.icon,
      error: currentColors.error,
      starOn: currentColors.starOn,
      starOff: currentColors.starOff,
    },
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={MyTheme}>
        <StatusBar style={isDarkTheme ? 'light' : 'dark'} />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainDrawer">
            {(props) => <DrawerNavigator {...props} toggleTheme={toggleTheme} isDarkTheme={isDarkTheme} colors={currentColors} />}
          </Stack.Screen>
          <Stack.Screen name="PlayerScreen" component={PlayerScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

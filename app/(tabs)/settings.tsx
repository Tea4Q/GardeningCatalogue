import { View, Text, StyleSheet, Pressable, Switch, Alert, ActivityIndicator } from 'react-native';
import { Bell, Sun, Moon, CloudRain, LogOut } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { router } from 'expo-router';
import React, { useState } from 'react';

export default function SettingsScreen() {
  const { theme, colors, setTheme } = useTheme();
  const { signOut } = useAuth();
  const [notifications] = useState({
    plantingReminders: false,
    weatherAlerts: false,
  });
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleThemeChange = (selectedTheme: 'light' | 'dark') => {
    setTheme(selectedTheme);
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSigningOut(true);
              await signOut();
              router.replace('/auth');
            } catch (err) {
              console.error('Sign out error:', err);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.headerText }]}>Settings</Text>
      </View>

      <View style={[styles.section, { borderBottomColor: colors.border }, styles.disabledSection]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Notifications</Text>
          <Text style={[styles.comingSoonLabel, { color: colors.textSecondary }]}>Coming Soon</Text>
        </View>
        <View style={[styles.setting, styles.disabledSetting]}>
          <View style={styles.settingInfo}>
            <Bell size={24} color={colors.textSecondary} />
            <Text style={[styles.settingText, { color: colors.textSecondary }]}>Planting Reminders</Text>
          </View>
          <Switch
            value={notifications.plantingReminders}
            onValueChange={() => {}} // Disabled
            trackColor={{ false: colors.border, true: colors.textSecondary }}
            thumbColor={colors.textSecondary}
            ios_backgroundColor={colors.border}
            disabled={true}
          />
        </View>
        <View style={[styles.setting, styles.disabledSetting]}>
          <View style={styles.settingInfo}>
            <CloudRain size={24} color={colors.textSecondary} />
            <Text style={[styles.settingText, { color: colors.textSecondary }]}>Weather Alerts</Text>
          </View>
          <Switch
            value={notifications.weatherAlerts}
            onValueChange={() => {}} // Disabled
            trackColor={{ false: colors.border, true: colors.textSecondary }}
            thumbColor={colors.textSecondary}
            ios_backgroundColor={colors.border}
            disabled={true}
          />
        </View>
      </View>

      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <Sun size={24} color={colors.icon} />
            <Text style={[styles.settingText, { color: colors.textSecondary }]}>Light Mode</Text>
          </View>
          <Pressable 
            style={[
              styles.themeButton, 
              { backgroundColor: colors.surface },
              theme === 'light' && [styles.activeTheme, { backgroundColor: colors.primary }]
            ]}
            onPress={() => handleThemeChange('light')}
          >
            <Text style={[
              styles.themeButtonText, 
              { color: theme === 'light' ? colors.primaryText : colors.text }
            ]}>
              {theme === 'light' ? 'On' : 'Off'}
            </Text>
          </Pressable>
        </View>
        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <Moon size={24} color={colors.icon} />
            <Text style={[styles.settingText, { color: colors.textSecondary }]}>Dark Mode</Text>
          </View>
          <Pressable 
            style={[
              styles.themeButton, 
              { backgroundColor: colors.surface },
              theme === 'dark' && [styles.activeTheme, { backgroundColor: colors.primary }]
            ]}
            onPress={() => handleThemeChange('dark')}
          >
            <Text style={[
              styles.themeButtonText, 
              { color: theme === 'dark' ? colors.primaryText : colors.text }
            ]}>
              {theme === 'dark' ? 'On' : 'Off'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
        <Text style={[styles.version, { color: colors.textSecondary }]}>Version 1.0.0</Text>
      </View>

      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
        <Pressable 
          style={({ pressed }) => [
            styles.setting, 
            styles.signOutButton,
            pressed && { backgroundColor: colors.surface, opacity: 0.7 }
          ]}
          onPress={() => {
            handleSignOut();
          }}
          disabled={isSigningOut}
          android_ripple={{ color: colors.error + '20' }}
        >
          <View style={styles.settingInfo}>
            <LogOut size={24} color={colors.error || '#FF6B6B'} />
            <Text style={[styles.settingText, { color: colors.error || '#FF6B6B' }]}>
              Sign Out
            </Text>
          </View>
          {isSigningOut && (
            <ActivityIndicator size="small" color={colors.error || '#FF6B6B'} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
  },
  disabledSection: {
    opacity: 0.6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  comingSoonLabel: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledSetting: {
    opacity: 0.8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
  },
  themeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeTheme: {
    // Active styling is handled dynamically
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  version: {
    fontSize: 14,
  },
  signOutButton: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    minHeight: 48, // Ensure minimum touch target
  },
});
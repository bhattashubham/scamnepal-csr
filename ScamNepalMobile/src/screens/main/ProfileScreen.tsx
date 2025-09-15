import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, logout, isLoading } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  console.log('ProfileScreen - user:', user, 'isLoading:', isLoading);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleChangePassword = () => {
    Alert.alert('Coming Soon', 'Password change will be available in the next update');
  };

  const handlePrivacySettings = () => {
    Alert.alert('Coming Soon', 'Privacy settings will be available in the next update');
  };

  const handleHelpSupport = () => {
    navigation.navigate('Help');
  };

  const handleAbout = () => {
    Alert.alert(
      'About ScamNepal',
      'Version 1.0.0\n\nScamNepal is a community-driven platform to report and track scams in Nepal.\n\nBuilt with React Native.'
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Icon name="refresh" size={64} color="#2196F3" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="person-off" size={64} color="#f44336" />
          <Text style={styles.errorText}>User not found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Icon name="person" size={64} color="#2196F3" />
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
          <Icon name={getRoleIcon(user.role)} size={16} color="#fff" />
          <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon name="email" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Icon name="verified-user" size={20} color={user.isVerified ? '#4CAF50' : '#FF9800'} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Verification Status</Text>
              <Text style={[styles.infoValue, { color: user.isVerified ? '#4CAF50' : '#FF9800' }]}>
                {user.isVerified ? 'Verified' : 'Pending Verification'}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Icon name="calendar-today" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue}>
                {new Date(user.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Icon name="notifications" size={20} color="#666" />
              <Text style={styles.settingLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={notificationsEnabled ? '#2196F3' : '#f4f3f4'}
            />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Icon name="dark-mode" size={20} color="#666" />
              <Text style={styles.settingLabel}>Dark Mode</Text>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={darkModeEnabled ? '#2196F3' : '#f4f3f4'}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Actions</Text>
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionRow} onPress={handleEditProfile}>
            <Icon name="edit" size={20} color="#2196F3" />
            <Text style={styles.actionLabel}>Edit Profile</Text>
            <Icon name="chevron-right" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={handleChangePassword}>
            <Icon name="lock" size={20} color="#2196F3" />
            <Text style={styles.actionLabel}>Change Password</Text>
            <Icon name="chevron-right" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={handlePrivacySettings}>
            <Icon name="privacy-tip" size={20} color="#2196F3" />
            <Text style={styles.actionLabel}>Privacy Settings</Text>
            <Icon name="chevron-right" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionRow} onPress={handleHelpSupport}>
            <Icon name="help" size={20} color="#2196F3" />
            <Text style={styles.actionLabel}>Help & Support</Text>
            <Icon name="chevron-right" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={handleAbout}>
            <Icon name="info" size={20} color="#2196F3" />
            <Text style={styles.actionLabel}>About</Text>
            <Icon name="chevron-right" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={20} color="#f44336" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper function for role colors
const getRoleColor = (role: string): string => {
  switch (role) {
    case 'admin': return '#f44336';
    case 'moderator': return '#ff9800';
    case 'member': return '#4caf50';
    default: return '#666';
  }
};

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'admin': return 'admin-panel-settings';
    case 'moderator': return 'security';
    case 'member': return 'person';
    default: return 'help';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#e3f2fd',
    marginBottom: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f44336',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutText: {
    fontSize: 16,
    color: '#f44336',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#2196F3',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#f44336',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;

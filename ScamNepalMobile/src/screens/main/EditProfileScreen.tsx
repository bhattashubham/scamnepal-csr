import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { User } from '../../types';

type EditProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const EditProfileScreen = () => {
  const navigation = useNavigation<EditProfileScreenNavigationProp>();
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const hasFormChanges = 
        formData.name !== user.name ||
        formData.email !== user.email ||
        formData.phone !== (user.phone || '');
      setHasChanges(hasFormChanges);
    }
  }, [formData, user]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    if (!formData.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.updateProfile(formData);
      
      if (response.success) {
        const updatedUser = { ...user!, ...formData };
        updateUser(updatedUser);
        Alert.alert(
          'Success',
          'Profile updated successfully',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleImagePicker = () => {
    Alert.alert('Coming Soon', 'Profile picture upload will be available in the next update');
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="person-off" size={64} color="#f44336" />
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <TouchableOpacity
            style={[styles.saveButton, (!hasChanges || isLoading) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!hasChanges || isLoading}
          >
            <Text style={styles.saveText}>
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Profile Picture */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: 'https://via.placeholder.com/100' }}
                style={styles.avatar}
              />
              <TouchableOpacity style={styles.editAvatarButton} onPress={handleImagePicker}>
                <Icon name="camera-alt" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.avatarText}>Tap to change photo</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email address"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Role</Text>
              <View style={styles.roleContainer}>
                <Icon name={getRoleIcon(user.role)} size={20} color={getRoleColor(user.role)} />
                <Text style={[styles.roleText, { color: getRoleColor(user.role) }]}>
                  {user.role.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.roleNote}>
                Role cannot be changed. Contact admin for role changes.
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Verification Status</Text>
              <View style={styles.verificationContainer}>
                <Icon 
                  name={user.isVerified ? "verified" : "schedule"} 
                  size={20} 
                  color={user.isVerified ? "#4CAF50" : "#FF9800"} 
                />
                <Text style={[
                  styles.verificationText, 
                  { color: user.isVerified ? "#4CAF50" : "#FF9800" }
                ]}>
                  {user.isVerified ? 'Verified' : 'Pending Verification'}
                </Text>
              </View>
            </View>
          </View>

          {/* Additional Actions */}
          <View style={styles.actionsSection}>
            <TouchableOpacity style={styles.actionButton} onPress={handleChangePassword}>
              <Icon name="lock" size={20} color="#2196F3" />
              <Text style={styles.actionText}>Change Password</Text>
              <Icon name="chevron-right" size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Icon name="privacy-tip" size={20} color="#2196F3" />
              <Text style={styles.actionText}>Privacy Settings</Text>
              <Icon name="chevron-right" size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Icon name="notifications" size={20} color="#2196F3" />
              <Text style={styles.actionText}>Notification Preferences</Text>
              <Icon name="chevron-right" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Account Information */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Account Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Last Updated</Text>
                <Text style={styles.infoValue}>
                  {new Date(user.updatedAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getRoleColor = (role: string) => {
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
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  saveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  content: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2196F3',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    color: '#666',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  roleNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  verificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
  },
  verificationText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  actionsSection: {
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoTitle: {
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
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
  },
});

export default EditProfileScreen;

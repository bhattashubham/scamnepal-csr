import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { apiService } from '../../services/api';
import { authService } from '../../services/auth';
import { User } from '../../types';

type AdminScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const AdminScreen = () => {
  const navigation = useNavigation<AdminScreenNavigationProp>();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReports: 0,
    pendingModeration: 0,
    verifiedReports: 0,
  });
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const user = authService.getState().user;

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'moderator') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadStats(),
        loadRecentUsers(),
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Load users count
      const usersResponse = await apiService.getUsers(1, 1);
      if (usersResponse.success && usersResponse.data) {
        setStats(prev => ({ ...prev, totalUsers: usersResponse.data!.total }));
      }

      // Load reports count
      const reportsResponse = await apiService.getReports(1, 1);
      if (reportsResponse.success && reportsResponse.data) {
        setStats(prev => ({ ...prev, totalReports: reportsResponse.data!.total }));
      }

      // Load moderation queue
      const moderationResponse = await apiService.getModerationQueue(1, 1);
      if (moderationResponse.success && moderationResponse.data) {
        setStats(prev => ({ ...prev, pendingModeration: moderationResponse.data.total || 0 }));
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadRecentUsers = async () => {
    try {
      const response = await apiService.getUsers(1, 5);
      if (response.success && response.data && response.data.data) {
        setRecentUsers(response.data.data);
      } else {
        setRecentUsers([]);
      }
    } catch (error) {
      console.error('Failed to load recent users:', error);
      setRecentUsers([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const navigateToAddUser = () => {
    navigation.navigate('AddUser');
  };

  const navigateToModerationQueue = () => {
    navigation.navigate('ModerationQueue');
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

  if (user?.role !== 'admin' && user?.role !== 'moderator') {
    return (
      <View style={styles.errorContainer}>
        <Icon name="block" size={64} color="#f44336" />
        <Text style={styles.errorText}>Access Denied</Text>
        <Text style={styles.errorSubtext}>
          You don't have permission to access this section
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>
          Welcome, {user?.name} ({user?.role})
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={navigateToAddUser}>
            <Icon name="person-add" size={24} color="#2196F3" />
            <Text style={styles.actionText}>Add User</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={navigateToModerationQueue}>
            <Icon name="queue" size={24} color="#2196F3" />
            <Text style={styles.actionText}>Moderation</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icon name="people" size={32} color="#2196F3" />
            <Text style={styles.statNumber}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="report" size={32} color="#4CAF50" />
            <Text style={styles.statNumber}>{stats.totalReports}</Text>
            <Text style={styles.statLabel}>Total Reports</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="queue" size={32} color="#FF9800" />
            <Text style={styles.statNumber}>{stats.pendingModeration}</Text>
            <Text style={styles.statLabel}>Pending Review</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="verified" size={32} color="#4CAF50" />
            <Text style={styles.statNumber}>{stats.verifiedReports}</Text>
            <Text style={styles.statLabel}>Verified</Text>
          </View>
        </View>
      </View>

      {/* Recent Users */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Users</Text>
        {recentUsers && recentUsers.length > 0 ? (
          recentUsers.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <View style={styles.userHeader}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
                    <Icon
                      name={getRoleIcon(user.role)}
                      size={16}
                      color="#fff"
                    />
                    <Text style={styles.roleText}>{user.role}</Text>
                  </View>
                </View>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.userDate}>
                  Joined: {new Date(user.createdAt).toLocaleDateString()}
                </Text>
                <View style={styles.userStatus}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: user.isVerified ? '#4CAF50' : '#FF9800' }
                  ]} />
                  <Text style={styles.statusText}>
                    {user.isVerified ? 'Verified' : 'Pending Verification'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent users found</Text>
        )}
      </View>

      {/* Admin Tools */}
      {user?.role === 'admin' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin Tools</Text>
          <View style={styles.adminTools}>
            <TouchableOpacity style={styles.toolButton}>
              <Icon name="settings" size={24} color="#666" />
              <Text style={styles.toolText}>System Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolButton}>
              <Icon name="analytics" size={24} color="#666" />
              <Text style={styles.toolText}>Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolButton}>
              <Icon name="backup" size={24} color="#666" />
              <Text style={styles.toolText}>Backup</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolButton}>
              <Icon name="security" size={24} color="#666" />
              <Text style={styles.toolText}>Security</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#2196F3',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#e3f2fd',
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  userCard: {
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
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  userStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  adminTools: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  toolButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toolText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f44336',
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default AdminScreen;

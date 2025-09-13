import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { apiService } from '../../services/api';
import { authService } from '../../services/auth';
import { User } from '../../types';

type UserManagementScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const UserManagementScreen = () => {
  const navigation = useNavigation<UserManagementScreenNavigationProp>();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const currentUser = authService.getState().user;

  const roles = [
    { label: 'All', value: 'all' },
    { label: 'Members', value: 'member' },
    { label: 'Moderators', value: 'moderator' },
    { label: 'Admins', value: 'admin' },
  ];

  const statuses = [
    { label: 'All', value: 'all' },
    { label: 'Verified', value: 'verified' },
    { label: 'Pending', value: 'pending' },
  ];

  useEffect(() => {
    if (currentUser?.role === 'admin' || currentUser?.role === 'moderator') {
      loadUsers();
    }
  }, [currentUser]);

  const loadUsers = async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsLoading(true);
        setPage(1);
      }

      const response = await apiService.getUsers(pageNum, 20);
      if (response.success && response.data) {
        let filteredUsers = response.data.data;
        
        // Apply search filter
        if (searchQuery) {
          filteredUsers = filteredUsers.filter(user =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        
        // Apply role filter
        if (filterRole !== 'all') {
          filteredUsers = filteredUsers.filter(user => user.role === filterRole);
        }

        if (refresh || pageNum === 1) {
          setUsers(filteredUsers);
        } else {
          setUsers(prev => [...prev, ...filteredUsers]);
        }
        setHasMore(response.data.data.length === 20);
        setPage(pageNum);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers(1, true);
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      loadUsers(page + 1);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Debounce search - in real app, you'd implement proper debouncing
    setTimeout(() => {
      loadUsers(1, true);
    }, 500);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await apiService.updateUserRole(userId, newRole);
      if (response.success) {
        setUsers(prev =>
          prev.map(user =>
            user.id === userId ? { ...user, role: newRole as any } : user
          )
        );
        Alert.alert('Success', 'User role updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update user role');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update user role');
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Note: This would need a delete user API endpoint
            Alert.alert('Coming Soon', 'User deletion will be available in the next update');
          },
        },
      ]
    );
  };

  const navigateToAddUser = () => {
    navigation.navigate('AddUser');
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

  const renderUser = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Icon name="person" size={24} color="#666" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            <Text style={styles.userDate}>
              Joined: {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={styles.userActions}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
            <Icon name={getRoleIcon(item.role)} size={16} color="#fff" />
            <Text style={styles.roleText}>{item.role}</Text>
          </View>
        </View>
      </View>

      <View style={styles.userStatus}>
        <View style={styles.statusItem}>
          <Icon
            name={item.isVerified ? 'verified' : 'schedule'}
            size={16}
            color={item.isVerified ? '#4CAF50' : '#FF9800'}
          />
          <Text style={[
            styles.statusText,
            { color: item.isVerified ? '#4CAF50' : '#FF9800' }
          ]}>
            {item.isVerified ? 'Verified' : 'Pending'}
          </Text>
        </View>
      </View>

      <View style={styles.userActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleRoleChange(item.id, 'moderator')}
          disabled={item.role === 'moderator' || item.role === 'admin'}
        >
          <Icon name="security" size={16} color="#ff9800" />
          <Text style={styles.actionText}>Make Moderator</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleRoleChange(item.id, 'member')}
          disabled={item.role === 'member'}
        >
          <Icon name="person" size={16} color="#4caf50" />
          <Text style={styles.actionText}>Make Member</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteUser(item.id, item.name)}
        >
          <Icon name="delete" size={16} color="#f44336" />
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (currentUser?.role !== 'admin' && currentUser?.role !== 'moderator') {
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={navigateToAddUser}>
          <Icon name="person-add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
        
        <View style={styles.filterRow}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.value}
              style={[
                styles.filterChip,
                filterRole === role.value && styles.filterChipActive,
              ]}
              onPress={() => {
                setFilterRole(role.value);
                loadUsers(1, true);
              }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterRole === role.value && styles.filterChipTextActive,
                ]}
              >
                {role.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search terms' : 'No users have been registered yet'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    marginLeft: 8,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipActive: {
    backgroundColor: '#2196F3',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  list: {
    flex: 1,
    padding: 16,
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
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userDate: {
    fontSize: 12,
    color: '#999',
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
  userStatus: {
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  deleteText: {
    color: '#f44336',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
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

export default UserManagementScreen;

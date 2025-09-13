import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { apiService } from '../../services/api';
import { authService } from '../../services/auth';
import { Report } from '../../types';

type MyReportsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const MyReportsScreen = () => {
  const navigation = useNavigation<MyReportsScreenNavigationProp>();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const user = authService.getState().user;

  useEffect(() => {
    loadMyReports();
  }, []);

  const loadMyReports = async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsLoading(true);
        setPage(1);
      }

      // Note: This would need a specific endpoint for user's own reports
      const response = await apiService.getReports(pageNum, 20);
      if (response.success && response.data) {
        const userReports = response.data.data.filter(
          report => report.reporterUserId === user?.id
        );
        
        if (refresh || pageNum === 1) {
          setReports(userReports);
        } else {
          setReports(prev => [...prev, ...userReports]);
        }
        setHasMore(userReports.length === 20);
        setPage(pageNum);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load your reports');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMyReports(1, true);
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      loadMyReports(page + 1);
    }
  };

  const navigateToReportDetails = (reportId: string) => {
    navigation.navigate('ReportDetails', { reportId });
  };

  const navigateToCreateReport = () => {
    navigation.navigate('CreateReport');
  };

  const handleDeleteReport = async (reportId: string) => {
    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this report? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.deleteReport(reportId);
              if (response.success) {
                setReports(prev => prev.filter(report => report.id !== reportId));
                Alert.alert('Success', 'Report deleted successfully');
              } else {
                Alert.alert('Error', 'Failed to delete report');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete report');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return '#4caf50';
      case 'pending': return '#ff9800';
      case 'rejected': return '#f44336';
      case 'under_review': return '#2196f3';
      default: return '#666';
    }
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 80) return '#f44336';
    if (riskScore >= 60) return '#ff9800';
    if (riskScore >= 40) return '#ffeb3b';
    return '#4caf50';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return 'check-circle';
      case 'pending': return 'schedule';
      case 'rejected': return 'cancel';
      case 'under_review': return 'visibility';
      default: return 'help';
    }
  };

  const renderReport = ({ item }: { item: Report }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => navigateToReportDetails(item.id)}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportInfo}>
          <Text style={styles.reportCategory}>{item.category}</Text>
          <Text style={styles.reportValue}>{item.identifierValue}</Text>
        </View>
        <View style={styles.reportActions}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Icon name={getStatusIcon(item.status)} size={16} color="#fff" />
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteReport(item.id)}
          >
            <Icon name="delete" size={20} color="#f44336" />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.reportNarrative} numberOfLines={2}>
        {item.narrative}
      </Text>
      
      <View style={styles.reportFooter}>
        <View style={styles.reportMeta}>
          <Text style={styles.reportDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          <Text style={styles.reportAmount}>
            ${item.amountLost.toLocaleString()} {item.currency}
          </Text>
        </View>
        <View style={[styles.riskBadge, { backgroundColor: getRiskColor(item.riskScore) }]}>
          <Text style={styles.riskText}>Risk: {item.riskScore}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Reports</Text>
        <TouchableOpacity style={styles.addButton} onPress={navigateToCreateReport}>
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {reports.length === 0 && !isLoading ? (
        <View style={styles.emptyContainer}>
          <Icon name="report-off" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>No Reports Yet</Text>
          <Text style={styles.emptyText}>
            You haven't submitted any reports yet.{'\n'}
            Help protect others by reporting scams.
          </Text>
          <TouchableOpacity style={styles.createButton} onPress={navigateToCreateReport}>
            <Icon name="add" size={20} color="#fff" />
            <Text style={styles.createButtonText}>Create First Report</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReport}
          keyExtractor={(item) => item.id}
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Icon name="report" size={24} color="#2196F3" />
                <Text style={styles.statNumber}>{reports.length}</Text>
                <Text style={styles.statLabel}>Total Reports</Text>
              </View>
              <View style={styles.statCard}>
                <Icon name="verified" size={24} color="#4CAF50" />
                <Text style={styles.statNumber}>
                  {reports.filter(r => r.status === 'verified').length}
                </Text>
                <Text style={styles.statLabel}>Verified</Text>
              </View>
              <View style={styles.statCard}>
                <Icon name="schedule" size={24} color="#FF9800" />
                <Text style={styles.statNumber}>
                  {reports.filter(r => r.status === 'pending').length}
                </Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>
          }
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  list: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 20,
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
  reportCard: {
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
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reportInfo: {
    flex: 1,
  },
  reportCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  reportValue: {
    fontSize: 14,
    color: '#666',
  },
  reportActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  deleteButton: {
    padding: 4,
  },
  reportNarrative: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportMeta: {
    flex: 1,
  },
  reportDate: {
    fontSize: 12,
    color: '#666',
  },
  reportAmount: {
    fontSize: 12,
    color: '#f44336',
    fontWeight: 'bold',
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default MyReportsScreen;

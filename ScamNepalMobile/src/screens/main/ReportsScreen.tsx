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
import { Report } from '../../types';

type ReportsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ReportsScreen = () => {
  const navigation = useNavigation<ReportsScreenNavigationProp>();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsLoading(true);
        setPage(1);
      }

      const response = await apiService.getReports(pageNum, 20);
      if (response.success && response.data) {
        if (refresh || pageNum === 1) {
          setReports(response.data.data);
        } else {
          setReports(prev => [...prev, ...response.data!.data]);
        }
        setHasMore(response.data.data.length === 20);
        setPage(pageNum);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReports(1, true);
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      loadReports(page + 1);
    }
  };

  const navigateToReportDetails = (reportId: string) => {
    navigation.navigate('ReportDetails', { reportId });
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

  const renderReport = ({ item }: { item: Report }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => navigateToReportDetails(item.id)}
    >
      <View style={styles.reportHeader}>
        <Text style={styles.reportCategory}>{item.category}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.reportValue}>{item.identifierValue}</Text>
      <Text style={styles.reportNarrative} numberOfLines={3}>
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
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.subtitle}>Community scam reports</Text>
      </View>

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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="report-off" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No reports found</Text>
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
  list: {
    flex: 1,
    padding: 16,
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
    alignItems: 'center',
    marginBottom: 8,
  },
  reportCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  reportValue: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  reportNarrative: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
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
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
});

export default ReportsScreen;

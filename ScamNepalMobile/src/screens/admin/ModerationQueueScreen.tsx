import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { Report } from '../../types';
import { getStatusColor, getRiskColor } from '../../utils/statusUtils';

const ModerationQueueScreen = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadModerationQueue();
  }, []);

  const loadModerationQueue = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getModerationQueue(1, 50);
      if (response.success && response.data) {
        setReports(response.data.data || []);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load moderation queue');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadModerationQueue();
    setRefreshing(false);
  };

  const handleModerate = async (reportId: string, action: 'approve' | 'reject') => {
    try {
      const status = action === 'approve' ? 'verified' : 'rejected';
      const response = await apiService.updateReport(reportId, { status });
      
      if (response.success) {
        Alert.alert(
          'Success',
          `Report ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
          [{ text: 'OK', onPress: loadModerationQueue }]
        );
      } else {
        Alert.alert('Error', 'Failed to moderate report');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to moderate report');
    }
  };


  const renderReport = ({ item }: { item: Report }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportCategory}>{item.category}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
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

      {item.status === 'pending' && (
        <View style={styles.moderationActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleModerate(item.id, 'approve')}
          >
            <Icon name="check" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleModerate(item.id, 'reject')}
          >
            <Icon name="close" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Moderation Queue</Text>
        <Text style={styles.subtitle}>Review and moderate reports</Text>
      </View>

      <FlatList
        data={reports}
        renderItem={renderReport}
        keyExtractor={(item) => item.id}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="queue" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No reports to moderate</Text>
            <Text style={styles.emptySubtext}>All reports have been reviewed</Text>
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
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    maxWidth: 50,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    numberOfLines: 1,
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
    marginBottom: 12,
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
  moderationActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
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
});

export default ModerationQueueScreen;

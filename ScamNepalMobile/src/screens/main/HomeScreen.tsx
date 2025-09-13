import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { apiService } from '../../services/api';
import { authService } from '../../services/auth';
import { Report, Entity } from '../../types';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [topEntities, setTopEntities] = useState<Entity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const user = authService.getState().user;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadRecentReports(),
        loadTopEntities(),
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentReports = async () => {
    try {
      const response = await apiService.getReports(1, 5);
      if (response.success && response.data) {
        setRecentReports(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load recent reports:', error);
    }
  };

  const loadTopEntities = async () => {
    try {
      const response = await apiService.getEntities(1, 5, { sortBy: 'riskScore' });
      if (response.success && response.data) {
        setTopEntities(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load top entities:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const navigateToSearch = () => {
    navigation.navigate('Main', { screen: 'Search' });
  };

  const navigateToReports = () => {
    navigation.navigate('Main', { screen: 'Reports' });
  };

  const navigateToCreateReport = () => {
    navigation.navigate('CreateReport');
  };

  const navigateToMyReports = () => {
    navigation.navigate('MyReports');
  };

  const navigateToReportDetails = (reportId: string) => {
    navigation.navigate('ReportDetails', { reportId });
  };

  const navigateToEntityDetails = (entityId: string) => {
    navigation.navigate('EntityDetails', { entityId });
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 80) return '#f44336';
    if (riskScore >= 60) return '#ff9800';
    if (riskScore >= 40) return '#ffeb3b';
    return '#4caf50';
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back, {user?.name}!</Text>
        <Text style={styles.subtitle}>Stay informed about scams in Nepal</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={navigateToSearch}>
            <Icon name="search" size={24} color="#2196F3" />
            <Text style={styles.actionText}>Search Scams</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={navigateToCreateReport}>
            <Icon name="add-circle" size={24} color="#2196F3" />
            <Text style={styles.actionText}>Report Scam</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={navigateToMyReports}>
            <Icon name="person" size={24} color="#2196F3" />
            <Text style={styles.actionText}>My Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={navigateToReports}>
            <Icon name="report" size={24} color="#2196F3" />
            <Text style={styles.actionText}>All Reports</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Reports */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Reports</Text>
        {recentReports.length > 0 ? (
          recentReports.map((report) => (
            <TouchableOpacity
              key={report.id}
              style={styles.reportCard}
              onPress={() => navigateToReportDetails(report.id)}
            >
              <View style={styles.reportHeader}>
                <Text style={styles.reportTitle}>{report.category}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
                  <Text style={styles.statusText}>{report.status}</Text>
                </View>
              </View>
              <Text style={styles.reportValue}>{report.identifierValue}</Text>
              <Text style={styles.reportNarrative} numberOfLines={2}>
                {report.narrative}
              </Text>
              <View style={styles.reportFooter}>
                <Text style={styles.reportDate}>
                  {new Date(report.createdAt).toLocaleDateString()}
                </Text>
                <View style={[styles.riskBadge, { backgroundColor: getRiskColor(report.riskScore) }]}>
                  <Text style={styles.riskText}>Risk: {report.riskScore}%</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent reports found</Text>
        )}
      </View>

      {/* Top Risk Entities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>High Risk Entities</Text>
        {topEntities.length > 0 ? (
          topEntities.map((entity) => (
            <TouchableOpacity
              key={entity.id}
              style={styles.entityCard}
              onPress={() => navigateToEntityDetails(entity.id)}
            >
              <View style={styles.entityHeader}>
                <Text style={styles.entityName}>{entity.displayName}</Text>
                <View style={[styles.riskBadge, { backgroundColor: getRiskColor(entity.riskScore) }]}>
                  <Text style={styles.riskText}>{entity.riskScore}%</Text>
                </View>
              </View>
              <View style={styles.entityStats}>
                <Text style={styles.entityStat}>
                  {entity.reportCount} reports
                </Text>
                <Text style={styles.entityStat}>
                  ${entity.totalAmountLost.toLocaleString()} lost
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(entity.status) }]}>
                <Text style={styles.statusText}>{entity.status}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No high risk entities found</Text>
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
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
    padding: 20,
    backgroundColor: '#2196F3',
  },
  greeting: {
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
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
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
  actionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
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
  reportTitle: {
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
  reportDate: {
    fontSize: 12,
    color: '#666',
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
  entityCard: {
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
  entityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  entityStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  entityStat: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 20,
  },
});

export default HomeScreen;

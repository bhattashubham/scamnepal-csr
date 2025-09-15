import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { apiService } from '../../services/api';
import { Report } from '../../types';
import { getStatusColor, getRiskColor } from '../../utils/statusUtils';

type ReportDetailsRouteProp = RouteProp<RootStackParamList, 'ReportDetails'>;

const ReportDetailsScreen = () => {
  const route = useRoute<ReportDetailsRouteProp>();
  const { reportId } = route.params;
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReportDetails();
  }, [reportId]);

  const loadReportDetails = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getReport(reportId);
      if (response.success && response.data) {
        setReport(response.data);
      } else {
        Alert.alert('Error', 'Failed to load report details');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load report details');
    } finally {
      setIsLoading(false);
    }
  };


  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading report details...</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={64} color="#f44336" />
        <Text style={styles.errorText}>Report not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Report Details</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
          <Text style={styles.statusText}>{getStatusText(report.status)}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Icon name="category" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Category</Text>
                <Text style={styles.infoValue}>{report.category}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Icon name="phone" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Identifier</Text>
                <Text style={styles.infoValue}>{report.identifierValue}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Icon name="calendar-today" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Reported Date</Text>
                <Text style={styles.infoValue}>
                  {new Date(report.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Impact</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Icon name="attach-money" size={20} color="#f44336" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Amount Lost</Text>
                <Text style={[styles.infoValue, { color: '#f44336', fontWeight: 'bold' }]}>
                  ${report.amountLost.toLocaleString()} {report.currency}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Icon name="trending-up" size={20} color={getRiskColor(report.riskScore)} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Risk Score</Text>
                <Text style={[styles.infoValue, { color: getRiskColor(report.riskScore), fontWeight: 'bold' }]}>
                  {report.riskScore}%
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Details</Text>
          <View style={styles.infoCard}>
            <Text style={styles.narrativeText}>{report.narrative}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reporter Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Icon name="email" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Reporter Email</Text>
                <Text style={styles.infoValue}>{report.reporterEmail}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  statusBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    maxWidth:60,
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
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
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
  narrativeText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
});

export default ReportDetailsScreen;

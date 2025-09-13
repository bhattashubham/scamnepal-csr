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
import { Entity } from '../../types';

type EntityDetailsRouteProp = RouteProp<RootStackParamList, 'EntityDetails'>;

const EntityDetailsScreen = () => {
  const route = useRoute<EntityDetailsRouteProp>();
  const { entityId } = route.params;
  const [entity, setEntity] = useState<Entity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEntityDetails();
  }, [entityId]);

  const loadEntityDetails = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getEntity(entityId);
      if (response.success && response.data) {
        setEntity(response.data);
      } else {
        Alert.alert('Error', 'Failed to load entity details');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load entity details');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#f44336';
      case 'alleged': return '#ff9800';
      case 'disputed': return '#2196f3';
      case 'cleared': return '#4caf50';
      default: return '#666';
    }
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 80) return '#f44336';
    if (riskScore >= 60) return '#ff9800';
    if (riskScore >= 40) return '#ffeb3b';
    return '#4caf50';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading entity details...</Text>
      </View>
    );
  }

  if (!entity) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={64} color="#f44336" />
        <Text style={styles.errorText}>Entity not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{entity.displayName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(entity.status) }]}>
          <Text style={styles.statusText}>{entity.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk Assessment</Text>
          <View style={styles.infoCard}>
            <View style={styles.riskContainer}>
              <View style={[styles.riskCircle, { backgroundColor: getRiskColor(entity.riskScore) }]}>
                <Text style={styles.riskScore}>{entity.riskScore}%</Text>
              </View>
              <View style={styles.riskInfo}>
                <Text style={styles.riskLabel}>Risk Score</Text>
                <Text style={styles.riskDescription}>
                  {entity.riskScore >= 80 ? 'Very High Risk' :
                   entity.riskScore >= 60 ? 'High Risk' :
                   entity.riskScore >= 40 ? 'Medium Risk' : 'Low Risk'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Icon name="report" size={32} color="#2196F3" />
              <Text style={styles.statNumber}>{entity.reportCount}</Text>
              <Text style={styles.statLabel}>Reports</Text>
            </View>
            <View style={styles.statCard}>
              <Icon name="attach-money" size={32} color="#f44336" />
              <Text style={styles.statNumber}>${entity.totalAmountLost.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Lost</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagsContainer}>
            {entity.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entity Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Icon name="person" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Display Name</Text>
                <Text style={styles.infoValue}>{entity.displayName}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Icon name="calendar-today" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>First Reported</Text>
                <Text style={styles.infoValue}>
                  {new Date(entity.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Icon name="update" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Last Updated</Text>
                <Text style={styles.infoValue}>
                  {new Date(entity.updatedAt).toLocaleDateString()}
                </Text>
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
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
  riskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  riskScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  riskInfo: {
    flex: 1,
  },
  riskLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  riskDescription: {
    fontSize: 14,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    fontSize: 18,
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
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
});

export default EntityDetailsScreen;

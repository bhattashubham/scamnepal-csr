import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { apiService } from '../../services/api';

type FileUploadScreenRouteProp = RouteProp<RootStackParamList, 'FileUpload'>;

const { width } = Dimensions.get('window');

interface FileUpload {
  uri: string;
  type: string;
  name: string;
  size: number;
}

const FileUploadScreen = () => {
  const route = useRoute<FileUploadScreenRouteProp>();
  const { reportId } = route.params;
  const [selectedFiles, setSelectedFiles] = useState<FileUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileTypes = [
    { label: 'Images', value: 'image', icon: 'image' as any, color: '#4CAF50' },
    { label: 'Documents', value: 'document', icon: 'description' as any, color: '#2196F3' },
    { label: 'Videos', value: 'video', icon: 'videocam' as any, color: '#FF9800' },
    { label: 'Audio', value: 'audio', icon: 'audiotrack' as any, color: '#9C27B0' },
  ];

  const handleImagePicker = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add an image',
      [
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Gallery', onPress: () => openGallery() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleDocumentPicker = () => {
    Alert.alert('Coming Soon', 'Document picker will be available in the next update');
  };

  const handleVideoPicker = () => {
    Alert.alert('Coming Soon', 'Video picker will be available in the next update');
  };

  const handleAudioPicker = () => {
    Alert.alert('Coming Soon', 'Audio picker will be available in the next update');
  };

  const openCamera = () => {
    // This would integrate with react-native-image-picker
    Alert.alert('Coming Soon', 'Camera integration will be available in the next update');
  };

  const openGallery = () => {
    // This would integrate with react-native-image-picker
    Alert.alert('Coming Soon', 'Gallery integration will be available in the next update');
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      Alert.alert('Error', 'Please select at least one file to upload');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      const response = await apiService.uploadEvidence(reportId, selectedFiles);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        Alert.alert(
          'Success',
          'Files uploaded successfully!',
          [{ text: 'OK', onPress: () => setSelectedFiles([]) }]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to upload files');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'videocam';
    if (type.startsWith('audio/')) return 'audiotrack';
    return 'description';
  };

  const renderFileItem = (file: FileUpload, index: number) => (
    <View key={index} style={styles.fileItem}>
      <View style={styles.fileInfo}>
        <Icon name={getFileIcon(file.type)} size={24} color="#2196F3" />
        <View style={styles.fileDetails}>
          <Text style={styles.fileName} numberOfLines={1}>
            {file.name}
          </Text>
          <Text style={styles.fileSize}>
            {formatFileSize(file.size)}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFile(index)}
      >
        <Icon name="close" size={20} color="#f44336" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upload Evidence</Text>
        <Text style={styles.subtitle}>Add supporting files to your report</Text>
      </View>

      <View style={styles.content}>
        {/* File Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select File Type</Text>
          <View style={styles.fileTypeGrid}>
            {fileTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[styles.fileTypeButton, { borderColor: type.color }]}
                onPress={() => {
                  switch (type.value) {
                    case 'image': handleImagePicker(); break;
                    case 'document': handleDocumentPicker(); break;
                    case 'video': handleVideoPicker(); break;
                    case 'audio': handleAudioPicker(); break;
                  }
                }}
              >
                <Icon name={type.icon} size={32} color={type.color} />
                <Text style={[styles.fileTypeText, { color: type.color }]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Selected Files ({selectedFiles.length})
            </Text>
            <View style={styles.filesList}>
              {selectedFiles.map((file, index) => renderFileItem(file, index))}
            </View>
          </View>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Uploading Files...</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${uploadProgress}%` }]} 
                />
              </View>
              <Text style={styles.progressText}>{uploadProgress}%</Text>
            </View>
          </View>
        )}

        {/* Upload Guidelines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Guidelines</Text>
          <View style={styles.guidelines}>
            <View style={styles.guidelineItem}>
              <Icon name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.guidelineText}>
                Supported formats: JPG, PNG, PDF, MP4, MP3, DOC, DOCX
              </Text>
            </View>
            <View style={styles.guidelineItem}>
              <Icon name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.guidelineText}>
                Maximum file size: 10MB per file
              </Text>
            </View>
            <View style={styles.guidelineItem}>
              <Icon name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.guidelineText}>
                Maximum 5 files per report
              </Text>
            </View>
            <View style={styles.guidelineItem}>
              <Icon name="warning" size={16} color="#FF9800" />
              <Text style={styles.guidelineText}>
                Only upload relevant evidence
              </Text>
            </View>
          </View>
        </View>

        {/* Upload Button */}
        {selectedFiles.length > 0 && (
          <TouchableOpacity
            style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
            onPress={handleUpload}
            disabled={isUploading}
          >
            <Icon name="cloud-upload" size={20} color="#fff" />
            <Text style={styles.uploadButtonText}>
              {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
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
    alignItems: 'center',
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
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  fileTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  fileTypeButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fileTypeText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  filesList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  progressContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginTop: 8,
  },
  guidelines: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  guidelineText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: '#ccc',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default FileUploadScreen;

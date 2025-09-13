import React, { useState } from 'react';
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
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { apiService } from '../../services/api';
import { Report } from '../../types';

type CreateReportScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const CreateReportScreen = () => {
  const navigation = useNavigation<CreateReportScreenNavigationProp>();
  const [formData, setFormData] = useState({
    identifierType: 'phone' as 'phone' | 'email' | 'website' | 'social_media' | 'other',
    identifierValue: '',
    category: 'phishing' as 'phishing' | 'investment' | 'romance' | 'tech_support' | 'other',
    narrative: '',
    amountLost: '',
    currency: 'USD',
    incidentDate: '',
    incidentChannel: '',
    contactMethod: '',
    suspectedLinks: '',
    additionalInfo: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const identifierTypes = [
    { label: 'Phone Number', value: 'phone' },
    { label: 'Email Address', value: 'email' },
    { label: 'Website', value: 'website' },
    { label: 'Social Media', value: 'social_media' },
    { label: 'Other', value: 'other' },
  ];

  const categories = [
    { label: 'Phishing', value: 'phishing' },
    { label: 'Investment Scam', value: 'investment' },
    { label: 'Romance Scam', value: 'romance' },
    { label: 'Tech Support', value: 'tech_support' },
    { label: 'Other', value: 'other' },
  ];

  const currencies = [
    { label: 'USD', value: 'USD' },
    { label: 'NPR', value: 'NPR' },
    { label: 'EUR', value: 'EUR' },
    { label: 'GBP', value: 'GBP' },
  ];

  const incidentChannels = [
    { label: 'SMS', value: 'sms' },
    { label: 'Email', value: 'email' },
    { label: 'Phone Call', value: 'phone_call' },
    { label: 'Social Media', value: 'social_media' },
    { label: 'Website', value: 'website' },
    { label: 'In Person', value: 'in_person' },
    { label: 'Other', value: 'other' },
  ];

  const contactMethods = [
    { label: 'Phone Call', value: 'phone_call' },
    { label: 'SMS/Text', value: 'sms' },
    { label: 'Email', value: 'email' },
    { label: 'WhatsApp', value: 'whatsapp' },
    { label: 'Social Media', value: 'social_media' },
    { label: 'Website Form', value: 'website_form' },
    { label: 'Other', value: 'other' },
  ];

  const handleSubmit = async () => {
    if (!formData.identifierValue || !formData.narrative) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.narrative.length < 50) {
      Alert.alert('Error', 'Please provide a detailed description (at least 50 characters)');
      return;
    }

    setIsLoading(true);
    try {
      const reportData = {
        ...formData,
        amountLost: parseFloat(formData.amountLost) || 0,
        incidentDate: formData.incidentDate ? new Date(formData.incidentDate) : undefined,
      };

      const response = await apiService.createReport(reportData);
      if (response.success) {
        Alert.alert(
          'Success',
          'Report submitted successfully! It will be reviewed by our moderators.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to submit report');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePicker = () => {
    Alert.alert('Coming Soon', 'Image upload will be available in the next update');
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Report a Scam</Text>
          <Text style={styles.subtitle}>Help protect others by reporting scams</Text>
        </View>

        <View style={styles.form}>
          {/* Identifier Type */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>What type of identifier? *</Text>
            <View style={styles.optionContainer}>
              {identifierTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.optionButton,
                    formData.identifierType === type.value && styles.optionButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, identifierType: type.value as any })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.identifierType === type.value && styles.optionTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Identifier Value */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Identifier Value *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter the phone number, email, website, etc."
              value={formData.identifierValue}
              onChangeText={(text) => setFormData({ ...formData, identifierValue: text })}
              keyboardType={
                formData.identifierType === 'phone' ? 'phone-pad' :
                formData.identifierType === 'email' ? 'email-address' : 'default'
              }
              autoCapitalize="none"
            />
          </View>

          {/* Category */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Scam Category *</Text>
            <View style={styles.optionContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    styles.optionButton,
                    formData.category === category.value && styles.optionButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, category: category.value as any })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.category === category.value && styles.optionTextActive,
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Financial Impact */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Financial Impact</Text>
            <View style={styles.amountContainer}>
              <TextInput
                style={[styles.input, styles.amountInput]}
                placeholder="0.00"
                value={formData.amountLost}
                onChangeText={(text) => setFormData({ ...formData, amountLost: text })}
                keyboardType="numeric"
              />
              <View style={styles.currencyContainer}>
                {currencies.map((currency) => (
                  <TouchableOpacity
                    key={currency.value}
                    style={[
                      styles.currencyButton,
                      formData.currency === currency.value && styles.currencyButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, currency: currency.value })}
                  >
                    <Text
                      style={[
                        styles.currencyText,
                        formData.currency === currency.value && styles.currencyTextActive,
                      ]}
                    >
                      {currency.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Narrative */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Detailed Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Please provide a detailed description of the scam. Include what happened, when it occurred, and any other relevant details..."
              value={formData.narrative}
              onChangeText={(text) => setFormData({ ...formData, narrative: text })}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {formData.narrative.length}/500 characters (minimum 50)
            </Text>
          </View>

          {/* Incident Date */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>When did this happen? (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD or leave blank if unknown"
              value={formData.incidentDate}
              onChangeText={(text) => setFormData({ ...formData, incidentDate: text })}
            />
          </View>

          {/* Incident Channel */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>How did you encounter this scam? (Optional)</Text>
            <View style={styles.optionContainer}>
              {incidentChannels.map((channel) => (
                <TouchableOpacity
                  key={channel.value}
                  style={[
                    styles.optionButton,
                    formData.incidentChannel === channel.value && styles.optionButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, incidentChannel: channel.value })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.incidentChannel === channel.value && styles.optionTextActive,
                    ]}
                  >
                    {channel.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Contact Method */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>How did the scammer contact you? (Optional)</Text>
            <View style={styles.optionContainer}>
              {contactMethods.map((method) => (
                <TouchableOpacity
                  key={method.value}
                  style={[
                    styles.optionButton,
                    formData.contactMethod === method.value && styles.optionButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, contactMethod: method.value })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.contactMethod === method.value && styles.optionTextActive,
                    ]}
                  >
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Suspected Links */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Suspicious Links (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter any suspicious URLs or links involved"
              value={formData.suspectedLinks}
              onChangeText={(text) => setFormData({ ...formData, suspectedLinks: text })}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          {/* Additional Information */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Additional Information (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any other relevant details that might help with the investigation..."
              value={formData.additionalInfo}
              onChangeText={(text) => setFormData({ ...formData, additionalInfo: text })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Evidence Upload */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Evidence (Optional)</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={handleImagePicker}>
              <Icon name="cloud-upload" size={24} color="#2196F3" />
              <Text style={styles.uploadText}>Upload Evidence</Text>
            </TouchableOpacity>
            {selectedImages.length > 0 && (
              <View style={styles.imagePreview}>
                {selectedImages.map((image, index) => (
                  <View key={index} style={styles.imageItem}>
                    <Image source={{ uri: image }} style={styles.previewImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Icon name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Submitting Report...' : 'Submit Report'}
            </Text>
          </TouchableOpacity>

          {/* Disclaimer */}
          <View style={styles.disclaimer}>
            <Icon name="info" size={16} color="#666" />
            <Text style={styles.disclaimerText}>
              By submitting this report, you agree that the information provided is accurate and truthful.
              False reports may result in account suspension.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
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
  form: {
    padding: 20,
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
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  optionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  optionButtonActive: {
    backgroundColor: '#2196F3',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
  },
  optionTextActive: {
    color: '#fff',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    flex: 1,
    marginRight: 12,
  },
  currencyContainer: {
    flexDirection: 'row',
  },
  currencyButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginLeft: 4,
  },
  currencyButtonActive: {
    backgroundColor: '#2196F3',
  },
  currencyText: {
    fontSize: 12,
    color: '#666',
  },
  currencyTextActive: {
    color: '#fff',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
  },
  uploadText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '500',
  },
  imagePreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  imageItem: {
    position: 'relative',
    marginRight: 8,
    marginBottom: 8,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#f44336',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    padding: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  disclaimerText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#856404',
    flex: 1,
  },
});

export default CreateReportScreen;

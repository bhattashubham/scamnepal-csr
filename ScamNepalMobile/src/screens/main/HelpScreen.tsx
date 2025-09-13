import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

const HelpScreen = () => {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  const faqData = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: 'play-circle-filled',
      questions: [
        {
          q: 'How do I create an account?',
          a: 'Tap "Sign Up" on the login screen and fill in your details. You\'ll receive a verification email to complete registration.'
        },
        {
          q: 'How do I report a scam?',
          a: 'Go to the Home screen and tap "Report Scam" or use the Create Report option. Fill in the details and submit your report.'
        },
        {
          q: 'How do I search for scams?',
          a: 'Use the Search tab to look for specific phone numbers, emails, websites, or scam categories.'
        }
      ]
    },
    {
      id: 'reporting',
      title: 'Reporting Scams',
      icon: 'report',
      questions: [
        {
          q: 'What information should I include in my report?',
          a: 'Include the scammer\'s contact details, what type of scam it was, how much money you lost (if any), and a detailed description of what happened.'
        },
        {
          q: 'Can I upload evidence with my report?',
          a: 'Yes! You can upload screenshots, documents, photos, or videos that support your report. This helps verify the scam.'
        },
        {
          q: 'How long does it take to verify a report?',
          a: 'Our moderators typically review reports within 24-48 hours. You\'ll be notified when your report is verified or if we need more information.'
        },
        {
          q: 'Can I edit or delete my report?',
          a: 'You can edit your report if it\'s still pending review. Once verified, you\'ll need to contact support to make changes.'
        }
      ]
    },
    {
      id: 'account',
      title: 'Account & Profile',
      icon: 'person',
      questions: [
        {
          q: 'How do I change my password?',
          a: 'Go to Profile > Edit Profile > Change Password. You\'ll need to enter your current password and create a new one.'
        },
        {
          q: 'How do I update my profile information?',
          a: 'Tap on Profile > Edit Profile to update your name, email, phone number, and other details.'
        },
        {
          q: 'What if I forgot my password?',
          a: 'On the login screen, tap "Forgot Password?" and enter your email. We\'ll send you a reset link.'
        },
        {
          q: 'How do I delete my account?',
          a: 'Contact our support team at support@scamnepal.com to request account deletion. This action cannot be undone.'
        }
      ]
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: 'security',
      questions: [
        {
          q: 'Is my personal information safe?',
          a: 'Yes, we take privacy seriously. Your personal details are encrypted and only used to verify reports. We never share your information with third parties.'
        },
        {
          q: 'Can I report anonymously?',
          a: 'While you need an account to submit reports, your personal information is not displayed publicly. Only verified moderators can see your details.'
        },
        {
          q: 'How do you protect against false reports?',
          a: 'All reports are reviewed by our moderation team. We verify evidence and cross-check information before marking reports as verified.'
        }
      ]
    },
    {
      id: 'technical',
      title: 'Technical Support',
      icon: 'build',
      questions: [
        {
          q: 'The app is not working properly. What should I do?',
          a: 'Try closing and reopening the app, or restart your device. If the problem persists, contact our support team.'
        },
        {
          q: 'I can\'t upload files. What\'s wrong?',
          a: 'Make sure your files are under 10MB and in supported formats (JPG, PNG, PDF, MP4, MP3). Check your internet connection.'
        },
        {
          q: 'The app is slow or crashes frequently.',
          a: 'Make sure you have the latest version of the app and sufficient storage space on your device. Try clearing the app cache.'
        }
      ]
    }
  ];

  const contactMethods = [
    {
      title: 'Email Support',
      description: 'Get help via email',
      icon: 'email',
      action: () => Linking.openURL('mailto:support@scamnepal.com'),
      color: '#2196F3'
    },
    {
      title: 'Phone Support',
      description: 'Call us directly',
      icon: 'phone',
      action: () => Linking.openURL('tel:+9771234567890'),
      color: '#4CAF50'
    },
    {
      title: 'Live Chat',
      description: 'Chat with our team',
      icon: 'chat',
      action: () => Alert.alert('Coming Soon', 'Live chat will be available soon'),
      color: '#FF9800'
    },
    {
      title: 'Report Bug',
      description: 'Report technical issues',
      icon: 'bug-report',
      action: () => Linking.openURL('mailto:bugs@scamnepal.com?subject=Bug Report'),
      color: '#f44336'
    }
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const renderFAQSection = (section: any) => (
    <View key={section.id} style={styles.faqSection}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => toggleSection(section.id)}
      >
        <View style={styles.sectionTitleContainer}>
          <Icon name={section.icon as any} size={24} color="#2196F3" />
          <Text style={styles.sectionTitleText}>{section.title}</Text>
        </View>
        <Icon
          name={expandedSections[section.id] ? 'expand-less' : 'expand-more'}
          size={24}
          color="#666"
        />
      </TouchableOpacity>
      
      {expandedSections[section.id] && (
        <View style={styles.questionsContainer}>
          {section.questions.map((item: any, index: number) => (
            <View key={index} style={styles.questionItem}>
              <Text style={styles.question}>{item.q}</Text>
              <Text style={styles.answer}>{item.a}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Help & Support</Text>
        <Text style={styles.subtitle}>Get help and find answers to common questions</Text>
      </View>

      <View style={styles.content}>
        {/* Contact Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.contactGrid}>
            {contactMethods.map((method, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.contactCard, { borderLeftColor: method.color }]}
                onPress={method.action}
              >
                <Icon name={method.icon as any} size={32} color={method.color} />
                <Text style={styles.contactTitle}>{method.title}</Text>
                <Text style={styles.contactDescription}>{method.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Tips</Text>
          <View style={styles.tipsContainer}>
            <View style={styles.tipItem}>
              <Icon name="lightbulb" size={20} color="#FFC107" />
              <Text style={styles.tipText}>
                Always verify the identity of people asking for money or personal information
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="lightbulb" size={20} color="#FFC107" />
              <Text style={styles.tipText}>
                Check our database before making any financial transactions
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="lightbulb" size={20} color="#FFC107" />
              <Text style={styles.tipText}>
                Report suspicious activities immediately to help protect others
              </Text>
            </View>
          </View>
        </View>

        {/* FAQ Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqData.map(renderFAQSection)}
        </View>

        {/* App Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Updated</Text>
              <Text style={styles.infoValue}>January 2024</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Platform</Text>
              <Text style={styles.infoValue}>React Native</Text>
            </View>
          </View>
        </View>

        {/* Legal Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.legalLinks}>
            <TouchableOpacity style={styles.legalLink}>
              <Icon name="description" size={20} color="#666" />
              <Text style={styles.legalLinkText}>Terms of Service</Text>
              <Icon name="chevron-right" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.legalLink}>
              <Icon name="privacy-tip" size={20} color="#666" />
              <Text style={styles.legalLinkText}>Privacy Policy</Text>
              <Icon name="chevron-right" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.legalLink}>
              <Icon name="gavel" size={20} color="#666" />
              <Text style={styles.legalLinkText}>Disclaimer</Text>
              <Icon name="chevron-right" size={20} color="#666" />
            </TouchableOpacity>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  contactCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  contactDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  tipsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  faqSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  questionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  questionItem: {
    marginBottom: 16,
  },
  question: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  answer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  legalLinks: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  legalLinkText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
});

export default HelpScreen;

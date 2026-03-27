import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function TermsAndConditions() {
  const { colors } = useThemeColors();
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <LinearGradient
      colors={['#0A1929', '#0F2942', '#1A3A5F']}
      style={styles.container}
    >
      <Stack.Screen 
        options={{ 
          title: 'Terms & Conditions',
          headerStyle: { backgroundColor: 'transparent' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { color: '#FFFFFF' },
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Terms and Conditions</Text>
        <Text style={styles.date}>Last updated: June 9, 2025</Text>
        
        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By accessing or using YipYap, you agree to be bound by these Terms and Conditions and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this app.
        </Text>
        
        <Text style={styles.sectionTitle}>2. Use License</Text>
        <Text style={styles.paragraph}>
          Permission is granted to temporarily download one copy of the app for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
        </Text>
        <Text style={styles.listItem}>• Modify or copy the materials</Text>
        <Text style={styles.listItem}>• Use the materials for any commercial purpose</Text>
        <Text style={styles.listItem}>• Attempt to decompile or reverse engineer any software contained in YipYap</Text>
        <Text style={styles.listItem}>• Remove any copyright or other proprietary notations from the materials</Text>
        <Text style={styles.listItem}>• Transfer the materials to another person or "mirror" the materials on any other server</Text>
        
        <Text style={styles.sectionTitle}>3. User Content</Text>
        <Text style={styles.paragraph}>
          Users may post content such as photos, videos, and text messages. By posting content, you grant YipYap a non-exclusive, transferable, sub-licensable, royalty-free, worldwide license to use, modify, publicly perform, publicly display, reproduce, and distribute such content on and through the Service.
        </Text>
        
        <Text style={styles.sectionTitle}>4. Prohibited Activities</Text>
        <Text style={styles.paragraph}>
          The following activities are prohibited:
        </Text>
        <Text style={styles.listItem}>• Harassment or bullying of other users</Text>
        <Text style={styles.listItem}>• Posting illegal, harmful, or explicit content</Text>
        <Text style={styles.listItem}>• Impersonating others</Text>
        <Text style={styles.listItem}>• Creating multiple accounts</Text>
        <Text style={styles.listItem}>• Attempting to access private information</Text>
        
        <Text style={styles.sectionTitle}>5. Privacy Policy</Text>
        <Text style={styles.paragraph}>
          Your use of YipYap is also governed by our Privacy Policy, which is incorporated by reference into these Terms and Conditions.
        </Text>
        
        <Text style={styles.sectionTitle}>6. Termination</Text>
        <Text style={styles.paragraph}>
          We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
        </Text>
        
        <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          In no event shall YipYap, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
        </Text>
        
        <Text style={styles.sectionTitle}>8. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          YipYap reserves the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.
        </Text>
        
        <Text style={styles.sectionTitle}>9. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about these Terms, please contact us at support@yipyap.com.
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 100,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  listItem: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    paddingLeft: 16,
  },
  backButton: {
    marginLeft: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});
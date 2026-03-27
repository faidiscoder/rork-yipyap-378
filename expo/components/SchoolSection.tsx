import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function SchoolSection() {
  const router = useRouter();
  const { colors, isDark } = useThemeColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>Your School</Text>
      <Pressable 
        style={[styles.card, { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' }]}
        onPress={() => router.push('/school')}
      >
        <Text style={[styles.schoolName, { color: colors.primary }]}>Add Your School</Text>
        <Text style={[styles.description, { color: isDark ? '#BBBBBB' : '#666' }]}>
          Connect with students from your school
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    gap: 4,
  },
  schoolName: {
    fontSize: 17,
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
  },
});
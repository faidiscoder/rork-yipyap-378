import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Search, ArrowLeft, MapPin, School } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { School as SchoolType } from '@/types/user';
import { realSchools } from '@/data/schools';

export default function SchoolSearchScreen() {
  const { colors } = useThemeColors();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'public' | 'private' | 'charter'>('all');
  const [isStatePickerVisible, setIsStatePickerVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get all states for the filter
  const allStates = [...new Set(realSchools.map(school => school.state))].sort();
  
  // Search schools based on query, state, and type
  const filteredSchools = React.useMemo(() => {
    let filtered = [...realSchools];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(school => 
        school.name.toLowerCase().includes(query) || 
        school.city.toLowerCase().includes(query) || 
        school.state.toLowerCase().includes(query)
      );
    }
    
    if (selectedState !== 'all') {
      filtered = filtered.filter(school => school.state === selectedState);
    }
    
    if (selectedType !== 'all') {
      filtered = filtered.filter(school => school.type === selectedType);
    }
    
    return filtered;
  }, [searchQuery, selectedState, selectedType]);

  const handleSchoolSelect = (school: SchoolType) => {
    router.push(`/school/${school.id}`);
  };

  const renderSchoolItem = ({ item }: { item: SchoolType }) => (
    <TouchableOpacity
      style={[styles.schoolItem, { backgroundColor: colors.card }]}
      onPress={() => handleSchoolSelect(item)}
    >
      <View style={styles.schoolIcon}>
        <School size={24} color={colors.primary} />
      </View>
      <View style={styles.schoolInfo}>
        <Text style={[styles.schoolName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.schoolLocation, { color: colors.subtext }]}>
          {item.city}, {item.state}
        </Text>
        <View style={[styles.typeBadge, { 
          backgroundColor: 
            item.type === 'public' ? 'rgba(76, 217, 100, 0.2)' : 
            item.type === 'private' ? 'rgba(255, 149, 0, 0.2)' : 
            'rgba(90, 200, 250, 0.2)'
        }]}>
          <Text style={[styles.typeText, { 
            color: 
              item.type === 'public' ? 'rgb(76, 217, 100)' : 
              item.type === 'private' ? 'rgb(255, 149, 0)' : 
              'rgb(90, 200, 250)'
          }]}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
        </View>
      </View>
      <MapPin size={20} color={colors.subtext} />
    </TouchableOpacity>
  );

  const renderStateItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.stateItem,
        selectedState === item && { backgroundColor: colors.primary + '20' }
      ]}
      onPress={() => {
        setSelectedState(item);
        setIsStatePickerVisible(false);
      }}
    >
      <Text style={[
        styles.stateText,
        selectedState === item && { color: colors.primary, fontWeight: '600' },
        { color: colors.text }
      ]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Find Your School',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <Search size={20} color={colors.subtext} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search schools..."
          placeholderTextColor={colors.subtext}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.card }]}
          onPress={() => setIsStatePickerVisible(!isStatePickerVisible)}
        >
          <Text style={[styles.filterText, { color: colors.text }]}>
            {selectedState === 'all' ? 'All States' : selectedState}
          </Text>
        </TouchableOpacity>

        <View style={styles.typeFilters}>
          {(['all', 'public', 'private', 'charter'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                selectedType === type && { backgroundColor: colors.primary },
                { borderColor: colors.border }
              ]}
              onPress={() => setSelectedType(type)}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  { color: selectedType === type ? '#FFFFFF' : colors.text }
                ]}
              >
                {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isStatePickerVisible && (
        <View style={[styles.statePickerContainer, { backgroundColor: colors.card }]}>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <FlatList
              data={['all', ...allStates]}
              renderItem={renderStateItem}
              keyExtractor={(item) => item}
              style={styles.stateList}
            />
          )}
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredSchools}
          renderItem={renderSchoolItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.schoolsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                {searchQuery.length > 0 || selectedState !== 'all' || selectedType !== 'all'
                  ? "No schools found matching your criteria"
                  : "Search for your school by name, city, or state"}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  filterText: {
    fontSize: 16,
  },
  typeFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statePickerContainer: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    maxHeight: 300,
    borderRadius: 12,
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stateList: {
    padding: 8,
  },
  stateItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  stateText: {
    fontSize: 16,
  },
  schoolsList: {
    padding: 16,
  },
  schoolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  schoolIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
  },
  schoolInfo: {
    flex: 1,
    marginLeft: 16,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: '600',
  },
  schoolLocation: {
    fontSize: 14,
    marginTop: 2,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  Platform,
  StatusBar,
  KeyboardAvoidingView
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Camera,
  Type,
  Hash,
  DollarSign
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreatePartyScreen() {
  const router = useRouter();
  const { colors, isDark } = useThemeColors();
  const { currentUser, createParty } = useUserStore();
  
  const [partyName, setPartyName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [maxGuests, setMaxGuests] = useState('');
  const [emoji, setEmoji] = useState('🎉');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const emojiOptions = ['🎉', '🎊', '🎈', '🎂', '🍕', '🍻', '🎵', '🎮', '🏀', '🎭', '🌟', '🔥'];

  useEffect(() => {
    if (!currentUser) {
      Alert.alert('Please log in', 'You need to be logged in to create parties');
      router.back();
    }
  }, [currentUser]);

  const handleCreateParty = async () => {
    if (!partyName.trim()) {
      Alert.alert('Error', 'Please enter a party name');
      return;
    }

    if (!location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }

    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to create a party');
      return;
    }

    setIsLoading(true);

    try {
      // Combine date and time
      const partyDateTime = new Date(date);
      partyDateTime.setHours(time.getHours());
      partyDateTime.setMinutes(time.getMinutes());

      const partyData = {
        title: partyName.trim(),
        description: description.trim(),
        location: location.trim(),
        date: partyDateTime.getTime(), // Convert to timestamp
        maxAttendees: maxGuests ? parseInt(maxGuests) : undefined,
        emoji,
      };

      const result = await createParty(partyData);
      
      if (result && result.id) {
        Alert.alert(
          'Party Created!', 
          'Your party has been created successfully.',
          [
            {
              text: 'View Party',
              onPress: () => {
                router.replace(`/party/${result.id}`);
              }
            }
          ]
        );
      } else {
        throw new Error('Failed to create party');
      }
    } catch (error) {
      console.error('Error creating party:', error);
      Alert.alert('Error', 'Failed to create party. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, isDark && styles.darkContainer]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: 'Create Party',
          headerStyle: { backgroundColor: isDark ? '#121212' : '#FFFFFF' },
          headerTintColor: isDark ? '#FFFFFF' : '#333333',
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ArrowLeft size={24} color={isDark ? '#FFFFFF' : '#333333'} />
            </TouchableOpacity>
          ),
        }} 
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={isDark ? ['#1e3a5f', '#2d5a87'] : ['#f0f9ff', '#e0f2fe']}
          style={styles.header}
        >
          <Text style={[styles.headerTitle, isDark && { color: '#FFFFFF' }]}>
            Create Your Party
          </Text>
          <Text style={[styles.headerSubtitle, isDark && { color: 'rgba(255, 255, 255, 0.7)' }]}>
            Plan an amazing event for your friends
          </Text>
        </LinearGradient>

        <View style={styles.form}>
          {/* Party Name */}
          <View style={[styles.inputGroup, isDark && styles.darkInputGroup]}>
            <View style={styles.inputHeader}>
              <Type size={20} color={colors.primary} />
              <Text style={[styles.inputLabel, isDark && { color: '#FFFFFF' }]}>Party Name</Text>
            </View>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              placeholder="What's your party called?"
              placeholderTextColor={isDark ? '#999999' : '#666666'}
              value={partyName}
              onChangeText={setPartyName}
              maxLength={50}
            />
          </View>

          {/* Emoji Selection */}
          <View style={[styles.inputGroup, isDark && styles.darkInputGroup]}>
            <View style={styles.inputHeader}>
              <Text style={[styles.inputLabel, isDark && { color: '#FFFFFF' }]}>Party Emoji</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiContainer}>
              {emojiOptions.map((emojiOption) => (
                <TouchableOpacity
                  key={emojiOption}
                  style={[
                    styles.emojiButton,
                    emoji === emojiOption && styles.selectedEmoji,
                    isDark && styles.darkEmojiButton
                  ]}
                  onPress={() => setEmoji(emojiOption)}
                >
                  <Text style={styles.emojiText}>{emojiOption}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Description */}
          <View style={[styles.inputGroup, isDark && styles.darkInputGroup]}>
            <View style={styles.inputHeader}>
              <Hash size={20} color={colors.primary} />
              <Text style={[styles.inputLabel, isDark && { color: '#FFFFFF' }]}>Description</Text>
            </View>
            <TextInput
              style={[styles.textArea, isDark && styles.darkInput]}
              placeholder="Tell people what to expect..."
              placeholderTextColor={isDark ? '#999999' : '#666666'}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>

          {/* Location */}
          <View style={[styles.inputGroup, isDark && styles.darkInputGroup]}>
            <View style={styles.inputHeader}>
              <MapPin size={20} color={colors.primary} />
              <Text style={[styles.inputLabel, isDark && { color: '#FFFFFF' }]}>Location</Text>
            </View>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              placeholder="Where's the party?"
              placeholderTextColor={isDark ? '#999999' : '#666666'}
              value={location}
              onChangeText={setLocation}
              maxLength={100}
            />
          </View>

          {/* Date */}
          <View style={[styles.inputGroup, isDark && styles.darkInputGroup]}>
            <View style={styles.inputHeader}>
              <Calendar size={20} color={colors.primary} />
              <Text style={[styles.inputLabel, isDark && { color: '#FFFFFF' }]}>Date</Text>
            </View>
            <TouchableOpacity
              style={[styles.dateTimeButton, isDark && styles.darkDateTimeButton]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.dateTimeText, isDark && { color: '#FFFFFF' }]}>
                {formatDate(date)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Time */}
          <View style={[styles.inputGroup, isDark && styles.darkInputGroup]}>
            <View style={styles.inputHeader}>
              <Clock size={20} color={colors.primary} />
              <Text style={[styles.inputLabel, isDark && { color: '#FFFFFF' }]}>Time</Text>
            </View>
            <TouchableOpacity
              style={[styles.dateTimeButton, isDark && styles.darkDateTimeButton]}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={[styles.dateTimeText, isDark && { color: '#FFFFFF' }]}>
                {formatTime(time)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Max Guests */}
          <View style={[styles.inputGroup, isDark && styles.darkInputGroup]}>
            <View style={styles.inputHeader}>
              <Users size={20} color={colors.primary} />
              <Text style={[styles.inputLabel, isDark && { color: '#FFFFFF' }]}>Max Guests (Optional)</Text>
            </View>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              placeholder="How many people can come?"
              placeholderTextColor={isDark ? '#999999' : '#666666'}
              value={maxGuests}
              onChangeText={setMaxGuests}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>

          {/* Info about private parties */}
          <View style={[styles.inputGroup, isDark && styles.darkInputGroup]}>
            <View style={styles.inputHeader}>
              <Text style={[styles.inputLabel, isDark && { color: '#FFFFFF' }]}>Party Privacy</Text>
            </View>
            <Text style={[styles.privacyDescription, isDark && { color: '#BBBBBB' }]}>
              All parties are private and invite-only. Only people you invite can see and join your party.
            </Text>
          </View>
        </View>

        {/* Date/Time Pickers */}
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setDate(selectedDate);
              }
            }}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) {
                setTime(selectedTime);
              }
            }}
          />
        )}
      </ScrollView>

      {/* Create Button */}
      <View style={[styles.footer, isDark && styles.darkFooter]}>
        <TouchableOpacity
          style={[
            styles.createButton,
            (!partyName.trim() || !location.trim() || isLoading) && styles.disabledButton
          ]}
          onPress={handleCreateParty}
          disabled={!partyName.trim() || !location.trim() || isLoading}
        >
          <Text style={styles.createButtonText}>
            {isLoading ? 'Creating...' : 'Create Party 🎉'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  backButton: {
    marginLeft: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  form: {
    padding: 20,
    gap: 20,
  },
  inputGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  darkInputGroup: {
    backgroundColor: '#1A1A1A',
    shadowOpacity: 0.2,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#F8F8F8',
  },
  darkInput: {
    borderColor: '#333333',
    backgroundColor: '#2A2A2A',
    color: '#FFFFFF',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#F8F8F8',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  emojiContainer: {
    flexDirection: 'row',
  },
  emojiButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  darkEmojiButton: {
    backgroundColor: '#2A2A2A',
  },
  selectedEmoji: {
    borderColor: '#0066CC',
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
  },
  emojiText: {
    fontSize: 24,
  },
  dateTimeButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F8F8F8',
  },
  darkDateTimeButton: {
    borderColor: '#333333',
    backgroundColor: '#2A2A2A',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#333333',
  },
  privacyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    padding: 2,
  },
  darkToggleButton: {
    backgroundColor: '#333333',
  },
  toggleButtonActive: {
    backgroundColor: '#0066CC',
  },
  toggleIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleIndicatorActive: {
    alignSelf: 'flex-end',
  },
  privacyDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  darkFooter: {
    backgroundColor: '#1A1A1A',
    borderTopColor: '#333333',
  },
  createButton: {
    backgroundColor: '#0066CC',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
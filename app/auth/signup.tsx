import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,

  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff, ChevronLeft, ChevronRight, Camera, Calendar } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { YipYapLogo } from '@/components/YipYapLogo';
import { trpc } from '@/lib/trpc';



// Gender options - only Male and Female
const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];

// Relationship status options
const RELATIONSHIP_OPTIONS = [
  { label: 'Single', value: 'single' },
  { label: 'Dating', value: 'dating' },
  { label: 'Taken', value: 'taken' },
  { label: 'Complicated', value: 'complicated' },
  { label: 'Private', value: 'private' },
];

// Interest options - expanded list
const INTEREST_OPTIONS = [
  'Sports', 'Music', 'Art', 'Gaming', 'Reading', 
  'Travel', 'Food', 'Movies', 'Technology', 'Fashion',
  'Fitness', 'Photography', 'Dance', 'Cooking', 'Hiking',
  'Swimming', 'Basketball', 'Football', 'Soccer', 'Tennis',
  'Volleyball', 'Baseball', 'Golf', 'Running', 'Cycling',
  'Yoga', 'Meditation', 'Writing', 'Drawing', 'Painting',
  'Singing', 'Guitar', 'Piano', 'Drums', 'Theater',
  'Comedy', 'Podcasts', 'Anime', 'Comics', 'Board Games',
  'Video Games', 'Streaming', 'Netflix', 'YouTube', 'TikTok',
  'Instagram', 'Snapchat', 'Shopping', 'Thrifting', 'DIY',
  'Crafts', 'Gardening', 'Pets', 'Dogs', 'Cats',
  'Nature', 'Beach', 'Mountains', 'Camping', 'Fishing',
  'Skateboarding', 'Surfing', 'Snowboarding', 'Rock Climbing', 'Martial Arts',
  'Coding', 'Science', 'History', 'Languages', 'Volunteering',
  'Entrepreneurship', 'Investing', 'Real Estate', 'Cryptocurrency', 'NFTs',
  'Astrology', 'Spirituality', 'Philosophy', 'Psychology', 'Sociology',
  'Economics', 'Politics', 'Journalism', 'Creative Writing', 'Poetry',
  'Stand-up Comedy', 'Improv', 'Magic', 'Juggling', 'Origami',
  'Knitting', 'Sewing', 'Woodworking', 'Metalworking', 'Pottery',
  'Jewelry Making', 'Candle Making', 'Soap Making', 'Brewing', 'Wine Tasting',
  'Baking', 'Grilling', 'Mixology', 'Coffee', 'Tea',
  'Collecting', 'Antiques', 'Vintage', 'Thrift Shopping', 'Flea Markets',
  'Concerts', 'Festivals', 'Clubbing', 'Bars', 'Karaoke',
  'Trivia', 'Escape Rooms', 'Bowling', 'Mini Golf', 'Arcade Games',
  'Video Editing', 'Content Creation', 'Blogging', 'Vlogging', 'Podcasting',
  'Social Media', 'Influencing', 'Marketing', 'Business', 'Startups'
];

export default function SignupScreen() {
  const router = useRouter();
  const { setUser, setToken, isUserBanned } = useUserStore();
  const registerMutation = trpc.auth.register.useMutation();
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  
  // Step 1 fields
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState('male');
  
  // Step 2 fields
  const [avatar, setAvatar] = useState('');
  
  // Step 3 fields
  const [highSchool, setHighSchool] = useState('');
  const [relationshipStatus, setRelationshipStatus] = useState('single');
  
  // Step 4 fields
  const [interests, setInterests] = useState<string[]>([]);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Validation states
  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [dateError, setDateError] = useState('');
  const [error, setError] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Calculate age from date of birth
  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };
  
  // Validate email
  const validateEmail = async (email: string) => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    // Mock validation - always available except for admin15
    if (email.trim().toLowerCase() === 'admin15') {
      setEmailError('This email is reserved');
      return false;
    }
    
    setEmailError('');
    return true;
  };
  
  // Validate username
  const validateUsername = async (username: string) => {
    if (!username) {
      setUsernameError('Username is required');
      return false;
    }
    
    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return false;
    }
    
    // Mock validation - always available except for admin15
    if (username === 'admin15') {
      setUsernameError('This username is reserved');
      return false;
    }
    
    setUsernameError('');
    return true;
  };
  
  // Validate password
  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    
    // Check for at least one uppercase letter, one lowercase letter, and one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      setPasswordError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return false;
    }
    
    setPasswordError('');
    return true;
  };
  
  // Validate confirm password
  const validateConfirmPassword = (confirmPassword: string) => {
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    
    if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    
    setConfirmPasswordError('');
    return true;
  };
  
  // Validate date of birth
  const validateDateOfBirth = (date: Date) => {
    const age = calculateAge(date);
    
    if (age < 13) {
      setDateError('You must be at least 13 years old');
      return false;
    }
    
    if (age > 120) {
      setDateError('Please enter a valid date of birth');
      return false;
    }
    
    setDateError('');
    return true;
  };
  
  // Toggle interest selection
  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else if (interests.length < 10) { // Limit to 10 interests
      setInterests([...interests, interest]);
    } else {
      Alert.alert('Maximum Interests', 'You can select up to 10 interests');
    }
  };

  // Handle profile picture selection
  const selectProfilePicture = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting profile picture:', error);
      Alert.alert('Error', 'Failed to select profile picture');
    }
  };

  // Handle date change
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateOfBirth(selectedDate);
      validateDateOfBirth(selectedDate);
    }
  };
  
  // Handle next step
  const handleNextStep = async () => {
    if (isLoading) return; // Prevent multiple clicks
    
    if (currentStep === 1) {
      // Validate step 1 fields
      try {
        const isEmailValid = await validateEmail(email);
        const isUsernameValid = await validateUsername(username);
        const isPasswordValid = validatePassword(password);
        const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);
        const isDateValid = validateDateOfBirth(dateOfBirth);
        
        if (isEmailValid && isUsernameValid && isPasswordValid && isConfirmPasswordValid && isDateValid) {
          setCurrentStep(2);
        }
      } catch (error) {
        console.error('Validation error:', error);
      }
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setCurrentStep(5);
    }
  };
  
  // Handle previous step
  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Handle signup
  const handleSignup = async () => {
    if (isLoading) return;
    try {
      setError('');
      setIsLoading(true);
      console.log('🔐 Attempting registration with email:', email.trim().toLowerCase());
      const result = await registerMutation.mutateAsync({
        email: email.trim().toLowerCase(),
        username,
        password,
        displayName: displayName || username,
        age: calculateAge(dateOfBirth),
        avatar,
        highSchool,
        interests,
        relationshipStatus,
      });
      console.log('📦 Registration result:', result);
      if (result?.user && result?.token) {
        if (isUserBanned(result.user.id)) {
          setError('Your account has been suspended. Please contact support.');
          setIsLoading(false);
          return;
        }
        console.log('💾 Saving user and token...');
        await setToken(result.token as string);
        await setUser(result.user as any);
        console.log('✅ Registration successful - user should be redirected');
      } else {
        setError('Invalid response from server');
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      setError(error?.message ?? 'Registration failed. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Render gender options
  const renderGenderOptions = () => {
    return (
      <View style={styles.optionsContainer}>
        {GENDER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              gender === option.value && styles.selectedOption
            ]}
            onPress={() => setGender(option.value)}
          >
            <Text
              style={[
                styles.optionText,
                gender === option.value && styles.selectedOptionText
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
  // Render relationship status options
  const renderRelationshipOptions = () => {
    return (
      <View style={styles.optionsContainer}>
        {RELATIONSHIP_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              relationshipStatus === option.value && styles.selectedOption
            ]}
            onPress={() => setRelationshipStatus(option.value)}
          >
            <Text
              style={[
                styles.optionText,
                relationshipStatus === option.value && styles.selectedOptionText
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
  // Render interests selection
  const renderInterestsSelection = () => {
    return (
      <View style={styles.interestsContainer}>
        <Text style={styles.interestsCounter}>
          Selected: {interests.length}/10
        </Text>
        <View style={styles.interestsGrid}>
          {INTEREST_OPTIONS.map((interest) => (
            <TouchableOpacity
              key={interest}
              style={[
                styles.interestButton,
                interests.includes(interest) && styles.selectedInterest
              ]}
              onPress={() => toggleInterest(interest)}
            >
              <Text
                style={[
                  styles.interestText,
                  interests.includes(interest) && styles.selectedInterestText
                ]}
              >
                {interest}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };
  
  // Render step 1
  const renderStep1 = () => (
    <>
      <Text style={styles.title}>Create Account</Text>
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, emailError ? styles.inputError : null]}
          placeholder="Enter your email"
          placeholderTextColor="#8E8E93"
          value={email}
          onChangeText={setEmail}
          onBlur={() => validateEmail(email)}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isLoading}
        />
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={[styles.input, usernameError ? styles.inputError : null]}
          placeholder="Choose a username"
          placeholderTextColor="#8E8E93"
          value={username}
          onChangeText={setUsername}
          onBlur={() => validateUsername(username)}
          autoCapitalize="none"
          editable={!isLoading}
        />
        {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Display Name (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor="#8E8E93"
          value={displayName}
          onChangeText={setDisplayName}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <View style={[styles.passwordContainer, passwordError ? styles.inputError : null]}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Create a password"
            placeholderTextColor="#8E8E93"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            onBlur={() => validatePassword(password)}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff size={20} color="#8E8E93" />
            ) : (
              <Eye size={20} color="#8E8E93" />
            )}
          </TouchableOpacity>
        </View>
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Confirm Password</Text>
        <View style={[styles.passwordContainer, confirmPasswordError ? styles.inputError : null]}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm your password"
            placeholderTextColor="#8E8E93"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            onBlur={() => validateConfirmPassword(confirmPassword)}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff size={20} color="#8E8E93" />
            ) : (
              <Eye size={20} color="#8E8E93" />
            )}
          </TouchableOpacity>
        </View>
        {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Date of Birth</Text>
        <TouchableOpacity
          style={[styles.dateButton, dateError ? styles.inputError : null]}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateButtonText}>
            {dateOfBirth.toLocaleDateString()}
          </Text>
          <Calendar size={20} color="#8E8E93" />
        </TouchableOpacity>
        {dateError ? <Text style={styles.errorText}>{dateError}</Text> : null}
        
        {showDatePicker && (
          <DateTimePicker
            value={dateOfBirth}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
          />
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Gender</Text>
        {renderGenderOptions()}
      </View>
      
      <TouchableOpacity
        style={[styles.nextButton, isLoading && styles.disabledButton]}
        onPress={handleNextStep}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.nextButtonText}>Next</Text>
            <ChevronRight size={20} color="#FFFFFF" />
          </>
        )}
      </TouchableOpacity>
    </>
  );

  // Render step 2
  const renderStep2 = () => (
    <>
      <Text style={styles.title}>Add Profile Picture</Text>
      
      <View style={styles.profilePictureContainer}>
        <TouchableOpacity style={styles.profilePictureButton} onPress={selectProfilePicture}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.profilePicture} />
          ) : (
            <View style={styles.profilePicturePlaceholder}>
              <Camera size={40} color="#CCCCCC" />
              <Text style={styles.profilePictureText}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.profilePictureSubtext}>
          {avatar ? 'Tap to change your profile picture' : 'Add a profile picture to help friends find you'}
        </Text>
      </View>
      
      <View style={styles.stepButtonsContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handlePreviousStep}
          disabled={isLoading}
        >
          <ChevronLeft size={20} color="#666666" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.nextButton, isLoading && styles.disabledButton]}
          onPress={handleNextStep}
          disabled={isLoading}
        >
          <Text style={styles.nextButtonText}>Next</Text>
          <ChevronRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </>
  );
  
  // Render step 3
  const renderStep3 = () => (
    <>
      <Text style={styles.title}>Tell us about yourself</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>High School (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your high school"
          placeholderTextColor="#8E8E93"
          value={highSchool}
          onChangeText={setHighSchool}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Relationship Status</Text>
        {renderRelationshipOptions()}
      </View>
      
      <View style={styles.stepButtonsContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handlePreviousStep}
          disabled={isLoading}
        >
          <ChevronLeft size={20} color="#666666" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.nextButton, isLoading && styles.disabledButton]}
          onPress={handleNextStep}
          disabled={isLoading}
        >
          <Text style={styles.nextButtonText}>Next</Text>
          <ChevronRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </>
  );

  // Render step 4
  const renderStep4 = () => (
    <>
      <Text style={styles.title}>Choose your interests</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Interests (Optional)</Text>
        {renderInterestsSelection()}
      </View>
      
      <View style={styles.stepButtonsContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handlePreviousStep}
          disabled={isLoading}
        >
          <ChevronLeft size={20} color="#666666" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.nextButton, isLoading && styles.disabledButton]}
          onPress={handleNextStep}
          disabled={isLoading}
        >
          <Text style={styles.nextButtonText}>Next</Text>
          <ChevronRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </>
  );

  // Render step 5 (final step)
  const renderStep5 = () => (
    <>
      <Text style={styles.title}>Review & Complete</Text>
      
      <View style={styles.reviewContainer}>
        <Text style={styles.reviewTitle}>Review your information:</Text>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Email:</Text>
          <Text style={styles.reviewValue}>{email}</Text>
        </View>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Username:</Text>
          <Text style={styles.reviewValue}>@{username}</Text>
        </View>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Age:</Text>
          <Text style={styles.reviewValue}>{calculateAge(dateOfBirth)} years old</Text>
        </View>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Gender:</Text>
          <Text style={styles.reviewValue}>{GENDER_OPTIONS.find(g => g.value === gender)?.label}</Text>
        </View>
        
        {highSchool && (
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>High School:</Text>
            <Text style={styles.reviewValue}>{highSchool}</Text>
          </View>
        )}
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Relationship:</Text>
          <Text style={styles.reviewValue}>{RELATIONSHIP_OPTIONS.find(r => r.value === relationshipStatus)?.label}</Text>
        </View>
        
        {interests.length > 0 && (
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Interests:</Text>
            <Text style={styles.reviewValue}>{interests.join(', ')}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.stepButtonsContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handlePreviousStep}
          disabled={isLoading}
        >
          <ChevronLeft size={20} color="#666666" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.signupButton, isLoading && styles.disabledButton]}
          onPress={handleSignup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.signupButtonText}>Sign Up</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#1e3a5f', '#2d5a87', '#3d7ab8']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.headerBackButton}
                onPress={() => router.back()}
              >
                <ChevronLeft size={24} color="white" />
              </TouchableOpacity>
              <YipYapLogo size="medium" />
              <View style={styles.placeholder} />
            </View>
            
            <Text style={styles.tagline}>Connect with friends nearby</Text>
            
            {/* Step indicator */}
            <View style={styles.stepIndicator}>
              <View style={styles.stepIndicatorContainer}>
                {Array.from({ length: totalSteps }, (_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.stepDot,
                      index + 1 <= currentStep && styles.stepDotActive
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.stepText}>
                Step {currentStep} of {totalSteps}
              </Text>
            </View>
            
            <View style={styles.formContainer}>
              {currentStep === 1 ? renderStep1() : 
               currentStep === 2 ? renderStep2() : 
               currentStep === 3 ? renderStep3() : 
               currentStep === 4 ? renderStep4() : renderStep5()}
              
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/auth/login')} testID="go-to-login">
                  <Text style={styles.loginLink}>Log In</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                By signing up, you agree to our Terms of Service and Privacy Policy
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  headerBackButton: {
    padding: 5,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    gap: 8,
    flex: 1,
  },
  backButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  placeholder: {
    width: 34,
  },
  stepIndicator: {
    alignItems: 'center',
    marginBottom: 20,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  stepDotActive: {
    backgroundColor: '#FFFFFF',
  },
  stepText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 12,
    marginTop: 5,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#D32F2F',
    borderWidth: 1,
  },
  passwordContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 15,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profilePictureButton: {
    marginBottom: 16,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profilePicturePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DDDDDD',
    borderStyle: 'dashed',
  },
  profilePictureText: {
    color: '#CCCCCC',
    fontSize: 14,
    marginTop: 8,
  },
  profilePictureSubtext: {
    color: '#666666',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 250,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
    gap: 8,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#3d7ab8',
  },
  optionText: {
    color: '#333',
    fontSize: 14,
  },
  selectedOptionText: {
    color: 'white',
    fontWeight: '500',
  },
  interestsContainer: {
    marginTop: 5,
  },
  interestsCounter: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedInterest: {
    backgroundColor: '#3d7ab8',
  },
  interestText: {
    color: '#333',
    fontSize: 14,
  },
  selectedInterestText: {
    color: 'white',
    fontWeight: '500',
  },
  reviewContainer: {
    marginBottom: 20,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  reviewItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    width: 100,
  },
  reviewValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    gap: 8,
    flex: 2,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 12,
  },
  signupButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    marginBottom: 20,
  },
  footerText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
});
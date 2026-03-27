import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useUserStore } from '@/store/userStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff } from 'lucide-react-native';
import { YipYapLogo } from '@/components/YipYapLogo';
import { trpc } from '@/lib/trpc';

export default function LoginScreen() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const { setUser, setToken, isUserBanned } = useUserStore();
  const loginMutation = trpc.auth.login.useMutation();
  
  const handleLogin = async () => {
    if (isLoading) return;
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError('Please enter both email and password');
      return;
    }
    setError('');
    setIsLoading(true);
    console.log('🔐 Attempting login with email:', trimmedEmail);
    try {
      const result = await loginMutation.mutateAsync({ email: trimmedEmail, password });
      console.log('📦 Login result:', result);
      if (result?.user && result?.token) {
        if (isUserBanned(result.user.id)) {
          setError('Your account has been suspended. Please contact support.');
          setIsLoading(false);
          return;
        }
        console.log('💾 Saving user and token...');
        await setToken(result.token as string);
        await setUser(result.user as any);
        console.log('✅ Login successful - user should be redirected');
      } else {
        setError('Invalid response from server');
        setIsLoading(false);
      }
    } catch (e: any) {
      console.error('❌ Login mutation error:', e);
      const msg = e?.message ?? 'Failed to login. Please try again.';
      setError(msg);
      setIsLoading(false);
    }
  };

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
          <View style={styles.header}>
            <YipYapLogo size="large" />
          </View>
          
          <Text style={styles.tagline}>Connect with friends nearby</Text>
          
          <View style={styles.formContainer}>
            <Text style={styles.title}>Welcome Back</Text>
            
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#8E8E93"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isLoading}
                autoCorrect={false}
                spellCheck={false}
                testID="login-email"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#8E8E93"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                  autoCorrect={false}
                  spellCheck={false}
                  testID="login-password"
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  testID="toggle-password-visibility"
                >
                  {showPassword ? 
                    <EyeOff size={20} color="#8E8E93" /> : 
                    <Eye size={20} color="#8E8E93" />
                  }
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => Alert.alert('Reset Password', 'Password reset functionality coming soon!')}
              disabled={isLoading}
              testID="forgot-password"
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isLoading}
              testID="login-submit"
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Log In</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don&apos;t have an account? </Text>
              <Link href="/auth/signup" asChild>
                <TouchableOpacity disabled={isLoading} testID="go-to-signup">
                  <Text style={styles.signupLink}>Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By logging in, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
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
    padding: 20,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#3d7ab8',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#FF9500',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupText: {
    color: '#666',
    fontSize: 14,
  },
  signupLink: {
    color: '#FF9500',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 'auto',
    marginBottom: 20,
  },
  footerText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
});
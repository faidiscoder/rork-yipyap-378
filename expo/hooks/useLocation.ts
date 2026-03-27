import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { Platform, Alert } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface LocationError {
  code: string;
  message: string;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<LocationError | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const lastLocationTime = useRef<number>(0);

  const requestLocation = async (forceRefresh = false) => {
    // Don't request location too frequently unless forced
    const now = Date.now();
    if (!forceRefresh && location && (now - lastLocationTime.current) < 10000) {
      return location;
    }

    if (Platform.OS === 'web') {
      // Web geolocation
      if (!navigator.geolocation) {
        setError({
          code: 'GEOLOCATION_NOT_SUPPORTED',
          message: 'Geolocation is not supported by this browser'
        });
        setLoading(false);
        return null;
      }

      setLoading(true);
      setError(null);

      return new Promise<LocationData | null>((resolve) => {
        const options = {
          enableHighAccuracy: false, // Use less accurate but faster location
          timeout: 10000, // Reduced timeout
          maximumAge: 60000 // Allow cached location up to 1 minute old
        };

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const locationData: LocationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude || undefined,
              heading: position.coords.heading || undefined,
              speed: position.coords.speed || undefined,
              timestamp: position.timestamp,
            };

            setLocation(locationData);
            setPermissionStatus('granted');
            setError(null);
            setLoading(false);
            lastLocationTime.current = now;
            resolve(locationData);
          },
          (err) => {
            let errorMessage = 'Unable to get your location';
            let errorCode = 'LOCATION_ERROR';

            switch (err.code) {
              case err.PERMISSION_DENIED:
                errorMessage = 'Location access denied. Please enable location permissions.';
                errorCode = 'PERMISSION_DENIED';
                setPermissionStatus('denied');
                break;
              case err.POSITION_UNAVAILABLE:
                errorMessage = 'Location information is unavailable.';
                errorCode = 'POSITION_UNAVAILABLE';
                break;
              case err.TIMEOUT:
                errorMessage = 'Location request timed out.';
                errorCode = 'TIMEOUT';
                break;
              default:
                errorMessage = 'An unknown error occurred while getting your location.';
                break;
            }

            setError({
              code: errorCode,
              message: errorMessage
            });
            setLoading(false);
            resolve(null);
          },
          options
        );
      });
    } else {
      // Native location
      try {
        setLoading(true);
        setError(null);
        
        // Check current permission status
        const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
        
        if (currentStatus !== 'granted') {
          // Show custom permission request dialog
          Alert.alert(
            "Location Access Required",
            "YipYap needs your location to find friends and events nearby. Your location is only shared when you choose to do so.",
            [
              { 
                text: "Not Now", 
                style: "cancel",
                onPress: () => {
                  setPermissionStatus('denied');
                  setError({
                    code: 'PERMISSION_DENIED',
                    message: 'Location permission denied. Please enable location access in settings.'
                  });
                  setLoading(false);
                }
              },
              { 
                text: "Allow Location Access", 
                onPress: async () => {
                  // Request permissions after user clicks allow
                  const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
                  
                  if (newStatus !== 'granted') {
                    setPermissionStatus('denied');
                    setError({
                      code: 'PERMISSION_DENIED',
                      message: 'Location permission denied. Please enable location access in settings.'
                    });
                    setLoading(false);
                    return null;
                  } else {
                    // Permission granted, continue with getting location
                    setPermissionStatus('granted');
                    const currentLocation = await Location.getCurrentPositionAsync({
                      accuracy: Location.Accuracy.Balanced,
                    });
                    
                    const locationData: LocationData = {
                      latitude: currentLocation.coords.latitude,
                      longitude: currentLocation.coords.longitude,
                      accuracy: currentLocation.coords.accuracy || undefined,
                      altitude: currentLocation.coords.altitude || undefined,
                      heading: currentLocation.coords.heading || undefined,
                      speed: currentLocation.coords.speed || undefined,
                      timestamp: currentLocation.timestamp,
                    };
                    
                    setLocation(locationData);
                    setError(null);
                    lastLocationTime.current = now;
                    setLoading(false);
                    return locationData;
                  }
                }
              }
            ],
            { cancelable: false }
          );
          return null;
        }

        setPermissionStatus('granted');

        // Get current location with reduced accuracy for faster response
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced, // Use balanced instead of best
        });

        const locationData: LocationData = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          accuracy: currentLocation.coords.accuracy || undefined,
          altitude: currentLocation.coords.altitude || undefined,
          heading: currentLocation.coords.heading || undefined,
          speed: currentLocation.coords.speed || undefined,
          timestamp: currentLocation.timestamp,
        };

        setLocation(locationData);
        setError(null);
        lastLocationTime.current = now;
        setLoading(false);
        return locationData;
      } catch (err: any) {
        console.error('Location error:', err);
        setError({
          code: 'LOCATION_ERROR',
          message: 'Unable to get your current location. Please try again.'
        });
        setLoading(false);
        return null;
      }
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    // Haversine formula
    const R = 3959; // Earth's radius in miles
    
    const toRadians = (degrees: number) => degrees * (Math.PI / 180);
    
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    
    const lat1Rad = toRadians(lat1);
    const lat2Rad = toRadians(lat2);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    // Round to 2 decimal places maximum
    return Math.round(distance * 100) / 100;
  };

  const validateLocation = (locationData: LocationData): boolean => {
    const { latitude, longitude, accuracy } = locationData;
    
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return false;
    }
    
    if (accuracy && accuracy > 100) { // Increased tolerance
      return false;
    }
    
    return true;
  };

  // Get initial location on mount (only once)
  useEffect(() => {
    // Don't auto-request location, let components request it when needed
    setLoading(false);
  }, []);

  return {
    location,
    error,
    loading,
    permissionStatus,
    requestLocation,
    calculateDistance,
    validateLocation,
  };
}
import React from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { createTRPCReact } from '@trpc/react-query';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from '../backend/trpc/app-router';
import superjson from 'superjson';

// Extend global interface for auth token
declare global {
  var authToken: string | undefined;
}

// Get the base URL for the API
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    try {
      const explicit = (globalThis as any).__BACKEND_URL || (process as any)?.env?.EXPO_PUBLIC_BACKEND_URL;
      if (explicit && typeof explicit === 'string') {
        console.log('🔗 Using explicit backend URL:', explicit);
        return explicit.replace(/\/$/, '');
      }
      const origin = (globalThis as any)?.location?.origin as string | undefined;
      if (origin) {
        let backendUrl;
        if (origin.includes(':19006')) backendUrl = origin.replace(':19006', ':3000');
        else if (origin.includes(':8081')) backendUrl = origin.replace(':8081', ':3000');
        else backendUrl = origin.replace(/\/$/, '');
        console.log('🔗 Using origin-based backend URL:', backendUrl);
        return backendUrl;
      }
    } catch (e) {
      console.error('Error getting backend URL:', e);
    }
    console.log('🔗 Using default web backend URL: http://localhost:3000');
    return 'http://localhost:3000';
  }
  const expoHostUri = (Constants as any)?.expoGoConfig?.hostUri as string | undefined;
  if (expoHostUri) {
    const host = expoHostUri.split(':')[0];
    const url = `http://${host}:3000`;
    console.log('🔗 Using Expo host backend URL:', url);
    return url;
  }
  const envUrl = (global as any).BACKEND_URL as string | undefined;
  if (envUrl) {
    console.log('🔗 Using global BACKEND_URL:', envUrl);
    return envUrl.replace(/\/$/, '');
  }
  console.log('🔗 Using default mobile backend URL: http://localhost:3000');
  return 'http://localhost:3000';
};

const baseUrl = `${getBaseUrl()}/api/trpc`;

console.log('🔗 TRPC Client connecting to:', baseUrl);

// Create the tRPC React hooks
export const trpc = createTRPCReact<AppRouter>();

// Create a vanilla tRPC client for non-React usage
export const trpcClient = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      headers: () => {
        const token = (global as any).authToken || null;
        return {
          authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        };
      },
      fetch: async (url, options) => {
        console.log('🌐 TRPC vanilla fetch request:', { url, method: options?.method });
        try {
          const response = await fetch(url, {
            ...options,
            headers: {
              ...options?.headers,
              'Content-Type': 'application/json',
            },
          });
          console.log('📡 TRPC vanilla fetch response:', { 
            status: response.status, 
            statusText: response.statusText,
            url: response.url 
          });
          if (!response.ok) {
            console.error('❌ TRPC vanilla response error:', {
              status: response.status,
              statusText: response.statusText,
              url: response.url
            });
            // Try to get error details
            try {
              const errorText = await response.clone().text();
              console.error('❌ Error body:', errorText);
            } catch {}
          }
          return response;
        } catch (fetchError: any) {
          console.error('❌ TRPC vanilla fetch error:', {
            message: fetchError.message,
            url
          });
          throw fetchError;
        }
      },
    }),
  ],
});

// Create a query client with better error handling and production-ready settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.data?.httpStatus >= 400 && error?.data?.httpStatus < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
      onError: (error: any) => {
        console.error('🔥 React Query error:', error);
      },
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry mutations on client errors
        if (error?.data?.httpStatus >= 400 && error?.data?.httpStatus < 500) {
          return false;
        }
        // Only retry once for mutations
        return failureCount < 1;
      },
      onError: (error: any) => {
        console.error('🔥 React Query mutation error:', error);
      },
    },
  },
});

// TRPC Provider component
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(() =>
    trpc.createClient({
      transformer: superjson,
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          headers: () => {
            const token = (global as any).authToken || null;
            return {
              authorization: token ? `Bearer ${token}` : '',
              'Content-Type': 'application/json',
            };
          },
          fetch: async (url, options) => {
            console.log('🌐 TRPC React fetch request:', { url, method: options?.method });
            const response = await fetch(url, {
              ...options,
              headers: {
                ...options?.headers,
                'Content-Type': 'application/json',
              },
            });
            console.log('📡 TRPC React fetch response:', { 
              status: response.status, 
              statusText: response.statusText,
              url: response.url 
            });
            if (!response.ok) {
              console.error('❌ TRPC React response error:', {
                status: response.status,
                statusText: response.statusText,
                url: response.url
              });
              try {
                const errorText = await response.text();
                console.error('❌ TRPC Error response body:', errorText);
              } catch {}
            }
            return response;
          },
        }),
      ],
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={client} queryClient={queryClient}>
        {children}
      </trpc.Provider>
    </QueryClientProvider>
  );
}

// Export the base URL for other uses
export { baseUrl, getBaseUrl };
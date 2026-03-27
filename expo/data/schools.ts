import { School } from '@/types/user';

// This file now loads schools from the backend database
// The actual school data is stored in backend/database/seed-schools.ts
// and loaded into the MySQL database on the Lightsail server

export const realSchools: School[] = [
  // This array is now populated dynamically from the backend
  // See app/school/index.tsx for how schools are loaded via tRPC
];

// Helper function to get schools from backend
export const getSchoolsFromBackend = async () => {
  // This is handled by tRPC in the frontend components
  // See: trpcClient.schools.getAllSchools.query()
  return [];
};
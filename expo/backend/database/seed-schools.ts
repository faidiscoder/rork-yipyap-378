import { executeQuery } from './connection';

// Enhanced logging function for PM2
function log(level: string, message: string, data: any = {}) {
  const timestamp = new Date().toISOString();
  const formattedLog = `[${timestamp}] [${level.toUpperCase()}] [SEED_SCHOOLS] ${message}${Object.keys(data).length > 0 ? ' | ' + JSON.stringify(data) : ''}`;
  
  if (level === 'error') {
    console.error(formattedLog);
  } else {
    console.log(formattedLog);
  }
}

// School data to seed
const schoolsData = [
  {
    name: 'Lincoln High School',
    address: '123 Main St, Lincoln, NE 68508',
    city: 'Lincoln',
    state: 'Nebraska',
    zip_code: '68508',
    latitude: 40.8136,
    longitude: -96.7026,
    school_type: 'public',
    student_count: 1200,
  },
  {
    name: 'Roosevelt High School',
    address: '456 Oak Ave, Omaha, NE 68102',
    city: 'Omaha',
    state: 'Nebraska',
    zip_code: '68102',
    latitude: 41.2565,
    longitude: -95.9345,
    school_type: 'public',
    student_count: 1500,
  },
  {
    name: 'Washington Academy',
    address: '789 Pine St, Grand Island, NE 68801',
    city: 'Grand Island',
    state: 'Nebraska',
    zip_code: '68801',
    latitude: 40.9264,
    longitude: -98.3420,
    school_type: 'private',
    student_count: 800,
  },
  {
    name: 'Jefferson Charter School',
    address: '321 Elm St, Kearney, NE 68847',
    city: 'Kearney',
    state: 'Nebraska',
    zip_code: '68847',
    latitude: 40.6994,
    longitude: -99.0817,
    school_type: 'charter',
    student_count: 600,
  },
  {
    name: 'Madison High School',
    address: '654 Maple Dr, Norfolk, NE 68701',
    city: 'Norfolk',
    state: 'Nebraska',
    zip_code: '68701',
    latitude: 42.0281,
    longitude: -97.4170,
    school_type: 'public',
    student_count: 900,
  },
  {
    name: 'Central High School',
    address: '100 Central Ave, Fremont, NE 68025',
    city: 'Fremont',
    state: 'Nebraska',
    zip_code: '68025',
    latitude: 41.4333,
    longitude: -96.4981,
    school_type: 'public',
    student_count: 1100,
  },
  {
    name: 'Westside High School',
    address: '8701 Pacific St, Omaha, NE 68114',
    city: 'Omaha',
    state: 'Nebraska',
    zip_code: '68114',
    latitude: 41.2619,
    longitude: -96.0891,
    school_type: 'public',
    student_count: 1800,
  },
  {
    name: 'Millard North High School',
    address: '1010 S 144th St, Omaha, NE 68154',
    city: 'Omaha',
    state: 'Nebraska',
    zip_code: '68154',
    latitude: 41.2456,
    longitude: -96.1753,
    school_type: 'public',
    student_count: 2000,
  },
  {
    name: 'Creighton Prep',
    address: '7400 Western Ave, Omaha, NE 68114',
    city: 'Omaha',
    state: 'Nebraska',
    zip_code: '68114',
    latitude: 41.2619,
    longitude: -96.0391,
    school_type: 'private',
    student_count: 1000,
  },
  {
    name: 'Marian High School',
    address: '7400 Military Ave, Omaha, NE 68134',
    city: 'Omaha',
    state: 'Nebraska',
    zip_code: '68134',
    latitude: 41.3194,
    longitude: -96.0391,
    school_type: 'private',
    student_count: 800,
  },
];

export async function seedSchools() {
  try {
    log('info', 'Starting school seeding process');
    
    for (const school of schoolsData) {
      try {
        // Check if school already exists
        const existingSchool = await executeQuery(
          'SELECT id FROM schools WHERE name = ? AND city = ? AND state = ?',
          [school.name, school.city, school.state]
        ) as any[];
        
        if (existingSchool && existingSchool.length > 0) {
          log('info', 'School already exists, skipping', { 
            name: school.name,
            city: school.city 
          });
          continue;
        }
        
        // Insert school
        await executeQuery(`
          INSERT INTO schools (
            name, address, city, state, zip_code, latitude, longitude, 
            school_type, student_count, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
          school.name,
          school.address,
          school.city,
          school.state,
          school.zip_code,
          school.latitude,
          school.longitude,
          school.school_type,
          school.student_count
        ]);
        
        log('info', 'School seeded successfully', { 
          name: school.name,
          city: school.city,
          type: school.school_type
        });
        
      } catch (error: any) {
        log('error', 'Error seeding individual school', {
          name: school.name,
          error: error.message
        });
      }
    }
    
    log('info', 'School seeding completed');
    
  } catch (error: any) {
    log('error', 'Error in school seeding process', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}
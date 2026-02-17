import { Command } from 'commander';
import { AppDataSource, Provider, User } from '@careequity/db';
import { esClient, INDEX_NAME, AuthUtils, SPECIALTIES, INSURANCE_PROVIDERS } from '@careequity/core';

interface IngestOptions {
  location: string;
  limit: string;
}

const SAMPLE_PROVIDERS = [
  {
    name: "Dr. Ala Stanford",
    credentials: ["MD", "FACS", "FAAP"],
    specialties: ["Pediatric Surgery", "Health Equity"],
    languages: ["English"],
    location: { lat: 39.9526, lon: -75.1652 },
    address: { street: "2558 N. 22nd St", city: "Philadelphia", state: "PA", zip: "19132" },
    verification_tier: 3,
    identity_tags: ["Black", "African American"],
    profile_image_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Stanford",
    insurance: "Blue Cross Blue Shield"
  },
  {
    name: "Dr. Nada Al-Hashimi",
    credentials: ["MD"],
    specialties: ["Family Medicine"],
    languages: ["English", "Arabic"],
    location: { lat: 40.6782, lon: -73.9442 },
    address: { street: "123 Brooklyn Ave", city: "Brooklyn", state: "NY", zip: "11213" },
    verification_tier: 2,
    identity_tags: ["Middle Eastern", "Arab"],
    profile_image_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Hashimi",
    insurance: "Aetna"
  },
  {
    name: "Dr. Jose Rodriguez",
    credentials: ["MD"],
    specialties: ["Internal Medicine"],
    languages: ["English", "Spanish"],
    location: { lat: 40.7128, lon: -74.0060 },
    address: { street: "45 Broadway", city: "New York", state: "NY", zip: "10006" },
    verification_tier: 3,
    identity_tags: ["Latino", "Hispanic"],
    profile_image_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rodriguez",
    insurance: "UnitedHealthcare"
  },
  {
    name: "Dr. Mei Chen",
    credentials: ["DDS"],
    specialties: ["Dentistry"],
    languages: ["English", "Mandarin", "Cantonese"],
    location: { lat: 40.7142, lon: -73.9961 },
    address: { street: "128 Mott St", city: "New York", state: "NY", zip: "10013" },
    verification_tier: 2,
    identity_tags: ["Asian", "Chinese"],
    profile_image_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Chen",
    insurance: "Cigna"
  },
  {
    name: "Dr. Sarah Miller",
    credentials: ["MD"],
    specialties: ["OB/GYN"],
    languages: ["English"],
    location: { lat: 39.9242, lon: -75.1153 },
    address: { street: "1 Cooper Plaza", city: "Camden", state: "NJ", zip: "08103" },
    verification_tier: 3,
    identity_tags: ["Black"],
    profile_image_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Miller",
    insurance: "Medicare"
  }
];

const RANDOM_NAMES = ["James", "Aisha", "Wei", "Elena", "Mateo", "Siddharth", "Fatima", "Hiroshi", "Kwame", "Lucia"];
const RANDOM_SURNAMES = ["Smith", "Khan", "Li", "Garcia", "Patel", "Osei", "Nguyen", "Muller", "Dubois", "Kim"];

export function ingestCommand(program: Command) {
  program
    .command('ingest')
    .description('Ingest real provider sample data')
    .option('-l, --location <location>', 'Target region filter', 'All')
    .option('-n, --limit <limit>', 'Maximum random providers to add', '60')
    .action(async (options: IngestOptions) => {
      console.log(`Ingesting real sample providers...`);
      
            if (!AppDataSource.isInitialized) {
      
              await AppDataSource.initialize();
      
            }
      
            const providerRepo = AppDataSource.getRepository(Provider);
      
            const userRepo = AppDataSource.getRepository(User);
      
      
      
            // Create Admin User
      const adminEmail = 'admin@careequity.com';
      if (!await userRepo.findOneBy({ email: adminEmail })) {
        const admin = new User();
        admin.email = adminEmail;
        admin.password_hash = await AuthUtils.hashPassword('admin123');
        admin.role = 'admin';
        await userRepo.save(admin);
        console.log(`✓ Created Admin Account: ${adminEmail} / admin123`);
      }

      for (const p of SAMPLE_PROVIDERS) {
        let provider = await providerRepo.findOneBy({ name: p.name });
        
        if (!provider) {
          provider = new Provider();
          Object.assign(provider, p);
          provider.location = { type: 'Point', coordinates: [p.location.lon, p.location.lat] };
          await providerRepo.save(provider);

          // Create default user for testing
          const email = `${p.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`;
          const userExists = await userRepo.findOneBy({ email });
          if (!userExists) {
            const user = new User();
            user.email = email;
            user.password_hash = await AuthUtils.hashPassword('password123');
            user.role = 'provider';
            user.provider = provider;
            await userRepo.save(user);
            console.log(`✓ Created test account for: ${p.name} (${email})`);
          }
        } else {
          // If already exists, ensure insurance is set if it was null
          if (!provider.insurance) {
            provider.insurance = p.insurance;
            await providerRepo.save(provider);
          }
        }

        // ES document MUST use {lat, lon} for geo_point
        await esClient.index({
          index: INDEX_NAME,
          id: provider.id,
          document: { 
            id: provider.id,
            name: provider.name,
            specialties: provider.specialties,
            languages: provider.languages,
            location: p.location, // This is {lat, lon} from the array
            address: provider.address,
            insurance: provider.insurance,
            verification_tier: provider.verification_tier,
            profile_image_url: provider.profile_image_url,
            website_url: provider.website_url
          },
        });
        console.log(`✓ Ingested/Synced: ${p.name}`);
      }

      console.log(`Ingesting additional random providers...`);
      const limitNum = parseInt(options.limit, 10);
      for (let i = 0; i < limitNum; i++) {
        const name = `Dr. ${RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)]} ${RANDOM_SURNAMES[Math.floor(Math.random() * RANDOM_SURNAMES.length)]} ${Date.now()}_${i}`;
        const spec = SPECIALTIES[Math.floor(Math.random() * SPECIALTIES.length)];
        
        const isNY = Math.random() > 0.5;
        const lat = isNY ? 40.7128 + (Math.random() - 0.5) * 0.4 : 39.9526 + (Math.random() - 0.5) * 0.4;
        const lon = isNY ? -74.0060 + (Math.random() - 0.5) * 0.4 : -75.1652 + (Math.random() - 0.5) * 0.4;

        const provider = new Provider();
        provider.name = name;
        provider.credentials = ['MD'];
        provider.specialties = [spec];
        provider.languages = ['English'];
        provider.location = { type: 'Point', coordinates: [lon, lat] };
        const address = { street: 'Main St', city: isNY ? 'New York' : 'Philadelphia', state: isNY ? 'NY' : 'PA', zip: '10001' };
        provider.address = address;
        provider.verification_tier = Math.floor(Math.random() * 3) + 1;
        const insurance = INSURANCE_PROVIDERS[Math.floor(Math.random() * INSURANCE_PROVIDERS.length)];
        provider.insurance = insurance;
        
        await providerRepo.save(provider);

        // Create default user for testing
        const email = `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`;
        const user = new User();
        user.email = email;
        user.password_hash = await AuthUtils.hashPassword('password123');
        user.role = 'provider';
        user.provider = provider;
        await userRepo.save(user);

        await esClient.index({
          index: INDEX_NAME,
          id: provider.id,
          document: {
            id: provider.id,
            name: provider.name,
            specialties: provider.specialties,
            languages: provider.languages,
            location: { lat, lon },
            address: address,
            insurance: insurance,
            verification_tier: provider.verification_tier,
            profile_image_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
          },
        });
      }
      
      console.log(`Successfully ingested ${limitNum} additional providers.`);
      process.exit(0);
    });
}

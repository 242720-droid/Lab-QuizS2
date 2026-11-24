import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Restaurant } from './restaurants/entities/restaurant.entity';
import { MenuItem } from './menu-items/entities/menu-item.entity';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'food_ordering_db',
  entities: [Restaurant, MenuItem],
  synchronize: true,
});

async function seed() {
  console.log('🌱 Connecting to PostgreSQL to seed sample data...');
  await AppDataSource.initialize();
  console.log('✅ Connected to database successfully!');

  const restaurantRepo = AppDataSource.getRepository(Restaurant);
  const menuItemRepo = AppDataSource.getRepository(MenuItem);

  // Check if data already exists
  const existingCount = await restaurantRepo.count();
  if (existingCount > 0) {
    console.log(`ℹ️ Database already has ${existingCount} restaurants. Skipping seeding to prevent duplicate data.`);
    await AppDataSource.destroy();
    return;
  }

  console.log('📦 Creating sample restaurants and menu items...');

  // Restaurant 1: Gourmet Burger House
  const rest1 = restaurantRepo.create({
    name: 'Gourmet Burger House',
    address: '45 Food Street, Downtown',
    cuisine: 'American & Fast Food',
    phone: '+1-555-0101',
  });
  await restaurantRepo.save(rest1);

  await menuItemRepo.save([
    menuItemRepo.create({
      name: 'Classic Double Cheeseburger',
      description: 'Two smashed beef patties, aged cheddar cheese, pickles, and signature burger sauce.',
      price: 12.99,
      category: 'Fast Food',
      isAvailable: true,
      restaurantId: rest1.id,
      restaurant: rest1,
    }),
    menuItemRepo.create({
      name: 'Loaded Truffle Fries',
      description: 'Crispy skin-on fries drizzled with truffle oil, parmesan, and rosemary.',
      price: 6.50,
      category: 'Appetizers',
      isAvailable: true,
      restaurantId: rest1.id,
      restaurant: rest1,
    }),
  ]);

  // Restaurant 2: Bella Italia Trattoria
  const rest2 = restaurantRepo.create({
    name: 'Bella Italia Trattoria',
    address: '12 Piazza Avenue, Little Italy',
    cuisine: 'Italian & Wood-fired Pizza',
    phone: '+1-555-0202',
  });
  await restaurantRepo.save(rest2);

  await menuItemRepo.save([
    menuItemRepo.create({
      name: 'Margherita Pizza DOC',
      description: 'San Marzano tomato sauce, fresh mozzarella di bufala, basil, and extra virgin olive oil.',
      price: 15.99,
      category: 'Pizza & Pasta',
      isAvailable: true,
      restaurantId: rest2.id,
      restaurant: rest2,
    }),
    menuItemRepo.create({
      name: 'Fettuccine Creamy Alfredo',
      description: 'Fresh homemade fettuccine tossed in rich parmesan butter cream sauce.',
      price: 16.50,
      category: 'Main Course',
      isAvailable: true,
      restaurantId: rest2.id,
      restaurant: rest2,
    }),
  ]);

  // Restaurant 3: Sweet Treats & Cafe
  const rest3 = restaurantRepo.create({
    name: 'Sweet Treats & Cafe',
    address: '88 Baker Street',
    cuisine: 'Bakery & Desserts',
    phone: '+1-555-0303',
  });
  await restaurantRepo.save(rest3);

  await menuItemRepo.save([
    menuItemRepo.create({
      name: 'Molten Chocolate Lava Cake',
      description: 'Warm chocolate cake with molten ganache center served with vanilla bean gelato.',
      price: 8.99,
      category: 'Desserts',
      isAvailable: true,
      restaurantId: rest3.id,
      restaurant: rest3,
    }),
    menuItemRepo.create({
      name: 'Caramel Macchiato',
      description: 'Fresh espresso with steamed milk, vanilla syrup, and rich caramel drizzle.',
      price: 4.75,
      category: 'Beverages',
      isAvailable: true,
      restaurantId: rest3.id,
      restaurant: rest3,
    }),
  ]);

  console.log('🎉 Seeding completed successfully! 3 Restaurants and 6 Menu Items inserted.');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});

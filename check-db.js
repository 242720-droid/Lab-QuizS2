const { Client } = require('pg');
require('dotenv').config();

async function initDb() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '242762',
    database: 'postgres',
  });

  try {
    await client.connect();
    console.log('✅ Successfully connected to PostgreSQL server on localhost:5432!');

    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'food_ordering_db'",
    );
    if (res.rows.length === 0) {
      console.log('📦 Database "food_ordering_db" not found. Creating it now...');
      await client.query('CREATE DATABASE food_ordering_db');
      console.log('🎉 Database "food_ordering_db" created successfully!');
    } else {
      console.log('✅ Database "food_ordering_db" already exists and is ready!');
    }
  } catch (err) {
    console.error('❌ PostgreSQL Connection status:', err.message);
  } finally {
    await client.end().catch(() => {});
  }
}

initDb();

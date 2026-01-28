import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error('Missing DATABASE_URL in .env.local');
    process.exit(1);
}

async function run() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('Usage: tsx scripts/run-migration-pg.ts <path-to-sql-file>');
        process.exit(1);
    }

    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false } // Required for Supabase usually
    });

    try {
        await client.connect();
        console.log('Connected to Database');

        const sql = fs.readFileSync(path.resolve(filePath), 'utf8');
        console.log(`Executing SQL from ${filePath}...`);

        await client.query(sql);
        console.log('Migration completed successfully.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

run();

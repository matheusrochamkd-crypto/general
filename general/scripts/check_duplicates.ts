
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicates() {
    console.log('Fetching all events...');
    const { data: events, error } = await supabase
        .from('agenda_events')
        .select('*');

    if (error) {
        console.error('Error fetching events:', error);
        return;
    }

    if (!events || events.length === 0) {
        console.log('No events found.');
        return;
    }

    console.log(`Found ${events.length} total events. Checking for duplicates...`);

    const map = new Map<string, any[]>();
    let duplicateCount = 0;

    events.forEach(event => {
        // Create a unique key based on content
        // We use title + start_date + start_time (if exists) + type
        // This assumes that if a user created two events with same title at same time, it's likely a duplicate
        const key = `${event.title}|${event.start_date}|${event.time || ''}|${event.type}`;

        if (!map.has(key)) {
            map.set(key, []);
        }
        map.get(key)?.push(event);
    });

    const duplicates: any[] = [];

    map.forEach((group, key) => {
        if (group.length > 1) {
            duplicateCount++;
            console.log(`\nDuplicate Group Found (${group.length} items):`);
            console.log(`Key: ${key}`);
            group.forEach(e => {
                console.log(` - ID: ${e.id} | Created At: ${e.created_at}`);
                duplicates.push(e);
            });
        }
    });

    if (duplicateCount === 0) {
        console.log('\n✅ No duplicates found based on content signature.');
    } else {
        console.log(`\n⚠️ Found ${duplicateCount} groups of duplicates.`);
    }
}

checkDuplicates();


const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable(tableName) {
    console.log(`\n--- Inspecting ${tableName} ---`);
    const { data, error } = await supabase.from(tableName).select('*').limit(1);

    if (error) {
        console.error(`Error selecting from ${tableName}:`, error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]).join(', '));
    } else {
        console.log('Table is empty. Probing columns...');

        const probes = [
            { col: 'created_by', val: '00000000-0000-0000-0000-000000000000' },
            { col: 'status', val: 'pending' },
            { col: 'latitude', val: 40.416 },
            { col: 'image_url', val: 'http://example.com/image.png' }
        ];

        for (const p of probes) {
            const payload = {};
            payload[p.col] = p.val;
            // Add some dummy required checks if needed? 
            // We just want column existence check
            const { error: probeError } = await supabase.from(tableName).insert(payload);

            if (probeError) {
                if (probeError.message.includes(`Could not find the '${p.col}' column`)) {
                    console.log(`Column '${p.col}' DOES NOT exist.`);
                } else {
                    console.log(`Column '${p.col}' MIGHT exist. Error: ${probeError.message}`);
                }
            } else {
                console.log(`Column '${p.col}' exists (Insert succeeded or other).`);
                // Cleanup if it succeeded? (Likely won't due to FKs)
            }
        }
    }
}

async function testInserts() {
    console.log('\n--- Testing Full Inserts ---');

    // 1. Get valid User
    const { data: user } = await supabase.from('profiles').select('id').limit(1).single();
    if (!user) { console.log('No users found to test with.'); return; }
    console.log('Using User ID:', user.id);

    // 2. Get valid Crew
    const { data: crew } = await supabase.from('crews').select('id').limit(1).single();
    if (!crew) { console.log('No crews found to test events.'); }
    else {
        console.log('Using Crew ID:', crew.id);

        // Test Event Insert
        console.log('Attempting Event Insert...');
        const eventPayload = {
            crew_id: crew.id,
            title: 'Test Event Script',
            date_time: new Date().toISOString(),
            location: 'Test Loc',
            description: 'Desc',
            // capacity: 10, // Removed as column is missing
            status: 'pending',
            created_by: user.id,
            latitude: 40.0,
            longitude: -3.0
        };
        const { data: evt, error: evtErr } = await supabase.from('events').insert(eventPayload).select();
        if (evtErr) console.error('Event Insert Failed:', evtErr.message);
        else console.log('Event Insert SUCCESS:', evt);
    }

    // 3. Test Chat Insert
    // Need a conversation
    const { data: conv } = await supabase.from('conversations').select('id').limit(1).single();
    if (!conv) {
        console.log('No conversations found. Creating one...');
        // Try create conv... maybe complicate
    } else {
        console.log('Using Conversation ID:', conv.id);
        console.log('Attempting Message Insert...');
        const msgPayload = {
            conversation_id: conv.id,
            sender_id: user.id,
            content: 'Test Message Script'
        };
        const { data: msg, error: msgErr } = await supabase.from('direct_messages').insert(msgPayload).select();
        if (msgErr) console.error('Message Insert Failed:', msgErr.message);
        else console.log('Message Insert SUCCESS:', msg);
    }
}

async function main() {
    await testInserts();
}

main();

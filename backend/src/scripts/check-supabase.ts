import { supabase } from '../config/supabase';

async function checkSupabaseConnection() {
  console.log('\n=============================================');
  console.log('--- Checking Supabase Project Connectivity ---');
  console.log('Project: https://xhikrplxtwzrxujmroqd.supabase.co');
  console.log('=============================================\n');

  try {
    // 1. Ping Auth service
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.log('ℹ️ Auth Endpoint Status:', authError.message);
    } else {
      console.log('✓ Supabase Auth Endpoint: Connected & Reachable');
    }

    // 2. Query User table in Supabase
    const { data: users, error: userError } = await supabase
      .from('User')
      .select('id, name, email, role')
      .limit(5);

    if (userError) {
      if (userError.code === '42P01' || userError.message?.includes('relation "User" does not exist')) {
        console.log('\n⚠️ Schema Status: The "User" table has not been created in Supabase yet.');
        console.log('👉 ACTION REQUIRED: Run the SQL in "backend/prisma/supabase_schema.sql" in your Supabase SQL Editor!');
      } else {
        console.log('⚠️ Database Query Notice:', userError.message);
      }
    } else {
      console.log(`✓ Database Tables: Connected! Found ${users?.length || 0} user records in Supabase "User" table:`);
      users?.forEach((u) => console.log(`   - [${u.role}] ${u.name} (${u.email})`));
    }

    console.log('\n=============================================');
    console.log('Supabase Connection Check Complete!');
    console.log('=============================================\n');
  } catch (err: any) {
    console.error('❌ Connection check encountered an unexpected error:', err.message);
  }
}

checkSupabaseConnection();

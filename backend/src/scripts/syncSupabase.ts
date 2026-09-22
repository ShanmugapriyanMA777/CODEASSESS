import { supabase } from '../config/supabase';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

async function syncAllStudentsToSupabase() {
  console.log('🚀 Syncing 65 students to Supabase Cloud...');
  const jsonPath = path.resolve(__dirname, 'students_iii_c.json');
  const students = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  // 1. Ensure Batch III CSE C exists
  await supabase.from('Batch').upsert({
    id: 'b3333333-3333-3333-3333-333333333333',
    name: 'III CSE C',
    code: 'CSE-III-C',
    academicYear: '2024-2028',
    description: 'Computer Science and Engineering - 3rd Year Section C',
  }, { onConflict: 'code' });
  console.log('✅ Batch synced');

  // 2. Batch sync student users
  let successCount = 0;
  for (const s of students) {
    const email = s.defaultEmail.trim().toLowerCase();
    const dob = s.dob.trim();
    const hash = await bcrypt.hash(dob, 10);
    const userId = `u-std-${s.registerNumber.trim()}`;

    const { error: uErr } = await supabase.from('User').upsert({
      id: userId,
      name: s.name.trim(),
      email,
      passwordHash: hash,
      role: 'STUDENT',
      isActive: true,
    }, { onConflict: 'email' });

    if (uErr) {
      console.warn(`User error for ${email}:`, uErr.message);
    } else {
      successCount++;
    }

    // Try StudentProfile with DOB
    await supabase.from('StudentProfile').upsert({
      id: `sp-std-${s.registerNumber.trim()}`,
      userId,
      rollNumber: s.registerNumber.trim(),
      batchId: 'b3333333-3333-3333-3333-333333333333',
      department: 'Computer Science & Engineering',
      semester: 6,
      dob: s.dob.trim(),
    }, { onConflict: 'userId' });
  }

  console.log(`🎉 Successfully synced ${successCount}/${students.length} students to Supabase!`);
}

syncAllStudentsToSupabase().catch(console.error);

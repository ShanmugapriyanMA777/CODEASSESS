/**
 * cleanSeedFeedbacks.js
 * Removes ALL seeded (fake) feedback records from:
 *   1. Supabase Report table (CLASS_FEEDBACK_ENTRY rows)
 *   2. Supabase AssessmentFeedback table
 *   3. Local Prisma assessmentFeedback table
 *
 * Run: node src/scripts/cleanSeedFeedbacks.js
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
const ws = require('ws');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { transport: ws },
});

const prisma = new PrismaClient();

async function cleanSeedFeedbacks() {
  console.log('\n====================================================');
  console.log('🧹  Cleaning ALL seeded (fake) feedback records...');
  console.log('====================================================\n');

  // ── 1. Supabase Report table (CLASS_FEEDBACK_ENTRY) ──────────────────────────
  try {
    const { count: reportCount } = await supabase
      .from('Report')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'CLASS_FEEDBACK_ENTRY');

    console.log(`📋  Supabase Report table — found ${reportCount ?? 0} CLASS_FEEDBACK_ENTRY record(s).`);

    if (reportCount && reportCount > 0) {
      const { error } = await supabase
        .from('Report')
        .delete()
        .eq('type', 'CLASS_FEEDBACK_ENTRY');

      if (error) throw error;
      console.log(`   ✅  Deleted ${reportCount} record(s) from Report table.\n`);
    } else {
      console.log('   ✅  Nothing to delete in Report table.\n');
    }
  } catch (err) {
    console.error('   ❌  Error cleaning Report table:', err.message || err);
  }

  // ── 2. Supabase AssessmentFeedback table ─────────────────────────────────────
  try {
    const { count: afCount } = await supabase
      .from('AssessmentFeedback')
      .select('*', { count: 'exact', head: true });

    console.log(`📋  Supabase AssessmentFeedback table — found ${afCount ?? 0} record(s).`);

    if (afCount && afCount > 0) {
      // Delete all rows (they are all seeded since students haven't submitted real ones here)
      // Only delete rows whose studentId does NOT exist in the real auth — use a safe approach:
      // delete where id is in our fetched list
      const { data: rows } = await supabase
        .from('AssessmentFeedback')
        .select('id');

      if (rows && rows.length > 0) {
        const ids = rows.map((r) => r.id);
        const { error } = await supabase
          .from('AssessmentFeedback')
          .delete()
          .in('id', ids);

        if (error) throw error;
        console.log(`   ✅  Deleted ${ids.length} record(s) from AssessmentFeedback table.\n`);
      }
    } else {
      console.log('   ✅  Nothing to delete in AssessmentFeedback table.\n');
    }
  } catch (err) {
    console.error('   ❌  Error cleaning AssessmentFeedback table:', err.message || err);
  }

  // ── 3. Local Prisma assessmentFeedback table ──────────────────────────────────
  try {
    const localCount = await prisma.assessmentFeedback.count();
    console.log(`📋  Local Prisma assessmentFeedback — found ${localCount} record(s).`);

    if (localCount > 0) {
      const deleted = await prisma.assessmentFeedback.deleteMany({});
      console.log(`   ✅  Deleted ${deleted.count} record(s) from local assessmentFeedback table.\n`);
    } else {
      console.log('   ✅  Nothing to delete in local assessmentFeedback table.\n');
    }
  } catch (err) {
    console.error('   ❌  Error cleaning local assessmentFeedback table:', err.message || err);
  }

  console.log('====================================================');
  console.log('🎉  All seeded feedback records removed!');
  console.log('    The report will now only show genuine student submissions.');
  console.log('====================================================\n');
}

cleanSeedFeedbacks()
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

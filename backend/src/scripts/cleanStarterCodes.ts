import { PrismaClient } from '@prisma/client';
import { supabase } from '../config/supabase.js';

const prisma = new PrismaClient();

export const cleanStarterTemplates: Record<string, string> = {
  python: `# Write your solution here\n`,
  javascript: `// Write your solution here\n`,
  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        // Write your solution here
    }
}
`,
  c: `#include <stdio.h>

int main() {
    // Write your solution here
    return 0;
}
`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    // Write your solution here
    return 0;
}
`,
};

async function cleanAllStarterCodes() {
  const cleanJson = JSON.stringify(cleanStarterTemplates);

  // 1. Clean local SQLite DB
  try {
    console.log('=== 1. Cleaning local SQLite database ===');
    const questions = await prisma.question.findMany({
      select: { id: true, title: true },
    });
    console.log(`Found ${questions.length} questions in local DB.`);

    for (const q of questions) {
      await prisma.question.update({
        where: { id: q.id },
        data: { starterCode: cleanJson },
      });
      console.log(`  ✓ Updated local: "${q.title}"`);
    }

    // Also clear code drafts in AssessmentAttempt that contain solutions
    const attempts = await prisma.assessmentAttempt.findMany({
      select: { id: true, currentCodeDraftsJson: true },
    });
    for (const att of attempts) {
      if (att.currentCodeDraftsJson && att.currentCodeDraftsJson.length > 5) {
        await prisma.assessmentAttempt.update({
          where: { id: att.id },
          data: { currentCodeDraftsJson: '{}' },
        });
        console.log(`  ✓ Cleared draft cache for attempt: ${att.id}`);
      }
    }
  } catch (e: any) {
    console.warn('Local SQLite update note:', e.message);
  }

  // 2. Clean Supabase Cloud DB
  try {
    console.log('\n=== 2. Cleaning Supabase Cloud database ===');
    const { data: supaQuestions, error: qErr } = await supabase
      .from('Question')
      .select('id, title');

    if (qErr) {
      console.error('Error fetching Supabase questions:', qErr.message);
    } else if (supaQuestions) {
      console.log(`Found ${supaQuestions.length} questions in Supabase Cloud.`);
      for (const q of supaQuestions) {
        const { error: updErr } = await supabase
          .from('Question')
          .update({ starterCode: cleanJson })
          .eq('id', q.id);

        if (updErr) {
          console.error(`  ✗ Error updating Supabase "${q.title}":`, updErr.message);
        } else {
          console.log(`  ✓ Updated Supabase: "${q.title}"`);
        }
      }
    }

    // Also reset any cached drafts in Supabase AssessmentAttempt
    const { data: supaAttempts, error: attErr } = await supabase
      .from('AssessmentAttempt')
      .select('id, currentCodeDraftsJson');

    if (!attErr && supaAttempts) {
      console.log(`Checking ${supaAttempts.length} attempts in Supabase Cloud for cached drafts.`);
      for (const att of supaAttempts) {
        if (att.currentCodeDraftsJson && att.currentCodeDraftsJson !== '{}') {
          const { error: clrErr } = await supabase
            .from('AssessmentAttempt')
            .update({ currentCodeDraftsJson: '{}' })
            .eq('id', att.id);

          if (!clrErr) {
            console.log(`  ✓ Reset draft cache for Supabase attempt: ${att.id}`);
          }
        }
      }
    }
  } catch (e: any) {
    console.error('Supabase Cloud update error:', e.message);
  }

  console.log('\n🎉 Finished cleaning all starter codes in both local DB and Supabase Cloud!');
}

cleanAllStarterCodes()
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

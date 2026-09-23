import { PrismaClient } from '@prisma/client';

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
  console.log('Cleaning starter codes in database...');
  const questions = await prisma.question.findMany({
    select: { id: true, title: true, starterCode: true },
  });

  console.log(`Found ${questions.length} questions to update.`);
  const cleanJson = JSON.stringify(cleanStarterTemplates);

  for (const q of questions) {
    await prisma.question.update({
      where: { id: q.id },
      data: { starterCode: cleanJson },
    });
    console.log(`Updated question: "${q.title}" (${q.id}) -> clean starter template`);
  }

  console.log('Successfully cleaned starter codes for all questions!');
}

cleanAllStarterCodes()
  .catch((err) => {
    console.error('Error cleaning starter codes:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

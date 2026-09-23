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

export const cannedSignatures = [
  'def solve():',
  'sys.stdin.readline()',
  'sys.stdin.read().split()',
  'print("Not Prime")',
  'print("Prime")',
  'print(max(arr))',
  'print(s[::-1])',
  'print("Palindrome")',
  'seen[num] = i',
  'max_val = INT_MIN',
  'int max = -2147483648',
  'maxVal = Integer.MIN_VALUE',
  'Scanner sc = new Scanner(System.in)',
  'unordered_map<int, int> seen',
];

export function isCannedSolution(code: string | undefined | null): boolean {
  if (!code) return false;
  return cannedSignatures.some((sig) => code.includes(sig));
}

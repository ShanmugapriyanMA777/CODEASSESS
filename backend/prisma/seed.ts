import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Seeding ---');

  // 1. Create Academic Batch: III CSE C
  const batchIiiC = await prisma.batch.upsert({
    where: { code: 'CSE-III-C' },
    update: {},
    create: {
      name: 'III CSE C',
      description: 'B.E. Computer Science and Engineering - 3rd Year Section C (Batch 2024-2028)',
      academicYear: '2024-2028',
      code: 'CSE-III-C',
    },
  });
  console.log(`✓ Batch created: ${batchIiiC.name} (${batchIiiC.code})`);

  // 2. Create Admin Account
  const adminPasswordHash = await bcrypt.hash('varshag@act3128', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'varsha.cse@act.edu.in' },
    update: { passwordHash: adminPasswordHash, role: 'ADMIN', name: 'Mrs. VARSHA' },
    create: {
      name: 'Mrs. VARSHA',
      email: 'varsha.cse@act.edu.in',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      adminProfile: {
        create: {
          designation: 'Assistant Professor & Head of Assessment',
          department: 'Computer Science & Engineering',
        },
      },
    },
  });
  console.log('✓ Admin created: varsha.cse@act.edu.in / varshag@act3128');

  // 3. Create 65 Real Students from III C DOB.xlsx
  const primaryPath = path.resolve(__dirname, 'students_iii_c.json');
  const fallbackPath = path.resolve(__dirname, '../src/scripts/students_iii_c.json');
  const jsonPath = fs.existsSync(primaryPath) ? primaryPath : fallbackPath;
  let studentsData: any[] = [];
  if (fs.existsSync(jsonPath)) {
    studentsData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  }

  for (const s of studentsData) {
    const regNo = s.registerNumber.trim();
    const dob = s.dob.trim();
    const name = s.name.trim();
    const email = s.defaultEmail.trim().toLowerCase();
    const studentPasswordHash = await bcrypt.hash(dob, 10);

    const existingProfile = await prisma.studentProfile.findFirst({
      where: { rollNumber: regNo },
    });

    if (!existingProfile) {
      await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          name,
          email,
          passwordHash: studentPasswordHash,
          role: 'STUDENT',
          studentProfile: {
            create: {
              rollNumber: regNo,
              batchId: batchIiiC.id,
              department: 'Computer Science & Engineering',
              semester: 6,
              dob,
            },
          },
        },
      });
    }
  }
  console.log(`✓ ${studentsData.length} Real Students seeded with DOB passwords.`);

  // 4. Create 15 Comprehensive Coding Questions
  const cleanStarterCodeJson = JSON.stringify({
    python: `# Write your solution here\n`,
    javascript: `// Write your solution here\n`,
    java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n`,
    c: `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
  });

  const sampleQuestions = [
    {
      title: 'Find Largest Element',
      description: 'Write a program to find the largest element in an integer array.',
      inputFormat: 'First line contains integer N, the size of the array.\nSecond line contains N space-separated integers.',
      outputFormat: 'Print the maximum integer value found in the array.',
      constraints: '1 <= N <= 1000\n-10^5 <= arr[i] <= 10^5',
      explanation: 'The largest number in [10, 20, 5, 40, 15] is 40.',
      difficulty: 'Easy',
      category: 'Arrays',
      marks: 10,
      starterCode: JSON.stringify({
        python: `import sys

def solve():
    n = int(sys.stdin.readline())
    arr = list(map(int, sys.stdin.readline().split()))
    # Write your implementation here
    print(max(arr))

if __name__ == '__main__':
    solve()`,
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int max = Integer.MIN_VALUE;
        for (int i = 0; i < n; i++) {
            int val = sc.nextInt();
            if (val > max) max = val;
        }
        System.out.println(max);
    }
}`,
        c: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int max = -2147483648;
    for (int i = 0; i < n; i++) {
        int val;
        scanf("%d", &val);
        if (val > max) max = val;
    }
    printf("%d\\n", max);
    return 0;
}`,
        cpp: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;
    int maxVal = -2e9;
    for (int i = 0; i < n; i++) {
        int x;
        cin >> x;
        if (x > maxVal) maxVal = x;
    }
    cout << maxVal << endl;
    return 0;
}`,
      }),
      testCases: [
        { input: '5\n10 20 5 40 15', expectedOutput: '40', isHidden: false, orderIndex: 1 },
        { input: '4\n2 8 1 5', expectedOutput: '8', isHidden: false, orderIndex: 2 },
        { input: '3\n100 20 50', expectedOutput: '100', isHidden: true, orderIndex: 3 },
        { input: '1\n-99', expectedOutput: '-99', isHidden: true, orderIndex: 4 },
        { input: '6\n-10 -5 -20 -1 -50 -100', expectedOutput: '-1', isHidden: true, orderIndex: 5 },
      ],
    },
    {
      title: 'Reverse a String',
      description: 'Write a program to reverse a given string without using built-in reverse helper methods if possible.',
      inputFormat: 'A single string S without spaces.',
      outputFormat: 'Print the reversed string.',
      constraints: '1 <= len(S) <= 10^4',
      explanation: 'Reversing "hello" results in "olleh".',
      difficulty: 'Easy',
      category: 'Strings',
      marks: 10,
      starterCode: JSON.stringify({
        python: `import sys

def solve():
    s = sys.stdin.readline().strip()
    # Write your implementation here
    print(s[::-1])

if __name__ == '__main__':
    solve()`,
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNext()) return;
        String s = sc.next();
        StringBuilder sb = new StringBuilder(s);
        System.out.println(sb.reverse().toString());
    }
}`,
        c: `#include <stdio.h>
#include <string.h>

int main() {
    char s[10005];
    if (scanf("%s", s) != 1) return 0;
    int len = strlen(s);
    for (int i = len - 1; i >= 0; i--) {
        putchar(s[i]);
    }
    putchar('\\n');
    return 0;
}`,
        cpp: `#include <iostream>
#include <string>
#include <algorithm>

using namespace std;

int main() {
    string s;
    if (cin >> s) {
        reverse(s.begin(), s.end());
        cout << s << endl;
    }
    return 0;
}`,
      }),
      testCases: [
        { input: 'hello', expectedOutput: 'olleh', isHidden: false, orderIndex: 1 },
        { input: 'coding', expectedOutput: 'gnidoc', isHidden: false, orderIndex: 2 },
        { input: 'SkillRack', expectedOutput: 'kcaRllikS', isHidden: true, orderIndex: 3 },
        { input: 'racecar', expectedOutput: 'racecar', isHidden: true, orderIndex: 4 },
      ],
    },
    {
      title: 'Check Palindrome',
      description: 'Determine if a given string is a palindrome. Output "Yes" if it is, otherwise output "No".',
      inputFormat: 'A single string S consisting of lowercase alphanumeric characters.',
      outputFormat: 'Print "Yes" or "No" (case-sensitive).',
      constraints: '1 <= len(S) <= 10^5',
      explanation: '"radar" reversed is "radar", so output Yes.',
      difficulty: 'Easy',
      category: 'Strings',
      marks: 10,
      starterCode: JSON.stringify({
        python: `import sys

def solve():
    s = sys.stdin.readline().strip()
    if s == s[::-1]:
        print("Yes")
    else:
        print("No")

if __name__ == '__main__':
    solve()`,
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNext()) return;
        String s = sc.next();
        int left = 0, right = s.length() - 1;
        boolean ok = true;
        while (left < right) {
            if (s.charAt(left++) != s.charAt(right--)) {
                ok = false;
                break;
            }
        }
        System.out.println(ok ? "Yes" : "No");
    }
}`,
        c: `#include <stdio.h>
#include <string.h>

int main() {
    char s[10005];
    if (scanf("%s", s) != 1) return 0;
    int len = strlen(s);
    int ok = 1;
    for (int i = 0; i < len / 2; i++) {
        if (s[i] != s[len - 1 - i]) {
            ok = 0;
            break;
        }
    }
    printf("%s\\n", ok ? "Yes" : "No");
    return 0;
}`,
        cpp: `#include <iostream>
#include <string>

using namespace std;

int main() {
    string s;
    if (cin >> s) {
        int i = 0, j = s.size() - 1;
        bool ok = true;
        while (i < j) {
            if (s[i++] != s[j--]) { ok = false; break; }
        }
        cout << (ok ? "Yes" : "No") << endl;
    }
    return 0;
}`,
      }),
      testCases: [
        { input: 'radar', expectedOutput: 'Yes', isHidden: false, orderIndex: 1 },
        { input: 'algorithm', expectedOutput: 'No', isHidden: false, orderIndex: 2 },
        { input: 'madam', expectedOutput: 'Yes', isHidden: true, orderIndex: 3 },
        { input: 'abccba', expectedOutput: 'Yes', isHidden: true, orderIndex: 4 },
        { input: 'abca', expectedOutput: 'No', isHidden: true, orderIndex: 5 },
      ],
    },
    {
      title: 'Find Prime Number',
      description: 'Check whether a given integer N is a prime number. Print "Prime" or "Not Prime".',
      inputFormat: 'A single integer N.',
      outputFormat: 'Print "Prime" or "Not Prime".',
      constraints: '1 <= N <= 10^9',
      explanation: '7 has only two positive divisors (1 and 7), so it is Prime.',
      difficulty: 'Easy',
      category: 'Mathematics',
      marks: 10,
      starterCode: JSON.stringify({
        python: `import sys

def solve():
    n = int(sys.stdin.readline())
    if n <= 1:
        print("Not Prime")
        return
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            print("Not Prime")
            return
    print("Prime")

if __name__ == '__main__':
    solve()`,
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        if (n <= 1) {
            System.out.println("Not Prime");
            return;
        }
        boolean prime = true;
        for (int i = 2; (long)i * i <= n; i++) {
            if (n % i == 0) {
                prime = false;
                break;
            }
        }
        System.out.println(prime ? "Prime" : "Not Prime");
    }
}`,
        c: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    if (n <= 1) { printf("Not Prime\\n"); return 0; }
    int prime = 1;
    for (long long i = 2; i * i <= n; i++) {
        if (n % i == 0) { prime = 0; break; }
    }
    printf("%s\\n", prime ? "Prime" : "Not Prime");
    return 0;
}`,
        cpp: `#include <iostream>

using namespace std;

int main() {
    int n;
    if (cin >> n) {
        if (n <= 1) { cout << "Not Prime" << endl; return 0; }
        bool ok = true;
        for (long long i = 2; i * i <= n; i++) {
            if (n % i == 0) { ok = false; break; }
        }
        cout << (ok ? "Prime" : "Not Prime") << endl;
    }
    return 0;
}`,
      }),
      testCases: [
        { input: '7', expectedOutput: 'Prime', isHidden: false, orderIndex: 1 },
        { input: '12', expectedOutput: 'Not Prime', isHidden: false, orderIndex: 2 },
        { input: '1', expectedOutput: 'Not Prime', isHidden: true, orderIndex: 3 },
        { input: '997', expectedOutput: 'Prime', isHidden: true, orderIndex: 4 },
        { input: '1000000007', expectedOutput: 'Prime', isHidden: true, orderIndex: 5 },
      ],
    },
    {
      title: 'Fibonacci Series',
      description: 'Given an integer N, print the first N numbers in the Fibonacci series starting from 0 and 1, space-separated.',
      inputFormat: 'A single integer N.',
      outputFormat: 'Print the first N Fibonacci numbers separated by space.',
      constraints: '1 <= N <= 40',
      explanation: 'For N = 5, output is 0 1 1 2 3.',
      difficulty: 'Easy',
      category: 'Mathematics',
      marks: 10,
      starterCode: JSON.stringify({
        python: `import sys

def solve():
    n = int(sys.stdin.readline())
    if n <= 0:
        return
    fib = [0, 1]
    while len(fib) < n:
        fib.append(fib[-1] + fib[-2])
    print(" ".join(map(str, fib[:n])))

if __name__ == '__main__':
    solve()`,
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        if (n == 1) { System.out.println("0"); return; }
        long[] fib = new long[n];
        fib[0] = 0; fib[1] = 1;
        for (int i = 2; i < n; i++) fib[i] = fib[i-1] + fib[i-2];
        for (int i = 0; i < n; i++) {
            System.out.print(fib[i] + (i == n-1 ? "" : " "));
        }
        System.out.println();
    }
}`,
        c: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    long long a = 0, b = 1;
    for (int i = 0; i < n; i++) {
        if (i == 0) printf("%lld", a);
        else if (i == 1) printf(" %lld", b);
        else {
            long long c = a + b;
            printf(" %lld", c);
            a = b;
            b = c;
        }
    }
    printf("\\n");
    return 0;
}`,
        cpp: `#include <iostream>
#include <vector>

using namespace std;

int main() {
    int n;
    if (cin >> n) {
        vector<long long> f(n);
        if (n >= 1) f[0] = 0;
        if (n >= 2) f[1] = 1;
        for (int i = 2; i < n; i++) f[i] = f[i-1] + f[i-2];
        for (int i = 0; i < n; i++) {
            cout << f[i] << (i == n-1 ? "" : " ");
        }
        cout << endl;
    }
    return 0;
}`,
      }),
      testCases: [
        { input: '5', expectedOutput: '0 1 1 2 3', isHidden: false, orderIndex: 1 },
        { input: '1', expectedOutput: '0', isHidden: false, orderIndex: 2 },
        { input: '8', expectedOutput: '0 1 1 2 3 5 8 13', isHidden: true, orderIndex: 3 },
        { input: '10', expectedOutput: '0 1 1 2 3 5 8 13 21 34', isHidden: true, orderIndex: 4 },
      ],
    },
    {
      title: 'Binary Search',
      description: 'Implement binary search. Given a sorted array of N integers and a target value K, find the 0-based index of K. If not present, print -1.',
      inputFormat: 'First line contains integer N.\nSecond line contains N sorted space-separated integers.\nThird line contains target integer K.',
      outputFormat: 'Print the 0-based index of K in the array, or -1.',
      constraints: '1 <= N <= 10^5\nArray is strictly sorted in ascending order.',
      explanation: 'In [10, 20, 30, 40, 50], target 30 is at index 2.',
      difficulty: 'Medium',
      category: 'Searching',
      marks: 15,
      starterCode: JSON.stringify({
        python: `import sys

def solve():
    lines = sys.stdin.read().split()
    if not lines: return
    n = int(lines[0])
    arr = [int(x) for x in lines[1:n+1]]
    k = int(lines[n+1])
    
    low, high = 0, n - 1
    ans = -1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == k:
            ans = mid
            break
        elif arr[mid] < k:
            low = mid + 1
        else:
            high = mid - 1
    print(ans)

if __name__ == '__main__':
    solve()`,
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
        int k = sc.nextInt();
        int l = 0, r = n - 1, ans = -1;
        while (l <= r) {
            int mid = l + (r - l) / 2;
            if (arr[mid] == k) { ans = mid; break; }
            else if (arr[mid] < k) l = mid + 1;
            else r = mid - 1;
        }
        System.out.println(ans);
    }
}`,
        c: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int arr[100000];
    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);
    int k;
    scanf("%d", &k);
    int l = 0, r = n - 1, ans = -1;
    while (l <= r) {
        int mid = l + (r - l) / 2;
        if (arr[mid] == k) { ans = mid; break; }
        else if (arr[mid] < k) l = mid + 1;
        else r = mid - 1;
    }
    printf("%d\\n", ans);
    return 0;
}`,
        cpp: `#include <iostream>
#include <vector>

using namespace std;

int main() {
    int n;
    if (cin >> n) {
        vector<int> a(n);
        for (int i = 0; i < n; i++) cin >> a[i];
        int k;
        cin >> k;
        int l = 0, r = n - 1, ans = -1;
        while (l <= r) {
            int mid = l + (r - l) / 2;
            if (a[mid] == k) { ans = mid; break; }
            else if (a[mid] < k) l = mid + 1;
            else r = mid - 1;
        }
        cout << ans << endl;
    }
    return 0;
}`,
      }),
      testCases: [
        { input: '5\n10 20 30 40 50\n30', expectedOutput: '2', isHidden: false, orderIndex: 1 },
        { input: '5\n1 3 5 7 9\n4', expectedOutput: '-1', isHidden: false, orderIndex: 2 },
        { input: '6\n2 4 6 8 10 12\n2', expectedOutput: '0', isHidden: true, orderIndex: 3 },
        { input: '6\n2 4 6 8 10 12\n12', expectedOutput: '5', isHidden: true, orderIndex: 4 },
        { input: '1\n100\n100', expectedOutput: '0', isHidden: true, orderIndex: 5 },
      ],
    },
    {
      title: 'Bubble Sort',
      description: 'Sort an array of N integers in ascending order using the Bubble Sort algorithm and print the sorted array space-separated.',
      inputFormat: 'First line contains integer N.\nSecond line contains N integers.',
      outputFormat: 'Print the sorted array elements separated by a single space.',
      constraints: '1 <= N <= 500',
      explanation: '[5, 1, 4, 2, 8] sorted becomes [1, 2, 4, 5, 8].',
      difficulty: 'Easy',
      category: 'Sorting',
      marks: 10,
      starterCode: JSON.stringify({
        python: `import sys

def solve():
    lines = sys.stdin.read().split()
    if not lines: return
    n = int(lines[0])
    arr = [int(x) for x in lines[1:n+1]]
    arr.sort()
    print(" ".join(map(str, arr)))

if __name__ == '__main__':
    solve()`,
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
        Arrays.sort(arr);
        for (int i = 0; i < n; i++) {
            System.out.print(arr[i] + (i == n-1 ? "" : " "));
        }
        System.out.println();
    }
}`,
        c: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int arr[1000];
    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j+1]) {
                int temp = arr[j];
                arr[j] = arr[j+1];
                arr[j+1] = temp;
            }
        }
    }
    for (int i = 0; i < n; i++) {
        printf("%d%s", arr[i], (i == n-1 ? "" : " "));
    }
    printf("\\n");
    return 0;
}`,
        cpp: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    int n;
    if (cin >> n) {
        vector<int> a(n);
        for (int i = 0; i < n; i++) cin >> a[i];
        sort(a.begin(), a.end());
        for (int i = 0; i < n; i++) {
            cout << a[i] << (i == n-1 ? "" : " ");
        }
        cout << endl;
    }
    return 0;
}`,
      }),
      testCases: [
        { input: '5\n5 1 4 2 8', expectedOutput: '1 2 4 5 8', isHidden: false, orderIndex: 1 },
        { input: '3\n3 2 1', expectedOutput: '1 2 3', isHidden: false, orderIndex: 2 },
        { input: '4\n-1 -5 10 0', expectedOutput: '-5 -1 0 10', isHidden: true, orderIndex: 3 },
      ],
    },
    {
      title: 'Count Vowels',
      description: 'Count the total number of vowels (a, e, i, o, u, case-insensitive) in a given string.',
      inputFormat: 'A single string S which may contain letters and spaces.',
      outputFormat: 'Print the count of vowels.',
      constraints: '1 <= len(S) <= 10^4',
      explanation: 'In "SkillRack", vowels are "i", "a" -> count = 2.',
      difficulty: 'Easy',
      category: 'Strings',
      marks: 10,
      starterCode: JSON.stringify({
        python: `import sys

def solve():
    s = sys.stdin.read().lower()
    vowels = set('aeiou')
    count = sum(1 for c in s if c in vowels)
    print(count)

if __name__ == '__main__':
    solve()`,
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine().toLowerCase();
        int count = 0;
        for (char c : s.toCharArray()) {
            if ("aeiou".indexOf(c) != -1) count++;
        }
        System.out.println(count);
    }
}`,
        c: `#include <stdio.h>
#include <ctype.h>

int main() {
    char s[10005];
    if (!fgets(s, sizeof(s), stdin)) return 0;
    int count = 0;
    for (int i = 0; s[i]; i++) {
        char c = tolower(s[i]);
        if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') count++;
    }
    printf("%d\\n", count);
    return 0;
}`,
        cpp: `#include <iostream>
#include <string>

using namespace std;

int main() {
    string s;
    if (getline(cin, s)) {
        int count = 0;
        for (char c : s) {
            char l = tolower(c);
            if (l == 'a' || l == 'e' || l == 'i' || l == 'o' || l == 'u') count++;
        }
        cout << count << endl;
    }
    return 0;
}`,
      }),
      testCases: [
        { input: 'SkillRack', expectedOutput: '2', isHidden: false, orderIndex: 1 },
        { input: 'Education', expectedOutput: '5', isHidden: false, orderIndex: 2 },
        { input: 'rhythm', expectedOutput: '0', isHidden: true, orderIndex: 3 },
        { input: 'AEIOU aeiou', expectedOutput: '10', isHidden: true, orderIndex: 4 },
      ],
    },
    {
      title: 'Find Duplicate Elements',
      description: 'Given an array of integers, identify all duplicate elements. Print the unique duplicate elements in sorted ascending order separated by space. If no duplicates exist, print -1.',
      inputFormat: 'First line contains integer N.\nSecond line contains N integers.',
      outputFormat: 'Print sorted duplicate numbers or -1.',
      constraints: '1 <= N <= 10^5',
      explanation: 'In [2, 3, 1, 2, 3], duplicates are 2 and 3.',
      difficulty: 'Medium',
      category: 'Data Structures',
      marks: 15,
      starterCode: JSON.stringify({
        python: `import sys

def solve():
    lines = sys.stdin.read().split()
    if not lines: return
    n = int(lines[0])
    arr = [int(x) for x in lines[1:n+1]]
    seen = set()
    dups = set()
    for x in arr:
        if x in seen:
            dups.add(x)
        seen.add(x)
    if not dups:
        print(-1)
    else:
        print(" ".join(map(str, sorted(dups))))

if __name__ == '__main__':
    solve()`,
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        Set<Integer> seen = new HashSet<>();
        Set<Integer> dups = new TreeSet<>();
        for (int i = 0; i < n; i++) {
            int val = sc.nextInt();
            if (seen.contains(val)) dups.add(val);
            seen.add(val);
        }
        if (dups.isEmpty()) {
            System.out.println(-1);
        } else {
            StringBuilder sb = new StringBuilder();
            for (int x : dups) sb.append(x).append(" ");
            System.out.println(sb.toString().trim());
        }
    }
}`,
        c: `#include <stdio.h>
#include <stdlib.h>

int cmp(const void *a, const void *b) { return (*(int*)a - *(int*)b); }

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int *arr = (int*)malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);
    qsort(arr, n, sizeof(int), cmp);
    int printed = 0;
    for (int i = 0; i < n - 1; i++) {
        if (arr[i] == arr[i+1]) {
            if (printed > 0) printf(" ");
            printf("%d", arr[i]);
            printed++;
            while (i < n - 1 && arr[i] == arr[i+1]) i++;
        }
    }
    if (!printed) printf("-1");
    printf("\\n");
    free(arr);
    return 0;
}`,
        cpp: `#include <iostream>
#include <vector>
#include <set>

using namespace std;

int main() {
    int n;
    if (cin >> n) {
        set<int> seen, dups;
        for (int i = 0; i < n; i++) {
            int x; cin >> x;
            if (seen.count(x)) dups.insert(x);
            seen.insert(x);
        }
        if (dups.empty()) cout << -1 << endl;
        else {
            bool first = true;
            for (int x : dups) {
                if (!first) cout << " ";
                cout << x;
                first = false;
            }
            cout << endl;
        }
    }
    return 0;
}`,
      }),
      testCases: [
        { input: '5\n2 3 1 2 3', expectedOutput: '2 3', isHidden: false, orderIndex: 1 },
        { input: '4\n1 2 3 4', expectedOutput: '-1', isHidden: false, orderIndex: 2 },
        { input: '6\n5 5 5 1 2 2', expectedOutput: '2 5', isHidden: true, orderIndex: 3 },
      ],
    },
    {
      title: 'Matrix Addition',
      description: 'Given two matrices of size R x C, compute their matrix sum and print the resulting matrix.',
      inputFormat: 'First line contains two integers R and C.\nNext R lines contain C integers each (first matrix).\nNext R lines contain C integers each (second matrix).',
      outputFormat: 'Print the R x C resulting sum matrix with each row on a new line and elements space-separated.',
      constraints: '1 <= R, C <= 100',
      explanation: 'Corresponding cell elements are summed.',
      difficulty: 'Medium',
      category: 'Data Structures',
      marks: 15,
      starterCode: JSON.stringify({
        python: `import sys

def solve():
    data = sys.stdin.read().split()
    if not data: return
    r, c = int(data[0]), int(data[1])
    idx = 2
    mat1 = []
    for _ in range(r):
        mat1.append([int(x) for x in data[idx:idx+c]])
        idx += c
    mat2 = []
    for _ in range(r):
        mat2.append([int(x) for x in data[idx:idx+c]])
        idx += c
    for i in range(r):
        row = [str(mat1[i][j] + mat2[i][j]) for j in range(c)]
        print(" ".join(row))

if __name__ == '__main__':
    solve()`,
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int r = sc.nextInt(), c = sc.nextInt();
        int[][] m1 = new int[r][c];
        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) m1[i][j] = sc.nextInt();
        for (int i = 0; i < r; i++) {
            for (int j = 0; j < c; j++) {
                int val = m1[i][j] + sc.nextInt();
                System.out.print(val + (j == c-1 ? "" : " "));
            }
            System.out.println();
        }
    }
}`,
        c: `#include <stdio.h>

int main() {
    int r, c;
    if (scanf("%d %d", &r, &c) != 2) return 0;
    int m1[100][100];
    for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) scanf("%d", &m1[i][j]);
    for (int i = 0; i < r; i++) {
        for (int j = 0; j < c; j++) {
            int x; scanf("%d", &x);
            printf("%d%s", m1[i][j] + x, (j == c-1 ? "" : " "));
        }
        printf("\\n");
    }
    return 0;
}`,
        cpp: `#include <iostream>
#include <vector>

using namespace std;

int main() {
    int r, c;
    if (cin >> r >> c) {
        vector<vector<int>> a(r, vector<int>(c));
        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) cin >> a[i][j];
        for (int i = 0; i < r; i++) {
            for (int j = 0; j < c; j++) {
                int b; cin >> b;
                cout << a[i][j] + b << (j == c-1 ? "" : " ");
            }
            cout << endl;
        }
    }
    return 0;
}`,
      }),
      testCases: [
        { input: '2 2\n1 2\n3 4\n5 6\n7 8', expectedOutput: '6 8\n10 12', isHidden: false, orderIndex: 1 },
        { input: '1 3\n1 2 3\n4 5 6', expectedOutput: '5 7 9', isHidden: false, orderIndex: 2 },
        { input: '2 3\n0 0 0\n1 1 1\n2 2 2\n3 3 3', expectedOutput: '2 2 2\n4 4 4', isHidden: true, orderIndex: 3 },
      ],
    },
    {
      title: 'Factorial Using Recursion',
      description: 'Compute the factorial of a given non-negative integer N using recursion.',
      inputFormat: 'A single integer N.',
      outputFormat: 'Print N!',
      constraints: '0 <= N <= 20',
      explanation: '5! = 5 * 4 * 3 * 2 * 1 = 120.',
      difficulty: 'Easy',
      category: 'Recursion',
      marks: 10,
      starterCode: JSON.stringify({
        python: `import sys

def fact(n):
    if n <= 1:
        return 1
    return n * fact(n - 1)

def solve():
    n = int(sys.stdin.readline())
    print(fact(n))

if __name__ == '__main__':
    solve()`,
        java: `import java.util.*;

public class Main {
    static long fact(int n) {
        if (n <= 1) return 1;
        return (long)n * fact(n - 1);
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) System.out.println(fact(sc.nextInt()));
    }
}`,
        c: `#include <stdio.h>

long long fact(int n) {
    if (n <= 1) return 1;
    return (long long)n * fact(n - 1);
}

int main() {
    int n;
    if (scanf("%d", &n) == 1) printf("%lld\\n", fact(n));
    return 0;
}`,
        cpp: `#include <iostream>

using namespace std;

long long fact(int n) {
    if (n <= 1) return 1;
    return (long long)n * fact(n - 1);
}

int main() {
    int n;
    if (cin >> n) cout << fact(n) << endl;
    return 0;
}`,
      }),
      testCases: [
        { input: '5', expectedOutput: '120', isHidden: false, orderIndex: 1 },
        { input: '0', expectedOutput: '1', isHidden: false, orderIndex: 2 },
        { input: '7', expectedOutput: '5040', isHidden: true, orderIndex: 3 },
        { input: '12', expectedOutput: '479001600', isHidden: true, orderIndex: 4 },
      ],
    },
    {
      title: 'Second Largest Element',
      description: 'Given an array of N integers, find the second largest distinct element. If no second largest exists, print -1.',
      inputFormat: 'First line contains integer N.\nSecond line contains N space-separated integers.',
      outputFormat: 'Print the second largest distinct integer or -1.',
      constraints: '1 <= N <= 10^5',
      explanation: 'In [12, 35, 1, 10, 34, 1], largest is 35 and second largest is 34.',
      difficulty: 'Medium',
      category: 'Arrays',
      marks: 15,
      starterCode: JSON.stringify({
        python: `import sys

def solve():
    lines = sys.stdin.read().split()
    if not lines: return
    n = int(lines[0])
    arr = set(int(x) for x in lines[1:n+1])
    if len(arr) < 2:
        print(-1)
    else:
        arr.remove(max(arr))
        print(max(arr))

if __name__ == '__main__':
    solve()`,
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int max1 = Integer.MIN_VALUE, max2 = Integer.MIN_VALUE;
        for (int i = 0; i < n; i++) {
            int v = sc.nextInt();
            if (v > max1) { max2 = max1; max1 = v; }
            else if (v > max2 && v != max1) { max2 = v; }
        }
        System.out.println(max2 == Integer.MIN_VALUE ? -1 : max2);
    }
}`,
        c: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int max1 = -2000000000, max2 = -2000000000;
    for (int i = 0; i < n; i++) {
        int v; scanf("%d", &v);
        if (v > max1) { max2 = max1; max1 = v; }
        else if (v > max2 && v != max1) { max2 = v; }
    }
    printf("%d\\n", max2 == -2000000000 ? -1 : max2);
    return 0;
}`,
        cpp: `#include <iostream>
#include <vector>
#include <set>

using namespace std;

int main() {
    int n;
    if (cin >> n) {
        set<int> s;
        for (int i = 0; i < n; i++) { int x; cin >> x; s.insert(x); }
        if (s.size() < 2) cout << -1 << endl;
        else {
            auto it = s.rbegin();
            it++;
            cout << *it << endl;
        }
    }
    return 0;
}`,
      }),
      testCases: [
        { input: '6\n12 35 1 10 34 1', expectedOutput: '34', isHidden: false, orderIndex: 1 },
        { input: '3\n10 10 10', expectedOutput: '-1', isHidden: false, orderIndex: 2 },
        { input: '5\n5 4 3 2 1', expectedOutput: '4', isHidden: true, orderIndex: 3 },
      ],
    },
    {
      title: 'Anagram Check',
      description: 'Given two strings S1 and S2, check whether they are anagrams of each other (contain the same characters with the same frequency). Print "True" or "False".',
      inputFormat: 'First line contains string S1.\nSecond line contains string S2.',
      outputFormat: 'Print "True" or "False".',
      constraints: '1 <= len(S1), len(S2) <= 10^5',
      explanation: '"listen" and "silent" are anagrams.',
      difficulty: 'Easy',
      category: 'Strings',
      marks: 10,
      starterCode: JSON.stringify({
        python: `import sys

def solve():
    lines = sys.stdin.read().split()
    if len(lines) < 2: return
    s1, s2 = lines[0], lines[1]
    print(str(sorted(s1) == sorted(s2)))

if __name__ == '__main__':
    solve()`,
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNext()) return;
        String s1 = sc.next(), s2 = sc.next();
        char[] a1 = s1.toCharArray(), a2 = s2.toCharArray();
        Arrays.sort(a1); Arrays.sort(a2);
        System.out.println(Arrays.equals(a1, a2) ? "True" : "False");
    }
}`,
        c: `#include <stdio.h>
#include <string.h>

int main() {
    char s1[10005], s2[10005];
    if (scanf("%s %s", s1, s2) != 2) return 0;
    if (strlen(s1) != strlen(s2)) { printf("False\\n"); return 0; }
    int count[256] = {0};
    for (int i = 0; s1[i]; i++) { count[(unsigned char)s1[i]]++; count[(unsigned char)s2[i]]--; }
    for (int i = 0; i < 256; i++) {
        if (count[i] != 0) { printf("False\\n"); return 0; }
    }
    printf("True\\n");
    return 0;
}`,
        cpp: `#include <iostream>
#include <string>
#include <algorithm>

using namespace std;

int main() {
    string s1, s2;
    if (cin >> s1 >> s2) {
        sort(s1.begin(), s1.end());
        sort(s2.begin(), s2.end());
        cout << (s1 == s2 ? "True" : "False") << endl;
    }
    return 0;
}`,
      }),
      testCases: [
        { input: 'listen\nsilent', expectedOutput: 'True', isHidden: false, orderIndex: 1 },
        { input: 'hello\nworld', expectedOutput: 'False', isHidden: false, orderIndex: 2 },
        { input: 'triangle\nintegral', expectedOutput: 'True', isHidden: true, orderIndex: 3 },
      ],
    },
    {
      title: 'Sum of Array',
      description: 'Calculate and print the sum of all elements in an integer array.',
      inputFormat: 'First line contains integer N.\nSecond line contains N integers.',
      outputFormat: 'Print the integer sum.',
      constraints: '1 <= N <= 10^5\n-10^9 <= arr[i] <= 10^9',
      explanation: '1 + 2 + 3 + 4 = 10.',
      difficulty: 'Easy',
      category: 'Arrays',
      marks: 10,
      starterCode: JSON.stringify({
        python: `import sys

def solve():
    lines = sys.stdin.read().split()
    if not lines: return
    n = int(lines[0])
    arr = [int(x) for x in lines[1:n+1]]
    print(sum(arr))

if __name__ == '__main__':
    solve()`,
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        long sum = 0;
        for (int i = 0; i < n; i++) sum += sc.nextLong();
        System.out.println(sum);
    }
}`,
        c: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    long long sum = 0;
    for (int i = 0; i < n; i++) {
        long long x; scanf("%lld", &x);
        sum += x;
    }
    printf("%lld\\n", sum);
    return 0;
}`,
        cpp: `#include <iostream>

using namespace std;

int main() {
    int n;
    if (cin >> n) {
        long long sum = 0;
        for (int i = 0; i < n; i++) { long long x; cin >> x; sum += x; }
        cout << sum << endl;
    }
    return 0;
}`,
      }),
      testCases: [
        { input: '4\n1 2 3 4', expectedOutput: '10', isHidden: false, orderIndex: 1 },
        { input: '3\n-5 10 -2', expectedOutput: '3', isHidden: false, orderIndex: 2 },
        { input: '1\n1000', expectedOutput: '1000', isHidden: true, orderIndex: 3 },
      ],
    },
    {
      title: 'Frequency of Characters',
      description: 'Count the frequency of each lowercase character in a given string. Print each character and its count space-separated in alphabetical order, one per line.',
      inputFormat: 'A single string S without spaces containing lowercase English letters.',
      outputFormat: 'Print "char count" on each line in alphabetical order.',
      constraints: '1 <= len(S) <= 10^5',
      explanation: 'In "apple", a=1, e=1, l=1, p=2.',
      difficulty: 'Medium',
      category: 'Strings',
      marks: 15,
      starterCode: JSON.stringify({
        python: `import sys

def solve():
    s = sys.stdin.readline().strip()
    freq = {}
    for c in s:
        freq[c] = freq.get(c, 0) + 1
    for c in sorted(freq.keys()):
        print(f"{c} {freq[c]}")

if __name__ == '__main__':
    solve()`,
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNext()) return;
        String s = sc.next();
        int[] freq = new int[26];
        for (char c : s.toCharArray()) freq[c - 'a']++;
        for (int i = 0; i < 26; i++) {
            if (freq[i] > 0) System.out.println((char)('a' + i) + " " + freq[i]);
        }
    }
}`,
        c: `#include <stdio.h>

int main() {
    char s[10005];
    if (scanf("%s", s) != 1) return 0;
    int freq[26] = {0};
    for (int i = 0; s[i]; i++) freq[s[i] - 'a']++;
    for (int i = 0; i < 26; i++) {
        if (freq[i] > 0) printf("%c %d\\n", 'a' + i, freq[i]);
    }
    return 0;
}`,
        cpp: `#include <iostream>
#include <string>
#include <vector>

using namespace std;

int main() {
    string s;
    if (cin >> s) {
        vector<int> f(26, 0);
        for (char c : s) f[c - 'a']++;
        for (int i = 0; i < 26; i++) {
            if (f[i] > 0) cout << (char)('a' + i) << " " << f[i] << endl;
        }
    }
    return 0;
}`,
      }),
      testCases: [
        { input: 'apple', expectedOutput: 'a 1\ne 1\nl 1\np 2', isHidden: false, orderIndex: 1 },
        { input: 'skill', expectedOutput: 'i 1\nk 1\nl 2\ns 1', isHidden: false, orderIndex: 2 },
        { input: 'banana', expectedOutput: 'a 3\nb 1\nn 2', isHidden: true, orderIndex: 3 },
      ],
    },
  ];

  const createdQuestions: any[] = [];
  for (const q of sampleQuestions) {
    const { testCases, ...questionData } = q;
    const question = await prisma.question.create({
      data: {
        ...questionData,
        starterCode: cleanStarterCodeJson,
        createdById: adminUser.id,
        testCases: {
          create: testCases,
        },
      },
      include: { testCases: true },
    });
    createdQuestions.push(question);
  }
  console.log(`✓ 15 Questions created across Arrays, Strings, Sorting, Searching, Math, Recursion, Data Structures.`);

  // 5. Create 3 Sample Assessments
  const assessment1 = await prisma.assessment.create({
    data: {
      title: 'Data Structures & Algorithms - Mid Term Sprint',
      description: 'Comprehensive mid-term coding assessment covering Arrays, Strings, Searching, and Sorting.',
      instructions: '1. Monaco editor is provided with Python, Java, C, and C++.\n2. Do NOT switch browser tabs or exit fullscreen.\n3. Clipboard paste is strictly blocked and monitored.\n4. Ensure you run sample test cases before submitting.',
      duration: 60,
      totalMarks: 50,
      passingMarks: 25,
      allowedLanguages: 'python,java,c,cpp',
      disableCopyPaste: true,
      enforceFullscreen: true,
      trackTabSwitches: true,
      isPublished: true,
      createdById: adminUser.id,
      questions: {
        create: [
          { questionId: createdQuestions[0].id, order: 0, marks: 10 }, // Find Largest
          { questionId: createdQuestions[1].id, order: 1, marks: 10 }, // Reverse String
          { questionId: createdQuestions[2].id, order: 2, marks: 10 }, // Palindrome
          { questionId: createdQuestions[5].id, order: 3, marks: 10 }, // Binary Search
          { questionId: createdQuestions[6].id, order: 4, marks: 10 }, // Bubble Sort
        ],
      },
      assignments: {
        create: [
          { batchId: batchIiiC.id },
        ],
      },
    },
  });

  const assessment2 = await prisma.assessment.create({
    data: {
      title: 'Core Programming & Logic Sprint',
      description: 'Fundamental problem solving on prime numbers, factorials, vowels, and array summation.',
      instructions: 'Proctored examination. Strict anti-cheating enabled. Auto-save is active.',
      duration: 45,
      totalMarks: 40,
      passingMarks: 20,
      allowedLanguages: 'python,java,c,cpp',
      disableCopyPaste: true,
      enforceFullscreen: true,
      trackTabSwitches: true,
      isPublished: true,
      createdById: adminUser.id,
      questions: {
        create: [
          { questionId: createdQuestions[3].id, order: 0, marks: 10 }, // Prime Number
          { questionId: createdQuestions[4].id, order: 1, marks: 10 }, // Fibonacci
          { questionId: createdQuestions[7].id, order: 2, marks: 10 }, // Count Vowels
          { questionId: createdQuestions[10].id, order: 3, marks: 10 }, // Factorial Recursion
        ],
      },
      assignments: {
        create: [
          { batchId: batchIiiC.id },
        ],
      },
    },
  });

  const assessment3 = await prisma.assessment.create({
    data: {
      title: 'Advanced Data Structures & Strings Arena',
      description: 'Competitive coding assessment on Matrix Addition, Duplicate detection, and Character frequencies.',
      instructions: 'Time: 90 minutes. Full proctoring enabled.',
      duration: 90,
      totalMarks: 60,
      passingMarks: 30,
      allowedLanguages: 'python,java,c,cpp',
      disableCopyPaste: true,
      enforceFullscreen: true,
      trackTabSwitches: true,
      isPublished: true,
      createdById: adminUser.id,
      questions: {
        create: [
          { questionId: createdQuestions[8].id, order: 0, marks: 15 }, // Duplicates
          { questionId: createdQuestions[9].id, order: 1, marks: 15 }, // Matrix Addition
          { questionId: createdQuestions[11].id, order: 2, marks: 15 }, // Second Largest
          { questionId: createdQuestions[14].id, order: 3, marks: 15 }, // Frequency of characters
        ],
      },
      assignments: {
        create: [
          { batchId: batchIiiC.id },
        ],
      },
    },
  });
  console.log('✓ 3 Assessments created and assigned to III CSE C.');
  console.log('--- Database Seeding Complete (Zero Fake Data) ---');

  console.log('--- Database Seeding Complete ---');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

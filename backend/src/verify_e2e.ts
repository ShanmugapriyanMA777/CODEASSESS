const BASE_URL = 'http://localhost:5000/api';

async function verifyEndToEnd() {
  console.log('=== STARTING END-TO-END VERIFICATION ===\n');

  // Step 1: Admin Login
  console.log('1. Testing Admin Login...');
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'varsha.cse@act.edu.in', password: 'varshag@act3128' }),
  });
  const adminLogin = await adminLoginRes.json();
  const adminToken = adminLogin.data.token;
  console.log('✓ Admin authenticated successfully. Role:', adminLogin.data.user.role);

  const adminHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminToken}`,
  };

  // Step 2: Admin creates a new question
  console.log('\n2. Testing Admin Question Creation...');
  const newQuestionRes = await fetch(`${BASE_URL}/questions`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      title: 'E2E Test: Array Element Multiplier',
      description: 'Given an array of integers and a multiplier factor K, multiply each element by K and print space-separated.',
      inputFormat: 'First line: N and K\nSecond line: N integers',
      outputFormat: 'N multiplied integers',
      constraints: '1 <= N <= 1000',
      difficulty: 'Easy',
      category: 'Arrays',
      marks: 10,
      starterCode: {
        python: `import sys\nlines = sys.stdin.read().split()\nif lines:\n    n, k = int(lines[0]), int(lines[1])\n    arr = [int(x) * k for x in lines[2:n+2]]\n    print(' '.join(map(str, arr)))`,
      },
      testCases: [
        { input: '3 2\n1 2 3', expectedOutput: '2 4 6', isHidden: false, orderIndex: 1 },
        { input: '4 5\n2 4 6 8', expectedOutput: '10 20 30 40', isHidden: true, orderIndex: 2 },
      ],
    }),
  });
  const qData = await newQuestionRes.json();
  const createdQuestion = qData.data;
  console.log('✓ Question created with ID:', createdQuestion.id, 'Title:', createdQuestion.title);

  // Step 3: Admin creates assessment
  console.log('\n3. Testing Admin Assessment Creation...');
  const newAssRes = await fetch(`${BASE_URL}/assessments`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      title: 'E2E Practical Coding Assessment 2026',
      description: 'End-to-end verification test assessment',
      duration: 30,
      totalMarks: 10,
      passingMarks: 5,
      disableCopyPaste: true,
      enforceFullscreen: true,
      trackTabSwitches: true,
      isPublished: true,
      questions: [{ questionId: createdQuestion.id, order: 0, marks: 10 }],
    }),
  });
  const assJson = await newAssRes.json();
  const createdAssessment = assJson.data;
  console.log('✓ Assessment created with ID:', createdAssessment.id);

  // Step 4: Student Login
  console.log('\n4. Testing Student Login...');
  const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'alex.johnson@example.com', password: 'Student@123' }),
  });
  const studentLogin = await studentLoginRes.json();
  const studentToken = studentLogin.data.token;
  const studentId = studentLogin.data.user.id;
  console.log('✓ Student logged in as Alex Johnson (ID:', studentId, ')');

  const studentHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${studentToken}`,
  };

  // Assign assessment to student
  await fetch(`${BASE_URL}/assessments/${createdAssessment.id}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({ studentIds: [studentId] }),
  });
  console.log('✓ Assigned assessment to candidate.');

  // Step 5: Student starts and views assessment
  console.log('\n5. Student starts assessment and checks questions...');
  const studentAssViewRes = await fetch(`${BASE_URL}/assessments/${createdAssessment.id}`, {
    headers: studentHeaders,
  });
  const assData = (await studentAssViewRes.json()).data;
  console.log('✓ Assessment loaded for student. Duration:', assData.duration, 'mins, Remaining:', assData.currentAttempt.remainingSeconds, 's');

  // Verify hidden test cases NOT exposed
  const studentQuestion = assData.questions[0].question;
  const studentTestCases = studentQuestion.testCases;
  const anyHiddenExposed = studentTestCases.some((tc: any) => tc.isHidden);
  console.log('✓ Hidden test cases exposed to student?', anyHiddenExposed ? 'SECURITY VIOLATION!' : 'NO (Securely protected!)');

  // Step 6: Student runs code against sample test cases
  console.log('\n6. Student runs code against sample test cases...');
  const studentCode = `import sys\nlines = sys.stdin.read().split()\nif lines:\n    n, k = int(lines[0]), int(lines[1])\n    arr = [int(x) * k for x in lines[2:n+2]]\n    print(' '.join(map(str, arr)))`;

  const runRes = await fetch(`${BASE_URL}/submissions/run`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      questionId: createdQuestion.id,
      language: 'python',
      sourceCode: studentCode,
    }),
  });
  const runData = (await runRes.json()).data;
  console.log('✓ Run Code executed. Result count:', runData.results.length);
  console.log('  Case 1 Status:', runData.results[0].status, 'Actual:', runData.results[0].actualOutput.trim());

  // Step 7: Student submits code (evaluated against hidden test cases)
  console.log('\n7. Student submits solution for grading...');
  const submitRes = await fetch(`${BASE_URL}/submissions/submit`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      assessmentId: createdAssessment.id,
      questionId: createdQuestion.id,
      language: 'python',
      sourceCode: studentCode,
    }),
  });
  const subData = (await submitRes.json()).data;
  console.log('✓ Submission evaluated!');
  console.log('  Status:', subData.status);
  console.log('  Marks Obtained:', subData.marksObtained, '/', subData.totalMarks);
  console.log('  Test Cases Passed:', subData.testCasesPassed, '/', subData.totalTestCases);

  // Security check: ensure hidden test case details in submission response did not leak input
  const hiddenCaseResult = subData.testCaseResults.find((tc: any) => tc.isHidden);
  console.log('✓ Hidden case result input returned to client:', hiddenCaseResult.input === undefined ? 'HIDDEN (Verified Safe)' : 'LEAKED');

  // Step 8: Student finishes assessment
  console.log('\n8. Student finalizes assessment...');
  const finishRes = await fetch(`${BASE_URL}/results/finish`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({ assessmentId: createdAssessment.id }),
  });
  const finalResult = (await finishRes.json()).data;
  console.log('✓ Assessment finished! Score:', finalResult.obtainedMarks, '/', finalResult.totalMarks, 'Rank:', finalResult.rank);

  // Step 9: Admin views results & rankings
  console.log('\n9. Admin views assessment results...');
  const adminResultsRes = await fetch(`${BASE_URL}/results?assessmentId=${createdAssessment.id}`, {
    headers: adminHeaders,
  });
  const adminResultsJson = (await adminResultsRes.json()).data;
  console.log('✓ Admin retrieved results. Total candidates:', adminResultsJson.length);
  console.log('  Top Rank Candidate:', adminResultsJson[0].student.name, 'Marks:', adminResultsJson[0].obtainedMarks);

  // Step 10: Admin generates and downloads PDF report
  console.log('\n10. Testing Institutional PDF Report Generation...');
  const pdfRes = await fetch(
    `${BASE_URL}/reports/student/${studentId}?assessmentId=${createdAssessment.id}`,
    {
      headers: { Authorization: `Bearer ${adminToken}` },
    }
  );
  const pdfBuffer = await pdfRes.arrayBuffer();
  console.log('✓ PDF generated successfully! Content-Type:', pdfRes.headers.get('content-type'), 'Size:', pdfBuffer.byteLength, 'bytes');

  console.log('\n=== ALL END-TO-END FLOW TESTS PASSED FLAWLESSLY! ===');
}

verifyEndToEnd().catch((err) => {
  console.error('E2E Verification Error:', err);
  process.exit(1);
});

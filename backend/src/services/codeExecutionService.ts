import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn, exec } from 'child_process';

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  executionTime: number; // in milliseconds
  memoryUsed: number;    // in KB
  status: 'Accepted' | 'Wrong Answer' | 'Compilation Error' | 'Runtime Error' | 'Time Limit Exceeded' | 'Memory Limit Exceeded';
  error?: string;
}

export class CodeExecutionService {
  private timeoutMs: number;
  private pythonCmd: string | null = null;
  private pythonChecked = false;

  constructor(timeoutMs = 5000) {
    this.timeoutMs = timeoutMs;
  }

  private async detectPythonCommand(): Promise<string | null> {
    if (this.pythonChecked && this.pythonCmd) return this.pythonCmd;

    const candidates = process.platform === 'win32' ? ['py', 'python', 'python3'] : ['python3', 'python'];
    for (const cmd of candidates) {
      const exists = await new Promise<boolean>((resolve) => {
        exec(`${cmd} --version`, { timeout: 3000 }, (err) => resolve(!err));
      });
      if (exists) {
        this.pythonCmd = cmd;
        this.pythonChecked = true;
        return cmd;
      }
    }
    this.pythonChecked = true;
    return null;
  }

  /**
   * Execute student code with real compilation/interpretation and strict error tracking
   */
  async execute(language: string, sourceCode: string, input = ''): Promise<ExecutionResult> {
    const lang = (language || '').toLowerCase().trim();
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-'));

    try {
      let res: ExecutionResult;

      if (lang === 'python' || lang === 'py') {
        const cmd = await this.detectPythonCommand();
        if (!cmd) {
          return {
            stdout: '',
            stderr: 'Python interpreter (py / python) is not installed or not in PATH.',
            executionTime: 0,
            memoryUsed: 0,
            status: 'Runtime Error',
            error: 'Python interpreter not found.',
          };
        }
        res = await this.executePython(tempDir, sourceCode, input, cmd);
      } else if (lang === 'java') {
        res = await this.executeJava(tempDir, sourceCode, input);
      } else if (lang === 'c' || lang === 'cpp' || lang === 'c++') {
        res = await this.executeCAndCpp(tempDir, sourceCode, input, lang);
      } else if (lang === 'javascript' || lang === 'js') {
        res = await this.executeJavaScript(tempDir, sourceCode, input);
      } else {
        return {
          stdout: '',
          stderr: `Unsupported programming language: ${language}`,
          executionTime: 0,
          memoryUsed: 0,
          status: 'Runtime Error',
          error: `Unsupported programming language: ${language}`,
        };
      }

      return res;
    } catch (err: any) {
      return {
        stdout: '',
        stderr: err.message || 'Execution error',
        executionTime: 0,
        memoryUsed: 0,
        status: 'Runtime Error',
        error: err.message,
      };
    } finally {
      // Clean up temp directory recursively
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (cleanupErr) {
        // Ignore cleanup errors
      }
    }
  }

  private executePython(tempDir: string, code: string, input: string, pythonCmd: string): Promise<ExecutionResult> {
    const scriptPath = path.join(tempDir, 'solution.py');
    fs.writeFileSync(scriptPath, code, 'utf-8');

    return this.spawnProcess(pythonCmd, ['-u', scriptPath], input, tempDir);
  }

  private async executeJava(tempDir: string, code: string, input: string): Promise<ExecutionResult> {
    const hasJavac = await new Promise<boolean>((resolve) => {
      exec('javac -version', { timeout: 3000 }, (err) => resolve(!err));
    });

    if (!hasJavac) {
      return {
        stdout: '',
        stderr: 'Java compiler (javac) is not installed on this system.',
        executionTime: 0,
        memoryUsed: 0,
        status: 'Compilation Error',
        error: 'javac not found.',
      };
    }

    let className = 'Main';
    const match = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
    if (match && match[1]) {
      className = match[1];
    } else if (!code.includes('public class')) {
      if (!code.includes('class')) {
        code = `import java.util.*;\npublic class Main {\n  public static void main(String[] args) {\n    ${code}\n  }\n}`;
      }
    }

    const sourcePath = path.join(tempDir, `${className}.java`);
    fs.writeFileSync(sourcePath, code, 'utf-8');

    const compileResult = await this.spawnProcess('javac', [sourcePath], '', tempDir, 5000);
    if (compileResult.status === 'Time Limit Exceeded') {
      return { ...compileResult, status: 'Compilation Error', error: 'Java compilation timed out' };
    }
    if (compileResult.status === 'Runtime Error' || (compileResult.stderr && (compileResult.stderr.includes('error:') || compileResult.stderr.includes('Error:')))) {
      return {
        stdout: '',
        stderr: compileResult.stderr || compileResult.error || 'Compilation failed',
        executionTime: compileResult.executionTime,
        memoryUsed: 0,
        status: 'Compilation Error',
        error: compileResult.stderr || compileResult.error,
      };
    }

    return this.spawnProcess('java', ['-Xmx128m', '-Xms16m', '-cp', tempDir, className], input, tempDir);
  }

  private async executeCAndCpp(tempDir: string, code: string, input: string, lang: string): Promise<ExecutionResult> {
    const isCpp = lang === 'cpp' || lang === 'c++';
    const ext = isCpp ? 'cpp' : 'c';
    const compiler = isCpp ? 'g++' : 'gcc';
    const sourcePath = path.join(tempDir, `solution.${ext}`);
    const binExt = process.platform === 'win32' ? '.exe' : '';
    const binaryPath = path.join(tempDir, `solution${binExt}`);

    fs.writeFileSync(sourcePath, code, 'utf-8');

    const hasCompiler = await new Promise<boolean>((resolve) => {
      exec(`${compiler} --version`, { timeout: 3000 }, (err) => resolve(!err));
    });

    if (!hasCompiler) {
      return {
        stdout: '',
        stderr: `C/C++ compiler (${compiler}) is not installed on this system.`,
        executionTime: 0,
        memoryUsed: 0,
        status: 'Compilation Error',
        error: `Compiler ${compiler} not found.`,
      };
    }

    const compileArgs = ['-O2', sourcePath, '-o', binaryPath];
    if (!isCpp) compileArgs.push('-lm');

    const compileResult = await this.spawnProcess(compiler, compileArgs, '', tempDir, 5000);
    if (compileResult.status === 'Time Limit Exceeded') {
      return { ...compileResult, status: 'Compilation Error', error: 'Compilation timed out' };
    }
    if (compileResult.status === 'Runtime Error' || (compileResult.stderr && (compileResult.stderr.includes('error:') || compileResult.stderr.includes('fatal error:')))) {
      return {
        stdout: '',
        stderr: compileResult.stderr || compileResult.error || 'Compilation failed',
        executionTime: compileResult.executionTime,
        memoryUsed: 0,
        status: 'Compilation Error',
        error: compileResult.stderr || compileResult.error,
      };
    }

    return this.spawnProcess(binaryPath, [], input, tempDir);
  }

  private executeJavaScript(tempDir: string, code: string, input: string): Promise<ExecutionResult> {
    const scriptPath = path.join(tempDir, 'solution.js');
    const wrapped = `
const fs = require('fs');
let input = '';
try {
  input = fs.readFileSync(0, 'utf-8');
} catch (e) {}
${code}
`;
    fs.writeFileSync(scriptPath, wrapped, 'utf-8');
    const nodeExecutable = process.execPath || 'node';
    return this.spawnProcess(nodeExecutable, [scriptPath], input, tempDir);
  }

  private spawnProcess(
    command: string,
    args: string[],
    input: string,
    cwd: string,
    customTimeout?: number
  ): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      const timeout = customTimeout || this.timeoutMs;
      const startTime = Date.now();
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      let proc: any;
      try {
        proc = spawn(command, args, {
          cwd,
          env: { ...process.env, PATH: process.env.PATH },
          stdio: ['pipe', 'pipe', 'pipe'],
        });
      } catch (spawnErr: any) {
        return resolve({
          stdout: '',
          stderr: spawnErr.message,
          executionTime: 0,
          memoryUsed: 0,
          status: 'Runtime Error',
          error: spawnErr.message,
        });
      }

      const memoryUsed = 1024;

      const timer = setTimeout(() => {
        timedOut = true;
        if (process.platform === 'win32' && proc.pid) {
          exec(`taskkill /pid ${proc.pid} /T /F`, () => {});
        } else if (proc.kill) {
          proc.kill('SIGKILL');
        }
      }, timeout);

      if (proc.stdin) {
        try {
          if (input) {
            proc.stdin.write(input);
            if (!input.endsWith('\n')) proc.stdin.write('\n');
          }
          proc.stdin.end();
        } catch (e) {
          // ignore stream write errors if process closed immediately
        }
      }

      proc.stdout?.on('data', (chunk: Buffer) => {
        if (stdout.length < 50000) {
          stdout += chunk.toString();
        }
      });

      proc.stderr?.on('data', (chunk: Buffer) => {
        if (stderr.length < 20000) {
          stderr += chunk.toString();
        }
      });

      proc.on('error', (err: any) => {
        clearTimeout(timer);
        const executionTime = Date.now() - startTime;
        resolve({
          stdout,
          stderr: err.message,
          executionTime,
          memoryUsed: 0,
          status: 'Runtime Error',
          error: err.message,
        });
      });

      proc.on('close', (code: number) => {
        clearTimeout(timer);
        const executionTime = Date.now() - startTime;

        if (timedOut) {
          return resolve({
            stdout,
            stderr: `Time Limit Exceeded: Execution took longer than ${timeout}ms`,
            executionTime: timeout,
            memoryUsed,
            status: 'Time Limit Exceeded',
            error: 'Time Limit Exceeded',
          });
        }

        // Strict non-zero exit code checking:
        // Any non-zero exit code means an error occurred during execution
        if (code !== 0) {
          const errMsg = stderr || stdout || `Process exited with error code ${code}`;
          return resolve({
            stdout,
            stderr: errMsg,
            executionTime,
            memoryUsed,
            status: 'Runtime Error',
            error: errMsg.slice(0, 1000),
          });
        }

        return resolve({
          stdout,
          stderr,
          executionTime,
          memoryUsed,
          status: 'Accepted',
        });
      });
    });
  }

  /**
   * Fallback evaluator - does NOT fake outputs or hide errors.
   */
  evaluateInMemory(language: string, code: string, _input = ''): ExecutionResult {
    const trimmedCode = (code || '').trim();

    if (!trimmedCode) {
      return {
        status: 'Compilation Error',
        stdout: '',
        stderr: 'Error: Source code cannot be empty.',
        executionTime: 0,
        memoryUsed: 0,
        error: 'Error: Source code cannot be empty.',
      };
    }

    return {
      status: 'Compilation Error',
      stdout: '',
      stderr: `Execution runtime for "${language}" is not available on this server environment.`,
      executionTime: 0,
      memoryUsed: 0,
      error: `Compiler or interpreter for ${language} is not available.`,
    };
  }
}

export const codeExecutionService = new CodeExecutionService();

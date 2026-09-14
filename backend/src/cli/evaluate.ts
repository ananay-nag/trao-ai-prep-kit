import '../config.js';
import fs from 'fs';
import path from 'path';
import { generatePrepKit } from '../pipeline/orchestrator.js';
import { BatchInputCase, BatchInputSchema, BatchKitOutputItem, BatchOutput } from '../types/batch.js';


function resolveFilePath(filePath: string): string {
  if (path.isAbsolute(filePath)) return filePath;
  // Try resolving against INIT_CWD (where npm was invoked from)
  if (process.env.INIT_CWD) {
    const fromInit = path.resolve(process.env.INIT_CWD, filePath);
    if (fs.existsSync(fromInit)) return fromInit;
  }
  // Try resolving against current working directory
  const fromCwd = path.resolve(process.cwd(), filePath);
  if (fs.existsSync(fromCwd)) return fromCwd;

  // Try resolving against parent directory
  const fromParent = path.resolve(process.cwd(), '..', filePath);
  if (fs.existsSync(fromParent)) return fromParent;

  // Default to INIT_CWD or cwd
  return process.env.INIT_CWD ? path.resolve(process.env.INIT_CWD, filePath) : fromCwd;
}

function parseArgs(): { inputPath: string; outputPath: string } {
  const args = process.argv.slice(2);
  let inputArg = '';
  let outputArg = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i + 1]) {
      inputArg = args[i + 1];
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputArg = args[i + 1];
      i++;
    }
  }

  if (!inputArg || !outputArg) {
    console.error('❌ Usage: npm run evaluate -- --input <cases.json> --output <kits.json>');
    process.exit(1);
  }

  const inputPath = resolveFilePath(inputArg);
  const baseDir = process.env.INIT_CWD || process.cwd();
  const outputPath = path.isAbsolute(outputArg) ? outputArg : path.resolve(baseDir, outputArg);

  return { inputPath, outputPath };
}

async function runEvaluation() {
  const { inputPath, outputPath } = parseArgs();

  console.log(`🚀 Starting Batch Evaluation Pipeline...`);
  console.log(`📄 Reading test cases from: ${inputPath}`);
  console.log(`💾 Writing results to: ${outputPath}\n`);

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Input file not found: ${inputPath}`);
    process.exit(1);
  }

  let rawCases: any;
  try {
    const fileContent = fs.readFileSync(inputPath, 'utf-8');
    rawCases = JSON.parse(fileContent);
  } catch (err: any) {
    console.error(`❌ Failed to parse input JSON: ${err.message}`);
    process.exit(1);
  }

  const parsed = BatchInputSchema.safeParse(rawCases);
  if (!parsed.success) {
    console.error(`❌ Input cases schema validation failed:`, parsed.error.format());
    process.exit(1);
  }

  const cases: BatchInputCase[] = parsed.data;
  const results: BatchKitOutputItem[] = [];

  for (let i = 0; i < cases.length; i++) {
    const testCase = cases[i];
    console.log(`▶️ [Case ${i + 1}/${cases.length}] Processing ID: ${testCase.id} (Days: ${testCase.days}, Company: ${testCase.company_url})`);

    const startTime = Date.now();
    try {
      const kit = await generatePrepKit({
        jd: testCase.jd,
        companyUrl: testCase.company_url,
        days: testCase.days,
        onProgress: (status) => {
          process.stdout.write(`   [${status.step}] ${status.percent}% - ${status.details}\r`);
        }
      });

      console.log(`\n   ✅ Finished ${testCase.id} in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
      results.push({
        id: testCase.id,
        status: 'ok',
        kit,
        error: null
      });
    } catch (err: any) {
      console.error(`\n   ⚠️ Case ${testCase.id} failed: ${err.message}`);
      results.push({
        id: testCase.id,
        status: 'failed',
        kit: null,
        error: {
          code: 'PIPELINE_ERROR',
          message: err.message || 'An unexpected error occurred during generation'
        }
      });
    }

    if (i < cases.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  const outputData: BatchOutput = {
    version: '1.0',
    generated_at: new Date().toISOString(),
    kits: results
  };

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf-8');
  console.log(`\n✨ Batch evaluation complete! Successfully wrote ${results.length} kit(s) to ${outputPath}`);
}

runEvaluation().catch((err) => {
  console.error('Fatal CLI execution error:', err);
  process.exit(1);
});

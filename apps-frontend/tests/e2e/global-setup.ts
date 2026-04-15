import { execSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function globalSetup() {
  console.log('\n--- Global Setup: Seeding Database ---');
  try {
    // Run seed script in apps-backend
    const backendPath = path.resolve(__dirname, '../../../apps-backend');
    execSync('npm run seed:e2e', { 
        cwd: backendPath, 
        stdio: 'inherit' 
    });
    console.log('--- Global Setup: Seeding Complete ---\n');
  } catch (error) {
    console.error('--- Global Setup: Seeding Failed ---');
    console.error(error);
    process.exit(1);
  }
}

export default globalSetup;

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('=== Environment Variables Check ===');
console.log('PAYTAB_PROFILE_ID:', process.env.PAYTAB_PROFILE_ID);
console.log('PAYTAB_SERVER_KEY:', process.env.PAYTAB_SERVER_KEY ? '***' + process.env.PAYTAB_SERVER_KEY.slice(-4) : 'undefined');
console.log('PAYTAB_CLIENT_KEY:', process.env.PAYTAB_CLIENT_KEY ? '***' + process.env.PAYTAB_CLIENT_KEY.slice(-4) : 'undefined');
console.log('PAYTAB_BASE_URL:', process.env.PAYTAB_BASE_URL);
console.log('===================================');

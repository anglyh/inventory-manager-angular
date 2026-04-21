import { mkdirSync, writeFileSync } from 'node:fs';
import 'dotenv/config';

const targetPath = './src/environments/environment.ts';
const targetPathDev = './src/environments/environment.development.ts';

const apiUrl = process.env.API_URL;
if (!apiUrl) {
  throw new Error('API_URL is not set');
}

const envFileContent = `export const environment = {
  apiUrl: '${apiUrl}',
};
`;

mkdirSync('./src/environments', { recursive: true });
writeFileSync(targetPath, envFileContent);
writeFileSync(targetPathDev, envFileContent);

import { mkdirSync, writeFileSync } from "fs"
import 'dotenv/config'

const targetPath = './src/environments/environments.ts'
const targetPathDev = './src/environments/environments.development.ts'

if (!process.env['API_URL']) {
  throw new Error('API_URL is not set')
}

const envFileContent = `
  export const environment = {
    apiUrl: "${process.env['API_URL']}",
  };
`
mkdirSync('./src/environments', { recursive: true });

writeFileSync(targetPath, envFileContent);
writeFileSync(targetPathDev, envFileContent);
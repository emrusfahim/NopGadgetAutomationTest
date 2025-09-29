
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('Global setup: Creating minimal auth state');
  
  // If you already have a working storageState.json, just skip the setup
  const fs = require('fs');
  if (fs.existsSync('storageState.json')) {
    console.log('Storage state already exists, skipping login');
    return;
  }
  
  // Only run login if storage state doesn't exist
  const { UserLogin } = await import('./pages/user/UserLogin');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const userLogin = new UserLogin(page);

    const email = 'sakib75@gmail.com';
    const workbook = 0;
    const testDataPath = 'testData/testData_user.xlsx';
    const loginSuccess = await userLogin.login(testDataPath, email, workbook);
    if (!loginSuccess) {
      throw new Error('Login failed in global setup');
    }
  } finally {
    await browser.close();
  }
}

export default globalSetup;

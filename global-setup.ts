import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('Global setup: Creating minimal auth state');
  
  // Get configuration from environment variables only
  const email = process.env.LOGIN_EMAIL!;
  const storageStatePath = process.env.STORAGE_STATE_PATH!;
  
  console.log(`Using email: ${email}`);
  
  // If you already have a working storageState.json, just skip the setup
  const fs = require('fs');
  if (fs.existsSync(storageStatePath)) {
    console.log('Storage state already exists, skipping login');
    return;
  }
  
  // Only run login if storage state doesn't exist
  const { UserLogin } = await import('./pages/user/UserLogin');
  const browser = await chromium.launch({ 
    headless: process.env.HEADLESS === 'true' 
  });
  
  try {
    const page = await browser.newPage();
    const userLogin = new UserLogin(page);

    // Use the simplified login method (no parameters needed)
    await userLogin.gotoLoginPage();
    const loginSuccess = await userLogin.login();
    
    if (!loginSuccess) {
      throw new Error(`Login failed in global setup for email: ${email}`);
    }
    
    console.log(`Global setup completed successfully for: ${email}`);
  } catch (error) {
    console.error('Global setup error:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
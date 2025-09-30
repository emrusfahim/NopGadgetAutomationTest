import { Page } from '@playwright/test';

export class UserLogin {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    // Locators and URL
    private loginPageUrl = '/login';
    private emailInput = '//div[@class="customer-blocks"]//input[@id="Email"]';
    private passwordInput = '//div[@class="customer-blocks"]//input[@id="Password"]';
    private rememberMeCheckbox = '//label[@for="RememberMe"]';
    private loginButton = '//div[@class="customer-blocks"]//button[@type="submit"][normalize-space()="Log in"]';
    private userDropdown = "//li[@class='user-dropdown dropdown user-account is-loggedin']";
    private logoutText = 'text=Log out';

    // go to login page
    async gotoLoginPage() {
        await this.page.goto(this.loginPageUrl);
    }

    // Login using environment variables only
    async login(): Promise<boolean> {
        try {
            // Get credentials from environment variables
            const email = process.env.TEST_EMAIL!;
            const password = process.env.TEST_PASSWORD!;

            // Output the email and password to verify
            console.log("Email: ", email, "      ", "Password: ", password);

            await this.page.fill(this.emailInput, email);
            await this.page.fill(this.passwordInput, password);
            await this.page.check(this.rememberMeCheckbox);
            await this.page.click(this.loginButton);

            await this.page.hover(this.userDropdown);
            await this.page.waitForSelector(this.logoutText, { timeout: 5000 });
            console.log('Login successful, Chill!');

            // Save storage state using env variable or default
            const storageStatePath = process.env.STORAGE_STATE_PATH || 'storageState.json';
            await this.page.context().storageState({ path: storageStatePath });

            return true;
        } catch (error) {
            console.error('Login failed:', error);
            return false;
        }
    }
}
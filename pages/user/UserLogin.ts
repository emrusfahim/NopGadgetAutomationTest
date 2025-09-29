import { Page } from '@playwright/test';
import XLSX from 'xlsx';
import { loadXlsxData } from '../../utils/xlsxDataLoader';

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

    async login(testDataPath: string, email: string, worksheet: number): Promise<boolean> {
        try {
            // xlsx data loader
            const data = loadXlsxData(testDataPath, worksheet);
            // Find where Email is 'admin@yourStore.com' and get the corresponding Password
            const user = data.find((item) => item.Email === email);
            if (!user) {
                throw new Error(`User with email ${email} not found`);
            }
            // Output the email and password to verify
            console.log("Email: ", user.Email, "      ", "Password: ", user.Password);

            await this.page.fill(this.emailInput, email);
            await this.page.fill(this.passwordInput, user.Password);
            await this.page.check(this.rememberMeCheckbox);
            await this.page.click(this.loginButton);

            //await this.page.waitForSelector("//li[@class='user-dropdown dropdown user-account is-loggedin']");
            await this.page.hover(this.userDropdown);
            await this.page.waitForSelector(this.logoutText, { timeout: 5000 });
            console.log('Login successful, Chill!');

            // Save storage state for reuse in tests
            await this.page.context().storageState({ path: 'storageState.json' });

            return true;
        } catch (error) {
            console.error('Login failed:', error);
            return false;
        }
    }
}

// To use in a test: Create an instance of UserLogin with a Page object, call login() with email and password.
// The storage state will be saved to the specified path. In subsequent tests, load the state using:
// await page.context().addCookies(await fs.readFile('C:\\Users\\BS01643\\Documents\\NopGadgetAutomationTest\\testData\\storageState.json', 'utf8'));

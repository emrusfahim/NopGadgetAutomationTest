import { Page } from '@playwright/test';
import { loadXlsxData } from '../../utils/xlsxDataLoader.ts';

export class UserProfileManagement {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    // Locators and URL
    private customerInfoUrl = '/customer/info';
    private maleCheckbox = "//label[normalize-space()='Male']";
    private firstNameInput = '//input[@id="FirstName"]';
    private lastNameInput = '//input[@id="LastName"]';
    private emailInput = '//input[@id="Email"]';
    private companyInput = '//input[@id="Company"]';
    private signatureTextarea = '//textarea[@id="Signature"]';
    private saveInfoButton = '//button[@id="save-info-button"]';
    private successMessage = '//p[@class=\'content\']';
    private closeButton = '//span[@title="Close"]';

    async gotoCustomerInfo() {
        await this.page.goto(this.customerInfoUrl);
    }

    async updateCustomerInfo(testDataPath: string, email: string, worksheet: number) {
        const customerDataList = loadXlsxData(testDataPath, worksheet);
        // Find the customer data matching the provided email
        const customerData = customerDataList.find(data => data.Email === email);
        if (!customerData) {
            throw new Error(`No customer data found for email: ${email}`);
        }
        console.log("Customer Data: ", customerData);
        // click checkbox to select //label[normalize-space()='Male']
        await this.page.check(this.maleCheckbox);
        await this.page.fill(this.firstNameInput, customerData['First Name']);
        await this.page.fill(this.lastNameInput, customerData['Last Name']);
        await this.page.fill(this.emailInput, customerData.Email);
        await this.page.fill(this.companyInput, customerData['Company Name']);
        await this.page.fill(this.signatureTextarea, customerData.Signature);
        await this.page.click(this.saveInfoButton);

        // Wait for the success message pop-up to appear
        await this.page.waitForSelector(this.successMessage, { timeout: 5000 });
        // Optionally, verify the success message text
        const successMessage = await this.page.textContent(this.successMessage);
        console.log('Success Message:', successMessage);
        // Close the success message
        await this.page.click(this.closeButton);
    }
}

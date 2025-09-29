import { Page } from '@playwright/test';
import * as XLSX from 'xlsx';
import { loadXlsxData } from '../../utils/xlsxDataLoader';

export class AddressManagement {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    // Locators and URL
    private addressPageUrl = '/customer/addresses';
    private addNewAddressButton = 'text=Add new';
    private editButton = '//div[@class="address-list"]//div[1]//div[2]//div[1]//button[1]'; 
    private firstNameInput = 'input[name="Address.FirstName"]';
    private lastNameInput = 'input[name="Address.LastName"]';
    private emailInput = 'input[name="Address.Email"]';
    private companyInput = 'input[name="Address.Company"]';
    private countrySelect = 'select[name="Address.CountryId"]';
    private stateSelect = 'select[name="Address.StateProvinceId"]';
    private cityInput = 'input[name="Address.City"]';
    private address1Input = 'input[name="Address.Address1"]';
    private address2Input = 'input[name="Address.Address2"]';
    private zipCodeInput = 'input[name="Address.ZipPostalCode"]';
    private phoneNumberInput = 'input[name="Address.PhoneNumber"]';
    private faxNumberInput = 'input[name="Address.FaxNumber"]';
    private saveButton = '//button[normalize-space()="Save"]';
    private successMessageSelector = '//p[@class="content"]';
    private closeButton = '//span[@title="Close"]';
    private deleteButton = '(//button[@type="button"][normalize-space()="Delete"])[1]';

    async gotoAddressPage() {
        await this.page.goto(this.addressPageUrl);
    }

    async editAddressButtonClick() {
        // Click the edit button for the first address in the list
        await this.page.click(this.editButton);
    }

    async addAddressButtonClick() {
        // Click on "Add new" button to open the address form
        await this.page.click(this.addNewAddressButton);
    }

    async addressFormFill(testDataPath: string, worksheet: number, rowIndex: number) {
        // Load data from Excel - this returns a flat array of objects
        const dataArray = loadXlsxData(testDataPath, worksheet);

        // Check if data exists at the specified index
        if (!dataArray || dataArray.length <= rowIndex) {
            throw new Error(`No data found at row index ${rowIndex} in worksheet ${worksheet}`);
        }

        // Get the data at the specified row index
        const data = dataArray[rowIndex] as {
            'First Name': string;
            'Last Name': string;
            'Email': string;
            'Company Name'?: string;
            'Country': string;
            'State'?: string;
            'City': string;
            'Address 1': string;
            'Address 2'?: string;
            'Zip Code': string;
            'Phone Number': string;
            'Fax Number'?: string;
        };
        console.log("Address Data: ", data);


        await this.page.fill(this.firstNameInput, data['First Name']);
        await this.page.fill(this.lastNameInput, data['Last Name']);
        await this.page.fill(this.emailInput, data['Email']);
        if (data['Company Name']) {
            await this.page.fill(this.companyInput, data['Company Name']);
        }

        // Country is pre-selected as United States of America in the form click and select Country from dropdown
        await this.page.selectOption(this.countrySelect, { label: data['Country'] });
        await this.page.waitForTimeout(2000); // wait for 2 seconds to load states/provinces based on country selection
        // State / province: Select state from dropdown
        await this.page.selectOption(this.stateSelect, { label: data['State'] });

        await this.page.fill(this.cityInput, data['City']);
        await this.page.fill(this.address1Input, data['Address 1']);
        if (data['Address 2']) {
            await this.page.fill(this.address2Input, data['Address 2']);
        }
        await this.page.fill(this.zipCodeInput, data['Zip Code']);
        await this.page.fill(this.phoneNumberInput, data['Phone Number']);
        if (data['Fax Number']) {
            await this.page.fill(this.faxNumberInput, data['Fax Number']);
        }

        // Save button click to submit the form
        await this.page.click(this.saveButton);

        // Wait for the success message pop-up to appear
        await this.page.waitForSelector(this.successMessageSelector, { timeout: 5000 });
        // Optionally, verify the success message text
        const successMessage = await this.page.textContent(this.successMessageSelector);
        console.log('Success Message:', successMessage);
        // Close the success message
        await this.page.click(this.closeButton);

        // Verify the added address by checking the presence of the new address in the address list
        // This could involve searching for the address in the UI or checking a data structure
        // For example:
        const isAddressAdded = await this.page.isVisible(`text=${data['First Name']} ${data['Last Name']}`);
        return isAddressAdded;
    }


    async deleteAddress() {
        // Navigate to the address management page
        await this.page.goto(this.addressPageUrl);

        // Wait for page to be fully loaded
        await this.page.waitForLoadState('networkidle');

        // Set up dialog event listener before clicking
        this.page.once('dialog', async (dialog) => {
            console.log(`Dialog message: ${dialog.message()}`);
            console.log(`Dialog type: ${dialog.type()}`);
            
            // Accept the dialog (click OK)
            await dialog.accept();
            console.log('Dialog accepted');
        });

        // Click delete button, assuming we want to delete the first address in the list [1]
        await this.page.click(this.deleteButton);

        // Wait for the page to update after deletion
        await this.page.waitForTimeout(3000);
        console.log('Address deleted successfully');
    }
}
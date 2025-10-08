import { Page } from 'playwright';
import { loadXlsxData } from '../../utils/xlsxDataLoader';
import * as path from 'path';

export class ProductSearch {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    // Locators and URL
    private searchURL = '/search';
    private searchInput = '//input[@id="small-searchterms"]';
    private searchkeywordInput = '//input[@id="q"]';
    private searchButton = "//button[normalize-space()='Search']";
    private searchPageButton = "//button[@class='button-1 search-button']";
    // private addToCartButton = "//button[@class='button-1 add-to-cart-button']";
    private addToCartButton = "//button[contains(@id, 'add-to-cart-button')]";
    // private addToCartButton = "//button[starts-with(@id, 'add-to-cart-button')]";
    // private addToCartButton = "//button[normalize-space(text())='Add to cart']";
    // private addToCartButton = "//div[@class='add-to-cart']/child::div[@class='add-to-cart-panel']/child::button";
    // private addToCartButton = '.add-to-cart-panel .add-to-cart-button';
    // private addToCartButton = "//button[contains(@id,'add-to-cart-button')]";
    // private addToCartButton = "//div[contains(@class,'add-to-cart-panel')]//button[contains(@class,'add-to-cart-button')]";
    private productPageManufacturer = "//span[normalize-space()='Manufacturer:']/following-sibling::span[1]";
    private productPageSKU = "//span[normalize-space()='SKU:']/following-sibling::span[1]";
    private serialFileInput = "//span[@class='filepond--label-action']";
    private successMessage = '//div[@class="bar-notification success"]';
    // private productPageColor = "//span[normalize-space()='Color:']/following-sibling::span[1]";

    /** Navigate to search page */
    async gotoSearchPage() {
        await this.page.goto(this.searchURL);
    }

    /** Helper: Select dropdown by its label dynamically */
    private async selectDropdownByLabel(labelText: string, optionText: string) {
        const dropdown = this.page.locator(`dt:has-text("${labelText}") + dd select`);
        await dropdown.waitFor({ state: 'visible' });

        const options = await dropdown.locator('option').allTextContents();
        console.log(`Available options for ${labelText}:`, options);

        // Exact match first
        const exact = options.find(opt => opt.trim().toLowerCase() === optionText.trim().toLowerCase());
        if (exact) {
            await dropdown.selectOption({ label: exact });
            return;
        }

        // Partial match fallback
        const partial = options.find(opt => opt.toLowerCase().includes(optionText.trim().toLowerCase()));
        if (partial) {
            await dropdown.selectOption({ label: partial });
            return;
        }

        throw new Error(`Option "${optionText}" not found for ${labelText}. Available: ${options.join(', ')}`);
    }


    /** Main function to search and add product to cart */
    async searchProduct(testDataPath: string, worksheet: string): Promise<boolean> {
        const data = loadXlsxData(testDataPath, worksheet);

        if (!data || data.length === 0) {
            console.log("No data found in the provided Excel sheet.");
            return false;
        }
        console.log(`Loaded ${data.length} products from ${testDataPath}, Sheet: ${worksheet}`);
        await this.page.waitForTimeout(2000);

        // console.log(`Selected color: ${data[0]['Color']}`);

        for (const product of data) {

            await this.page.goto(this.searchURL);
            // await this.page.waitForLoadState('networkidle');
            // await this.page.waitForTimeout(1000);

            // Extract product details from the current row
            const productName = product['Product Name'];
            const productManufacturer = product['Manufacturer'];
            const productSKU = product['SKU'];
            const productProcessor = product['Processor'];
            const productRAM = product['RAM'];
            const productHDD = product['HDD'];
            const productOS = product['OS'];
            const productSoftware = product['Software'];
            const productFilePath = product['Serial File Path'];
            const productColor = product['Color'];
            const productQty = product['Qty'];

            // Search product
            await this.page.fill(this.searchInput, productName);
            await this.page.click(this.searchButton);
            // Wait for search results to load
            await this.page.waitForSelector('.product-item', { timeout: 5000 });

            // Check if any products found
            const productItems = this.page.locator('.product-item');
            if (await productItems.count() === 0) {
                console.log(`No products found for: ${productName}`);
                continue; // Skip to next product
            }

            console.log(`Clicking on product: ${productName}`);
            await this.page.locator('.product-item').first().click();

            // Validate Manufacturer
            if (productManufacturer) {
                const manufacturerText = await this.page.locator(this.productPageManufacturer).textContent();
                console.log(`Manufacturer matches: ${manufacturerText?.trim()}`);
            }
            // Validate SKU
            if (productSKU) {
                const skuText = await this.page.locator(this.productPageSKU).textContent();
                console.log(`SKU matches: ${skuText?.trim()}`);
            }

            // Select dropdowns dynamically
            if (productProcessor) await this.selectDropdownByLabel("Processor", productProcessor);
            if (productRAM) await this.selectDropdownByLabel("RAM", productRAM);
            if (productHDD) await this.selectDropdownByLabel("HDD", productHDD);
            if (productOS) await this.selectDropdownByLabel("OS", productOS);
            if (productSoftware) await this.selectDropdownByLabel("Software", productSoftware);

            // File upload
            if (productFilePath) {
                console.log(`Serial file path: ${productFilePath}`);
                if (!require('fs').existsSync(productFilePath)) {
                    throw new Error(`File not found: ${productFilePath}`);
                }
                await this.page.setInputFiles(this.serialFileInput, productFilePath);
                // Wait for upload to finish (FilePond success indicator with exact text)
                await this.page.waitForSelector('span.filepond--file-status-main:has-text("Upload complete")', { timeout: 10000 });
            }

            // Select color
            if (productColor) {
                console.log(`Selected color: ${productColor}`);
                const colorLocator = this.page.locator(`.color-squares .attribute-square-container[title="${productColor}"]`).first();
                await colorLocator.waitFor({ state: 'visible', timeout: 5000 });
                await colorLocator.click();
            }

            // Input quantity
            if (productQty) {
                const qtyInput = this.page.locator('input[id^="product_enteredQuantity"]');
                await qtyInput.waitFor({ state: 'visible', timeout: 5000 });
                await this.page.fill('input[id^="product_enteredQuantity"]', productQty.toString());
            }

            // Add to cart
            const addToCartBtn = this.page.locator(this.addToCartButton);
            await addToCartBtn.scrollIntoViewIfNeeded();  
            await addToCartBtn.waitFor({ state: 'visible', timeout: 5000 });
            // const count = await addToCartBtn.count();
            // console.log(`Found ${count} Add to Cart buttons`);
            await addToCartBtn.click();
            // await this.page.click(this.addToCartButton);


            // Wait for cart update or notification
            await this.page.waitForTimeout(1000); // Keep minimal, but consider replacing with better wait

            // // Check for notification error
            // const notification = this.page.locator('div.bar-notification');
            // if (await notification.isVisible({ timeout: 5000 })) {
            //     const notificationText = await notification.textContent();
            //     console.log(`Notification after adding to cart: ${notificationText?.trim()}`);
            //     if (notificationText?.includes('error') || notificationText?.includes('failed')) {
            //         throw new Error(`Add to cart failed for ${productName}: ${notificationText}`);
            //     }
            // }

            // Check for success message
            const successMessageTemp = this.page.locator(this.successMessage);
            if (await successMessageTemp.isVisible({ timeout: 5000 })) {
                const successText = await successMessageTemp.textContent();
                console.log(`Success after adding to cart: ${successText?.trim()}`);
            } else {
                throw new Error(`No success message for ${productName}`);
            }

            // Add to cart confirmation message with detailed info
            const confirmationMessage = this.page.locator('//div[@id="add-to-cart-confirmation"]');
            if (await confirmationMessage.isVisible({ timeout: 5000 })) {
                const confirmationText = await confirmationMessage.textContent();
                // console.log(`Add to cart confirmation: ${confirmationText?.trim()}`);
                // Click on //a[normalize-space()='Continue shopping']
                await this.page.click('//a[normalize-space()="Continue shopping"]');
                // await this.page.waitForTimeout(1000); // wait for navigation
            }

            console.log(`Successfully added ${productName} to cart`);

            // Timeout between products
            await this.page.waitForTimeout(2000);
        }

        return true;
    }
}


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
    async selectDropdownByLabel(labelText: string, optionText: string) {
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

    /** Load product data from Excel */
    async loadProductData(testDataPath: string, worksheet: string) {
        const data = loadXlsxData(testDataPath, worksheet);
        if (!data || data.length === 0) {
            console.log("No data found in the provided Excel sheet.");
            return [];
        }
        console.log(`Loaded ${data.length} products from ${testDataPath}, Sheet: ${worksheet}`);
        return data;
    }

    /** Search for a product by name */
    async searchForProduct(productName: string) {
        await this.page.fill(this.searchInput, productName);
        await this.page.click(this.searchButton);
        await this.page.waitForSelector('.product-item', { timeout: 5000 });
        const productItems = this.page.locator('.product-item');
        if (await productItems.count() === 0) {
            throw new Error(`No products found for: ${productName}`);
        }
    }

    /** Select the first product from search results */
    async selectProductFromResults(productName: string) {
        console.log(`Clicking on product: ${productName}`);
        await this.page.locator('.product-item').first().click();
    }

    /** Validate product manufacturer and SKU */
    async validateProductDetails(productManufacturer?: string, productSKU?: string) {
        if (productManufacturer) {
            const manufacturerText = await this.page.locator(this.productPageManufacturer).textContent();
            console.log(`Manufacturer matches: ${manufacturerText?.trim()}`);
        }
        if (productSKU) {
            const skuText = await this.page.locator(this.productPageSKU).textContent();
            console.log(`SKU matches: ${skuText?.trim()}`);
        }
    }

    /** Configure product options via dropdowns */
    async configureProductOptions(productProcessor?: string, productRAM?: string, productHDD?: string, productOS?: string, productSoftware?: string) {
        if (productProcessor) await this.selectDropdownByLabel("Processor", productProcessor);
        if (productRAM) await this.selectDropdownByLabel("RAM", productRAM);
        if (productHDD) await this.selectDropdownByLabel("HDD", productHDD);
        if (productOS) await this.selectDropdownByLabel("OS", productOS);
        if (productSoftware) await this.selectDropdownByLabel("Software", productSoftware);
    }

    /** Upload serial file */
    async uploadSerialFile(productFilePath?: string) {
        if (productFilePath) {
            // console.log(`Serial file path: ${productFilePath}`);
            if (!require('fs').existsSync(productFilePath)) {
                throw new Error(`File not found: ${productFilePath}`);
            }
            await this.page.setInputFiles(this.serialFileInput, productFilePath);
            await this.page.waitForSelector('span.filepond--file-status-main:has-text("Upload complete")', { timeout: 10000 });
        }
    }

    /** Select product color */
    async selectColor(productColor?: string) {
        if (productColor) {
            console.log(`Selected color: ${productColor}`);
            const colorLocator = this.page.locator(`.color-squares .attribute-square-container[title="${productColor}"]`).first();
            await colorLocator.waitFor({ state: 'visible', timeout: 5000 });
            await colorLocator.click();
        }
    }

    /** Set product quantity */
    async setQuantity(productQty?: number) {
        if (productQty) {
            const qtyInput = this.page.locator('input[id^="product_enteredQuantity"]');
            await qtyInput.waitFor({ state: 'visible', timeout: 5000 });
            await this.page.fill('input[id^="product_enteredQuantity"]', productQty.toString());
        }
    }

    /** Add product to cart */
    async addToCart() {
        const addToCartBtn = this.page.locator(this.addToCartButton);
        //await addToCartBtn.scrollIntoViewIfNeeded();
        //await addToCartBtn.waitFor({ state: 'visible', timeout: 5000 });
        await addToCartBtn.click();
    }

    /** Verify add to cart success */
    async verifyAddToCartSuccess(productName: string) {
        //await this.page.waitForTimeout(10000);
        const successMessageTemp = this.page.locator(this.successMessage);
        //await successMessageTemp.waitFor({ state: 'visible', timeout: 15000 });
        const successText = await successMessageTemp.textContent();
        console.log(`Success after adding to cart: ${successText?.trim()}`);
        // const confirmationMessage = this.page.locator('//div[@id="add-to-cart-confirmation"]');
        // await confirmationMessage.waitFor({ state: 'visible', timeout: 5000 });
        await this.page.click('//a[normalize-space()="Continue shopping"]');
        console.log(`Successfully added ${productName} to cart`);
    }
    // Removed processSingleProduct, processProducts, and searchProduct methods to allow calling individual functions one by one from tests.
}
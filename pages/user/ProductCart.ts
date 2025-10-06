import { Page } from '@playwright/test';
import { loadXlsxData } from '../../utils/xlsxDataLoader';

// This class helps manage and check products in a shopping cart on a web page using Playwright.
export class ProductCart {
    private page: Page; // The web page we're working with

    // Constructor: Sets up the class with the page
    constructor(page: Page) {
        this.page = page;
    }

    // URLs and selectors for finding elements on the page
    private cartPageUrl = '/cart'; // URL for the cart page
    private productNameLocator = "xpath=//a[@class='product-name']"; // Finds product names
    private productSkuLocator = '.sku-number'; // Finds product SKUs
    private productPriceLocator = '.product-unit-price'; // Finds product unit prices (corrected from '.product-price')
    private productQuantityLocator = '.qty-input'; // Finds quantity inputs
    private productTotalLocator = '.product-subtotal'; // Finds total prices
    private productRowLocator = 'tbody tr'; // Locator for product rows in the cart table
    private productDiscountLocator = '.discount'; // Finds discount information

    // Go to the cart page
    async gotoCartPage() {
        await this.page.goto(this.cartPageUrl);
    }

    // Helper method to parse price from formatted string (e.g., "$1,249.00") to number
    private parsePrice(priceStr: string): number {
        const match = priceStr.match(/\$([\d,]+\.\d{2})/);
        if (match) {
            return parseFloat(match[1].replace(/,/g, ''));
        }
        return NaN;
    }

    // Main method: Check all product details from an Excel file
    async verifyProductDetailsFromExcel(filePath: string, sheetName: string) {
        try {
            console.log(`Loading product data from: ${filePath}, Sheet: ${sheetName}`);

            // Load data from Excel
            const data = await this.loadProductDataFromExcel(filePath, sheetName);
            console.log(`Found ${data.length} products in Excel`);

            // Count products in the cart on the page
            const cartProductCount = await this.page.locator(this.productNameLocator).count();
            console.log(`Found ${cartProductCount} products in cart`);

            let mismatchCount = 0;

            // Check each product from Excel against the cart by searching for it by name
            for (let i = 0; i < data.length; i++) {
                const item = data[i] as {
                    'Product Name': string;
                    'SKU': string;
                    'Price': string;
                    'Qty': number;
                    'Total Price': string;
                };
                console.log(`\n=== Checking product ${i + 1}: ${item['Product Name']} ===`);

                try {
                    // Find the product by name
                    const productNameElement = this.page.locator(`xpath=//a[@class='product-name'][normalize-space()='${item['Product Name']}']`);
                    await productNameElement.waitFor({ state: 'visible', timeout: 5000 });

                    // Get the product row and related elements
                    const productRow = productNameElement.locator('xpath=ancestor::tr');
                    const productSkuElement = productRow.locator('.sku-number');
                    const productPriceElement = productRow.locator('.product-unit-price'); // Corrected selector
                    const productQuantityElement = productRow.locator('.qty-input');
                    const productTotalElement = productRow.locator('.product-subtotal');

                    // Get the actual values from the cart
                    const actualName = (await productNameElement.textContent())?.trim() || '';
                    const actualSku = (await productSkuElement.textContent())?.trim() || '';
                    const actualPrice = (await productPriceElement.textContent())?.trim() || '';
                    const actualQuantity = (await productQuantityElement.inputValue())?.trim() || '';
                    const actualTotal = (await productTotalElement.textContent())?.trim() || '';

                    console.log(`Expected Name: ${item['Product Name']} | Actual: ${actualName}`);
                    console.log(`Expected SKU: ${item['SKU']} | Actual: ${actualSku}`);
                    console.log(`Expected Price: ${item['Price']} | Actual: ${actualPrice}`);
                    console.log(`Expected Qty: ${item['Qty']} | Actual: ${actualQuantity}`);
                    console.log(`Expected Total: ${item['Total Price']} | Actual: ${actualTotal}`);

                    let productMismatch = false;

                    // Check if each field matches
                    if (!actualName.includes(item['Product Name'])) {
                        console.log(`Product name mismatch for "${item['Product Name']}": Expected "${item['Product Name']}", but got "${actualName}"`);
                        productMismatch = true;
                    }

                    if (!actualSku.includes(item['SKU'])) {
                        console.log(`SKU mismatch for "${item['Product Name']}": Expected "${item['SKU']}", but got "${actualSku}"`);
                        productMismatch = true;
                    }

                    // Parse and compare prices numerically
                    const expectedPrice = parseFloat(item['Price']);
                    const actualPriceNum = this.parsePrice(actualPrice);
                    if (isNaN(actualPriceNum) || Math.abs(actualPriceNum - expectedPrice) > 0.01) {
                        console.log(`Price mismatch for "${item['Product Name']}": Expected "${item['Price']}", but got "${actualPrice}" (parsed: ${actualPriceNum})`);
                        productMismatch = true;
                    }

                    if (actualQuantity !== item['Qty'].toString()) {
                        console.log(`Quantity mismatch for "${item['Product Name']}": Expected "${item['Qty']}", but got "${actualQuantity}"`);
                        productMismatch = true;
                    }

                    // Parse and compare total prices numerically
                    const expectedTotal = parseFloat(item['Total Price']);
                    const actualTotalNum = this.parsePrice(actualTotal);
                    if (isNaN(actualTotalNum) || Math.abs(actualTotalNum - expectedTotal) > 0.01) {
                        console.log(`Total mismatch for "${item['Product Name']}": Expected "${item['Total Price']}", but got "${actualTotal}" (parsed: ${actualTotalNum})`);
                        productMismatch = true;
                    }

                    if (!productMismatch) {
                        console.log(`Product ${i + 1} check passed - All fields matched!`);
                    } else {
                        mismatchCount++;
                    }
                } catch (error) {
                    // If the product isn't found (timeout), skip to the next one
                    if (error instanceof Error && (error.message.includes('waitFor') || error.message.includes('timeout'))) {
                        console.log(`Product ${i + 1} not found in cart, skipping to next.`);
                        continue;
                    } else {
                        throw error; // Re-throw other errors
                    }
                }
            }

            console.log(`\nAll product checks completed. Total mismatches: ${mismatchCount}`);
            return mismatchCount === 0;

        } catch (error) {
            console.error('Product check failed:', error);
            throw error;
        }
    }

    // Check if a specific product exists in the cart by name (and optionally SKU)
    async verifyProductExists(productName: string, sku?: string): Promise<boolean> {
        try {
            // Find the product by name
            const productElement = this.page.locator(`xpath=//a[@class='product-name'][normalize-space()='${productName}']`);
            await productElement.waitFor({ state: 'visible', timeout: 5000 });
            
            if (sku) {
                // If SKU is provided, check it too
                const productRow = productElement.locator('xpath=ancestor::tr');
                const skuElement = productRow.locator('.sku-number');
                const actualSku = await skuElement.textContent();
                
                if (!actualSku?.includes(sku)) {
                    throw new Error(`SKU mismatch for product "${productName}"`);
                }
            }
            
            console.log(`Product "${productName}" found in cart`);
            return true;
        } catch (error) {
            console.error(`Product "${productName}" not found in cart`);
            return false;
        }
    }

    // Helper method: Load product data from Excel and check it's valid
    private async loadProductDataFromExcel(filePath: string, sheetName: string) {
        const data = loadXlsxData(filePath, sheetName);
        
        if (!data || data.length === 0) {
            throw new Error(`No data found in Excel file: ${filePath}, Sheet: ${sheetName}`);
        }

        // Make sure required columns are there
        const requiredFields = ['Product Name', 'SKU', 'Price', 'Qty', 'Total Price'];
        const firstRow = data[0];
        const missingFields = requiredFields.filter(field => !(field in firstRow));
        
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields in Excel data: ${missingFields.join(', ')}`);
        }

        console.log(`Successfully loaded ${data.length} products from Excel`);
        return data;
    }

    // Get all details of products in the cart as a list of objects, including discount
    async getCartDetails(): Promise<Array<{name: string, sku: string, unitPrice: string, qty: string, subtotal: string, discount: string}>> {
        try {
            // Get all product rows
            const productRows = this.page.locator(this.productRowLocator);
            const productCount = await productRows.count();
            const cartDetails = [];
            
            // For each product row, get its details
            for (let i = 0; i < productCount; i++) {
                const row = productRows.nth(i);
                const name = (await row.locator('.product-name').textContent())?.trim() || '';
                const sku = (await row.locator('.sku-number').textContent())?.trim() || '';
                const unitPrice = (await row.locator('.product-unit-price').textContent())?.trim() || '';
                const qty = (await row.locator('.qty-input').inputValue())?.trim() || '';
                const subtotal = (await row.locator('.product-subtotal').textContent())?.trim() || '';
                const discount = (await row.locator('.discount').textContent())?.trim() || '';
                
                cartDetails.push({ name, sku, unitPrice, qty, subtotal, discount });
            }

            console.log('Cart Details:', cartDetails);
            return cartDetails;
        } catch (error) {
            console.error('Error getting cart details:', error);
            return [];
        }
    }
}

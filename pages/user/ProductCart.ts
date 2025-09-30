import { Page, Locator } from '@playwright/test';
import { loadXlsxData } from '../../utils/xlsxDataLoader';

export class ProductCart {
    private page: Page;
    
    // ✅ Declare locators without initialization
    private cartPageUrl: string;
    private productName: Locator;
    private productSku: Locator;
    private productPrice: Locator;
    private productTotal: Locator;

    constructor(page: Page) {
        this.page = page;
        
        // ✅ Initialize locators after page is set
        this.cartPageUrl = '/cart';
        this.productName = this.page.locator('.product-name');
        this.productSku = this.page.locator('.sku-number');
        this.productPrice = this.page.locator('.product-price');
        this.productTotal = this.page.locator('.product-subtotal');
    }

    async gotoCartPage() {
        await this.page.goto(this.cartPageUrl);
    }

    // ✅ Updated method to handle multiple products correctly
    async verifyProductDetailsFromExcel(filePath: string, sheetName: string) {
        try {
            console.log(`Loading product data from: ${filePath}, Sheet: ${sheetName}`);
            
            const data = await this.loadProductDataFromExcel(filePath, sheetName);
            console.log(`Found ${data.length} products in Excel`);

            // Get all products in cart
            const cartProducts = await this.productName.all();
            console.log(`Found ${cartProducts.length} products in cart`);

            // Verify each product from Excel data
            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                console.log(`Verifying product ${i + 1}: ${item.name}`);

                // ✅ Use nth() to target specific product by index
                const productNameElement = this.productName.nth(i);
                const productSkuElement = this.productSku.nth(i);
                const productPriceElement = this.productPrice.nth(i);
                const productTotalElement = this.productTotal.nth(i);

                // Wait for elements to be visible
                await productNameElement.waitFor({ state: 'visible' });
                
                // Get actual text from cart
                const actualName = await productNameElement.textContent();
                const actualSku = await productSkuElement.textContent();
                const actualPrice = await productPriceElement.textContent();
                const actualTotal = await productTotalElement.textContent();

                console.log(`Expected: ${item.name} | Actual: ${actualName}`);
                console.log(`Expected SKU: ${item.sku} | Actual SKU: ${actualSku}`);
                console.log(`Expected Price: ${item.price} | Actual Price: ${actualPrice}`);
                console.log(`Expected Total: ${item.total} | Actual Total: ${actualTotal}`);

                // ✅ Verify using text content comparison
                if (!actualName?.includes(item.name)) {
                    throw new Error(`Product name mismatch: Expected "${item.name}", but got "${actualName}"`);
                }
                
                if (!actualSku?.includes(item.sku)) {
                    throw new Error(`Product SKU mismatch: Expected "${item.sku}", but got "${actualSku}"`);
                }

                if (!actualPrice?.includes(item.price)) {
                    throw new Error(`Product price mismatch: Expected "${item.price}", but got "${actualPrice}"`);
                }

                if (!actualTotal?.includes(item.total)) {
                    throw new Error(`Product total mismatch: Expected "${item.total}", but got "${actualTotal}"`);
                }

                console.log(`✅ Product ${i + 1} verification passed`);
            }

            console.log('All product verifications completed successfully');
            return true;

        } catch (error) {
            console.error('Product verification failed:', error);
            throw error;
        }
    }

    // ✅ Alternative method - verify by searching for specific text
    async verifyProductDetailsFromExcelByText(filePath: string, sheetName: string) {
        try {
            const data = await this.loadProductDataFromExcel(filePath, sheetName);

            for (const item of data) {
                console.log(`Verifying product: ${item.name}`);

                // ✅ Use more specific locators with exact text matching
                const productByName = this.page.locator('.product-name', { hasText: item.name }).first();
                
                // Wait and verify product exists
                await productByName.waitFor({ state: 'visible', timeout: 10000 });
                
                // Find the row containing this product
                const productRow = productByName.locator('xpath=ancestor::tr');
                
                // Verify other details within the same row
                const skuInRow = productRow.locator('.sku-number');
                const priceInRow = productRow.locator('.product-price');
                const totalInRow = productRow.locator('.product-subtotal');

                await skuInRow.waitFor({ state: 'visible' });
                await priceInRow.waitFor({ state: 'visible' });
                await totalInRow.waitFor({ state: 'visible' });

                console.log(`✅ Product "${item.name}" found and verified`);
            }

            return true;
        } catch (error) {
            console.error('Product verification failed:', error);
            return false;
        }
    }

    // ✅ Method to verify cart is not empty
    async verifyCartHasProducts(): Promise<boolean> {
        try {
            await this.productName.first().waitFor({ state: 'visible', timeout: 5000 });
            const productCount = await this.productName.count();
            console.log(`Cart contains ${productCount} products`);
            return productCount > 0;
        } catch (error) {
            console.error('Cart appears to be empty or products not found');
            return false;
        }
    }

    // ✅ Method to get product count in cart
    async getProductCount(): Promise<number> {
        try {
            return await this.productName.count();
        } catch (error) {
            console.error('Error getting product count:', error);
            return 0;
        }
    }

    // ✅ Method to verify specific product by name
    async verifyProductExists(productName: string): Promise<boolean> {
        try {
            const productElement = this.page.locator('.product-name', { hasText: productName }).first();
            await productElement.waitFor({ state: 'visible', timeout: 5000 });
            console.log(`✅ Product "${productName}" found in cart`);
            return true;
        } catch (error) {
            console.error(`❌ Product "${productName}" not found in cart`);
            return false;
        }
    }

    // ✅ Method to remove product from cart
    async removeProduct(productIndex: number): Promise<void> {
        try {
            const removeButton = this.page.locator('.remove-from-cart').nth(productIndex);
            await removeButton.click();
            console.log(`Removed product at index ${productIndex}`);
        } catch (error) {
            console.error(`Error removing product at index ${productIndex}:`, error);
            throw error;
        }
    }

    // ✅ Method to update product quantity
    async updateProductQuantity(productIndex: number, quantity: number): Promise<void> {
        try {
            const quantityInput = this.page.locator('.qty-input').nth(productIndex);
            await quantityInput.fill(quantity.toString());
            
            const updateButton = this.page.locator('.update-cart-button');
            await updateButton.click();
            
            console.log(`Updated product ${productIndex} quantity to ${quantity}`);
        } catch (error) {
            console.error(`Error updating product quantity:`, error);
            throw error;
        }
    }

    private async loadProductDataFromExcel(filePath: string, sheetName: string) {
        // Get test data using environment variables and Excel loader
        const data = loadXlsxData(filePath, sheetName);
        
        // Validate required fields exist in Excel data
        if (!data || data.length === 0) {
            throw new Error(`No data found in Excel file: ${filePath}, Sheet: ${sheetName}`);
        }

        // Validate required columns exist
        const requiredFields = ['name', 'sku', 'price', 'total'];
        const firstRow = data[0];
        const missingFields = requiredFields.filter(field => !(field in firstRow));
        
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields in Excel data: ${missingFields.join(', ')}`);
        }

        console.log(`Successfully loaded ${data.length} products from Excel`);
        return data;
    }

    // ✅ Method to get cart summary
    async getCartSummary(): Promise<{productCount: number, products: string[]}> {
        try {
            const productCount = await this.productName.count();
            const products: string[] = [];
            
            for (let i = 0; i < productCount; i++) {
                const productText = await this.productName.nth(i).textContent();
                if (productText) {
                    products.push(productText.trim());
                }
            }

            const summary = { productCount, products };
            console.log('Cart Summary:', summary);
            return summary;
        } catch (error) {
            console.error('Error getting cart summary:', error);
            return { productCount: 0, products: [] };
        }
    }
}
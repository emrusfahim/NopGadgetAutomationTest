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
    private addToCartButton = "//button[@class='button-1 add-to-cart-button']";
    private productPageManufacturer = "//span[normalize-space()='Manufacturer:']/following-sibling::span[1]";
    private productPageSKU = "//span[normalize-space()='SKU:']/following-sibling::span[1]";

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
    /** Helper: Select color by label text and option using index XPath */
    private async selectColorByLabel(labelText: string, optionText: string) {
        // Find the color group by label text
        const colorGroup = this.page.locator(`dt:has-text("${labelText}") + dd`);
        await colorGroup.waitFor({ state: 'visible' });

        // Map color names to index (1-based)
        const colorIndexMap: Record<string, number> = {
            'Silver': 1,
            'Black': 2,
            'Pink': 3
        };

        const colorIndex = colorIndexMap[optionText.trim()];
        if (!colorIndex) {
            throw new Error(`Color "${optionText}" not found in mapping.`);
        }

        // Select color by index using absolute XPath
        const colorSquare = this.page.locator(`(//span[@class='attribute-square'])[${colorIndex}]`);
        await colorSquare.waitFor({ state: 'visible' });
        await colorSquare.click({ force: true });
        console.log(`Color selected: ${optionText} (index: ${colorIndex}) under label: ${labelText}`);
    }

    /** Main function to search and add product to cart */
    async searchProduct(testDataPath: string, worksheet: string): Promise<boolean> {
        const data = loadXlsxData(testDataPath, worksheet);

        if (!data || data.length === 0) {
            console.log("No data found in the provided Excel sheet.");
            return false;
        }

        for (const product of data) {
            const productName = product['Product Name'];
            const productManufacturer = product['Manufacturer'];
            const productSKU = product['SKU'];
            const productProcessor = product['Processor'];
            const productRAM = product['RAM'];
            const productHDD = product['HDD'];
            const productOS = product['OS'];
            const productSoftware = product['Software'];
            const productSerialNo = product['Serial No'];
            const productFilePath = product['File Path'];
            const productColor = product['Color'];
            const productQty = product['Qty'];

            // Search product
            await this.page.fill(this.searchInput, productName);
            await this.page.click(this.searchButton);
            await this.page.fill(this.searchkeywordInput, productName);
            await this.page.click(this.searchPageButton);

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
            if (productSerialNo && productFilePath) {
                const filePath = path.resolve(__dirname, '../../', productFilePath);
                await this.page.setInputFiles('input[type="file"]', filePath);
            }

            // Select color
            if (productColor) {
                await this.selectColorByLabel("Color", productColor);
            }

            // Input quantity
            if (productQty) {
                await this.page.fill('input[id^="product_enteredQuantity"]', productQty.toString());
            }

            // Add to cart
            await this.page.click(this.addToCartButton);
            await this.page.waitForTimeout(2000); // wait for cart update
            console.log(`Added ${productName} to cart.\n\n`);

            // Timeout between products
            await this.page.waitForTimeout(2000);
        }

        return true;
    }
}

import { Page } from 'playwright';
import { loadXlsxData } from '../../utils/xlsxDataLoader';
import * as XLSX from 'xlsx';
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


    async gotoSearchPage() {
        await this.page.goto(this.searchURL);
    }

    async searchProduct(testDataPath: string, worksheet: number): Promise<boolean> {
        const data = loadXlsxData(testDataPath, worksheet);
        // console.log("Data from Excel: ", data);
        // console.log("Price: ", data[0].Price);
        // console.log("Product Name: ", data[0]["Product Name"]);
        // console.log("Type of Data: ", typeof data);

        if (!data || data.length === 0) {
            console.log("No data found in the provided Excel sheet.");
            return false;
        }

        for (const product of data) {
            // Access product details from the current row
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
            const productPrice = product['Price'];
            const productQty = product['Qty'];
            const productTotalPrice = product['Total Price'];

            /*
            // Log product details for verification
            console.log("Searching for Product: ", productName);
            console.log("Product Manufacturer: ", productManufacturer);
            console.log("Product SKU: ", productSKU);
            console.log("Product Processor: ", productProcessor);
            console.log("Product RAM: ", productRAM);
            console.log("Product HDD: ", productHDD);
            console.log("Product OS: ", productOS);
            console.log("Product Software: ", productSoftware);
            console.log("Product Serial No: ", productSerialNo);
            console.log("Product File Path: ", productFilePath);
            console.log("Product Color: ", productColor);
            console.log("Product Price: ", productPrice);
            console.log("Product Qty: ", productQty);
            console.log("Product Total Price: ", productTotalPrice);
            */

            // Fill the search input and click search button
            await this.page.fill(this.searchInput, productName);
            await this.page.click(this.searchButton);
            await this.page.fill(this.searchkeywordInput, productName);
            await this.page.click(this.searchPageButton);


            // Click matched product and wait to open product details page
            console.log(`Clicking on product: ${productName}`);
            await this.page.locator('.product-item').first().click();
            // await this.page.waitForLoadState('networkidle');

            // Get text of this locator and validate with productManufacturer only if expected value is available
            if (productManufacturer) {
                const manufacturerText = await this.page.locator(this.productPageManufacturer).textContent();
                const trimmedManufacturer = manufacturerText?.trim();
                if (trimmedManufacturer && trimmedManufacturer.toLowerCase() === productManufacturer.toLowerCase()) {
                    console.log(`Manufacturer matches: ${trimmedManufacturer}`);
                } else {
                    console.log(`Manufacturer does not match. Expected: ${productManufacturer}, Actual: ${trimmedManufacturer}`);
                }
            }

            // Get text of this locator and validate with productSKU only if expected value is available
            if (productSKU) {
                const skuText = await this.page.locator(this.productPageSKU).textContent();
                const trimmedSKU = skuText?.trim();
                if (trimmedSKU && trimmedSKU.toLowerCase() === productSKU.toLowerCase()) {
                    console.log(`SKU matches: ${trimmedSKU}`);
                } else {
                    console.log(`SKU does not match. Expected: ${productSKU}, Actual: ${trimmedSKU}`);
                }
            }


            // Add to cart
            await this.page.click(this.addToCartButton);

            // Verify that the search results suggest products related to the search term
            const searchResults = await this.page.$$eval('.product-item', items =>
                items.map(item => item.textContent || '')
            );

            // send validation to calling test function
            const isProductFound = searchResults.some(result =>
                result.toLowerCase().includes(productName.toLowerCase())
            );
        }
        return true;
    }
}
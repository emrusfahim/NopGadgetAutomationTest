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
    private searchInput = '//input[@id="small-searchterms"]';
    private searchkeywordInput = '//input[@id="q"]';
    private searchButton = "//button[normalize-space()='Search']";
    private searchPageButton = "//button[@class='button-1 search-button']";
    private searchURL = '/search';

    
    async gotoSearchPage() {
        await this.page.goto(this.searchURL);
    }

    async searchProduct(testDataPath: string, worksheet: number): Promise<boolean> {
        const data = loadXlsxData(testDataPath, worksheet);
        console.log("Data from Excel: ", data);
        // console.log("Price: ", data[0].Price);
        // console.log("Product Name: ", data[0]["Product Name"]);
        // console.log("Type of Data: ", typeof data);

        if (!data || data.length === 0) {
            console.log("No data found in the provided Excel sheet.");
            return false;
        }

        for (const product of data) {
            const productName = product["Product Name"];
            console.log("Product Name: ", productName);
            await this.page.fill(this.searchkeywordInput, productName);
            await this.page.click(this.searchPageButton);

            // Verify that the search results suggest products related to the search term
            const searchResults = await this.page.$$eval('.product-item', items =>
                items.map(item => item.textContent || '')
            );
        }
        return true;
    }
}
import { Page } from 'playwright'; // Assuming Playwright for automation

export class ProductPage {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    // Locators
    private productNameLocator = '.product-name';
    private productPriceLocator = '.product-price';
    private addToCartButtonLocator = '.add-to-cart-btn';

    // Demo methods
    async getProductName(): Promise<string> {
        return await this.page.textContent(this.productNameLocator);
    }

    async getProductPrice(): Promise<string> {
        return await this.page.textContent(this.productPriceLocator);
    }

    async addToCart(): Promise<void> {
        await this.page.click(this.addToCartButtonLocator);
    }
}

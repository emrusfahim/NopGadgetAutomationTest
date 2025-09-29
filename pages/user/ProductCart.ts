import { Page, Locator } from '@playwright/test';
import * as XLSX from 'xlsx';

export class ProductCart {
    private page: Page;

    // Locators and URL
    private cartUrl: string = '/cart';
    private productName: Locator;
    private productSku: Locator;
    private productPrice: Locator;
    private productTotal: Locator;
    private quantityInput: Locator;
    private increaseQtyBtn: Locator;
    private decreaseQtyBtn: Locator;
    private deleteProductBtn: Locator;
    private giftCardInput: Locator;
    private addGiftCardBtn: Locator;
    private discountCodeInput: Locator;
    private applyDiscountBtn: Locator;
    private giftWrappingDropdown: Locator;
    private subtotal: Locator;
    private agreeCheckbox: Locator;
    private checkoutBtn: Locator;

    constructor(page: Page) {
        this.page = page;
        this.productName = page.locator('.product-name');
        this.productSku = page.locator('.product-sku');
        this.productPrice = page.locator('.product-price');
        this.productTotal = page.locator('.product-total');
        this.quantityInput = page.locator('.quantity-input');
        this.increaseQtyBtn = page.locator('.increase-qty');
        this.decreaseQtyBtn = page.locator('.decrease-qty');
        this.deleteProductBtn = page.locator('.delete-product');
        this.giftCardInput = page.locator('.gift-card-input');
        this.addGiftCardBtn = page.locator('.add-gift-card');
        this.discountCodeInput = page.locator('.discount-code-input');
        this.applyDiscountBtn = page.locator('.apply-discount');
        this.giftWrappingDropdown = page.locator('.gift-wrapping-dropdown');
        this.subtotal = page.locator('.subtotal');
        this.agreeCheckbox = page.locator('.agree-checkbox');
        this.checkoutBtn = page.locator('.checkout-btn');
    }

    async loadProductDataFromExcel(filePath: string, sheetName: string): Promise<any[]> {
        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[sheetName];
        return XLSX.utils.sheet_to_json(worksheet);
    }

    async verifyProductDetailsFromExcel(filePath: string, sheetName: string) {
        await this.page.waitForLoadState();
        const data = await this.loadProductDataFromExcel(filePath, sheetName);
        for (const item of data) {
            await this.productName.filter({ hasText: item.name }).waitFor();
            await this.productSku.filter({ hasText: item.sku }).waitFor();
            await this.productPrice.filter({ hasText: item.price }).waitFor();
            await this.productTotal.filter({ hasText: item.total }).waitFor();
            await this.quantityInput.waitFor();
            // Add logic to check qty if needed
        }
    }

    async gotoCartPage() {
        await this.page.goto(this.cartUrl);
    }

    async increaseQuantity() {
        await this.increaseQtyBtn.click();
    }

    async decreaseQuantity() {
        await this.decreaseQtyBtn.click();
    }

    async deleteProduct() {
        await this.deleteProductBtn.click();
    }

    async addGiftCard(code: string) {
        await this.giftCardInput.fill(code);
        await this.addGiftCardBtn.click();
    }

    async applyDiscountCode(code: string) {
        await this.discountCodeInput.fill(code);
        await this.applyDiscountBtn.click();
    }

    async selectGiftWrapping(option: 'Yes' | 'No') {
        await this.giftWrappingDropdown.selectOption(option);
    }

    async verifySubtotal(expectedSubtotal: string) {
        await this.subtotal.filter({ hasText: expectedSubtotal }).waitFor();
    }

    async agreeAndCheckout() {
        await this.agreeCheckbox.check();
        await this.checkoutBtn.click();
    }
}
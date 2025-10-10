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
    private productPriceLocator = '.product-unit-price'; // Finds product unit prices
    private productQuantityLocator = '.qty-input'; // Finds quantity inputs
    private productTotalLocator = '.product-subtotal'; // Finds total prices
    private productRowLocator = '.cart tbody tr'; // Locator for product rows in the cart table
    private productDiscountLocator = '.discount'; // Finds discount information
    private discountCouponInputLocator = 'input#discountcouponcode'; // Input for coupon codes
    private applyCouponButtonLocator = 'button#applydiscountcouponcode'; // Button to apply coupon codes
    private giftCardInputLocator = 'input#giftcardcouponcode'; // Input for gift card codes
    private applyGiftCardButtonLocator = 'button#applygiftcardcouponcode'; // Button to apply gift card codes
    private checkoutButtonLocator = 'button#checkout'; // Button to proceed to checkout
    private termsOfServiceCheckboxLocator = 'label:has-text("I agree with the terms of service and I adhere to ")'; // Checkbox for agreeing to terms of service
    private emptyCartLocator = "xpath=//div[@class='no-data' and contains(text(),'Your Shopping Cart is empty!')]"; // Locator for empty cart message

    // Go to the cart page
    async gotoCartPage() {
        await this.page.goto(this.cartPageUrl);
    }

    // Load product data from an Excel file and store it in a structured way in variables then console log it
    async checkProductsInCart(filePath: string, sheetName: string) {
        const products = loadXlsxData(filePath, sheetName);
        console.log(`Loaded products from ${filePath}, Sheet: ${sheetName}`);
        // console.log(products);

        // Here you can add code to compare the loaded products with those in the cart, first loop and check for the name only and present in cart page.I found, then check for other details.
        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            const productName = product['Product Name'];
            const productRows = this.page.locator(`xpath=//a[@class='product-name'][normalize-space()='${productName}']`);
            const count = await productRows.count();

            if (count === 0) {
                console.warn(`Product not found in cart: ${productName}`);
                continue; // Skip to next product
            }

            console.log(`Product found in cart: ${productName} (${count} instance(s))`);

            // Loop over all matching rows for this product
            const allRows = await productRows.all();
            for (const productRow of allRows) {
                const row = productRow.locator('xpath=ancestor::tr[1]'); // Navigate to the row element

                // check for sku, price, quantity, total price, discount if available
                const productSku = await row.locator(this.productSkuLocator).innerText();
                const productPrice = await row.locator(this.productPriceLocator).innerText();
                const productQuantity = product['Qty'];
                const productTotalPrice = product['Total Price'];
                // Log the results
                console.log(`Product Name: ${productName}`);
                console.log(`SKU: ${productSku}`);
                console.log(`Price: ${productPrice}`);
                console.log(`Quantity: ${productQuantity}`);
                console.log(`Total Price: ${productTotalPrice}`);
                console.log("\n");
            }
        }
        console.log('Total products in cart:', await this.page.locator(this.productRowLocator).count());
    }

    async removeProductFromCart(productName?: string) {
        // console.log(productName);
        console.log(`Removing product from cart: ${productName || 'All products'}`);
        const productRow = this.page.locator(`xpath=//a[@class='product-name'][normalize-space()='${productName}']`);
        const isProductInCart = await productRow.count() > 0;

        if (productName) {
            if (isProductInCart) { // Remove specific product
                const row = productRow.first().locator('..').locator('..');
                await row.locator('xpath=.//button[@name="updatecart"]').click();
                console.log(`Removed product from cart: ${productName}`);
            } else {
                console.warn(`Product not found in cart: ${productName}`);
            }
        } else { // Remove all products
            let cartItemCount = await this.page.locator(this.productRowLocator).count();
            while (cartItemCount > 0) {
                const firstRow = this.page.locator(this.productRowLocator).first();
                // console log removed product name
                const removedProductName = await firstRow.locator(this.productNameLocator).innerText();
                console.log(`Removed product from cart: ${removedProductName}`);

                await firstRow.locator('xpath=.//button[@name="updatecart"]').click();
                //await this.page.waitForTimeout(1000); // Wait a bit for the cart to update
                cartItemCount = await this.page.locator(this.productRowLocator).count();
                console.log(`Products left in cart: ${cartItemCount}`);

                if (cartItemCount === 0) {
                    // await this.page.waitForLoadState('networkidle');
                    // Check for "Your Shopping Cart is empty!" message at //div[@class='no-data']
                    await this.page.reload();
                    const emptyCartLocator = this.page.locator(this.emptyCartLocator);
                    const isCartEmpty = await emptyCartLocator.isVisible();
                    if (isCartEmpty) {
                        const emptyCartText = await emptyCartLocator.innerText();
                        console.log(`Cart cleared: ${emptyCartText}`);
                    } else {
                        console.log('Cart is not empty');
                    }
                }
            }
        }
    }

    // click and select No from this dropdown #checkout_attribute_input_1 - option "No" - option "Yes [+$10.00]"
    async selectGiftWrappingOption(option: 'Yes [+$10.00]' | 'No') {
        const giftWrapSelector = 'select#checkout_attribute_1';
        await this.page.selectOption(giftWrapSelector, option);
        console.log(`Gift wrap option set to: ${option}`);
    }

    // Input a coupon code and apply it
    async applyCouponCode(couponCode: string) {
        await this.page.fill(this.discountCouponInputLocator, couponCode);
        await this.page.click(this.applyCouponButtonLocator);
        console.log(`Applied coupon code: ${couponCode}`);

        const isCouponApplied = await this.page.locator("//span[@class='applied-discount-code']").isVisible();
        return isCouponApplied;
    }

    // Input a gift card code and apply it
    async applyGiftCardCode(giftCardCode: string) {
        await this.page.fill(this.giftCardInputLocator, giftCardCode);
        await this.page.click(this.applyGiftCardButtonLocator);
        console.log(`Applied gift card code: ${giftCardCode}`);

        const isGiftCardApplied = await this.page.locator("//label[normalize-space()='Gift Card:']").isVisible();
        return isGiftCardApplied;
    }

    async agreeToTerms() {
        await this.page.locator(this.termsOfServiceCheckboxLocator).check();
        console.log('Agreed to terms of service');
        // await this.page.locator(this.checkoutButtonLocator).click();
        // console.log('Proceeded to checkout');
        await this.page.waitForTimeout(2000); // Just to observe the state before checkout, can be removed
    }

    async proceedToCheckout() {
        await this.page.locator(this.checkoutButtonLocator).click();
        console.log('Proceeded to checkout');
        // await this.page.waitForLoadState('networkidle');
    }



    

    // One Page Checkout will be defined here
    async clickBillingContinue() {
        // Click the Continue button in the Billing Address section
        await this.page.click('button[name="save"]');
        console.log('Clicked Billing Address Continue button');
        await this.page.waitForLoadState('networkidle');
    }

    async clickShippingContinue() {
        // Click the Continue button in the Shipping Address section
        await this.page.click('button[name="save"]');
        console.log('Clicked Shipping Address Continue button');
        await this.page.waitForLoadState('networkidle');
    }

    async clickShippingMethodContinue() {
        // Click the Continue button in the Shipping Method section
        await this.page.click('button[name="save"]');
        console.log('Clicked Shipping Method Continue button');
        await this.page.waitForLoadState('networkidle');
    }

    async clickPaymentMethodContinue() {
        // Click the Continue button in the Payment Method section
        await this.page.click('button[name="save"]');
        console.log('Clicked Payment Method Continue button');
        await this.page.waitForLoadState('networkidle');
    }
    async clickPaymentInfoContinue() {
        // Click the Continue button in the Payment Information section
        await this.page.click('button[name="save"]');
        console.log('Clicked Payment Information Continue button');
        await this.page.waitForLoadState('networkidle');
    }
    async confirmOrder() {
        // Click the Confirm button to place the order
        await this.page.click('button[name="confirm"]');
        console.log('Order confirmed');
        await this.page.waitForLoadState('networkidle');
    }
}
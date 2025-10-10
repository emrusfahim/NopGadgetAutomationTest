import { Page, expect } from '@playwright/test';

export class OrdersPage {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    // Locators and links will be here
    private detailsButtonLocator = 'button.order-details-button';

    async navigateToOrders(url: string = '/order/history') {
        await this.page.goto(url);
    }

    async findOrderItem(orderNumber: string) {
        const orderItem = this.page.locator(`.section.order-item:has(strong:has-text("Order Number: ${orderNumber}"))`);
        await expect(orderItem).toBeVisible();
        return orderItem;
    }

    async clickDetailsButton(orderItem: any) {
        await orderItem.locator(this.detailsButtonLocator).click();
    }

    async assertOrderDetailsUrl(orderNumber: string) {
        await expect(this.page).toHaveURL(new RegExp(`/orderdetails/${orderNumber}`));
    }

    async assertOrderOverview(orderNumber: string, date: string, status: RegExp, total: string) {
        await expect(this.page.locator('.order-number strong')).toHaveText(`Order #${orderNumber}`);
        await expect(this.page.locator('.order-date')).toContainText(date);
        await expect(this.page.locator('.order-status')).toHaveText(status);
        await expect(this.page.locator('.order-total strong')).toHaveText(total);
    }

    async assertBillingAddress(name: string, email: string, phone: string, fax: string, company: string, country: string, city: string, address1: string, address2: string, zip: string) {
        const billing = this.page.locator('div.billing-info');
        await expect(billing.locator('.name')).toHaveText(name);
        await expect(billing.locator('.email')).toHaveText(`Email: ${email}`);
        await expect(billing.locator('.phone')).toHaveText(`Phone: ${phone}`);
        await expect(billing.locator('.fax')).toHaveText(`Fax: ${fax}`);
        await expect(billing.locator('.company')).toHaveText(company);
        await expect(billing.locator('.country')).toHaveText(country);
        await expect(billing.locator('.city')).toHaveText(city);
        await expect(billing.locator('.address1')).toHaveText(address1);
        await expect(billing.locator('.address2')).toHaveText(address2);
        await expect(billing.locator('.zippostalcode')).toHaveText(zip);
    }

    async assertPaymentInfo(method: string, status: string) {
        const payment = this.page.locator('div.payment-method-info');
        await expect(payment.locator('.payment-method .value')).toHaveText(method);
        await expect(payment.locator('.payment-method-status .value')).toHaveText(status);
    }

    async assertPickupPoint(address1: string, cityStateZip: string, country: string) {
        const pickup = this.page.locator('div.shipping-info-wrap div.shipping-info');
        await expect(pickup.locator('li.address1')).toHaveText(address1);
        await expect(pickup.locator('li.city-state-zip')).toHaveText(cityStateZip);
        await expect(pickup.locator('li.country')).toHaveText(country);
    }

    async assertShippingMethod(method: string, status: string) {
        const shipping = this.page.locator('div.shipping-method-info');
        await expect(shipping.locator('.shipping-method .value')).toHaveText(method);
        await expect(shipping.locator('.shipping-status .value')).toHaveText(status);
    }

    async assertProductList(products: { sku: string; name: string; price: string; qty: string; subtotal: string }[]) {
        const rows = this.page.locator('table.data-table tbody tr');
        await expect(rows).toHaveCount(products.length);
        for (let i = 0; i < products.length; i++) {
            const prod = rows.nth(i);
            const p = products[i];
            await expect(prod.locator('.sku-number')).toHaveText(p.sku);
            await expect(prod.locator('.product a', { hasText: p.name })).toHaveText(p.name);
            await expect(prod.locator('.product-unit-price')).toHaveText(p.price);
            await expect(prod.locator('.product-quantity')).toHaveText(p.qty);
            await expect(prod.locator('.product-subtotal')).toHaveText(p.subtotal);
        }
    }

    async assertTotals(subtotal: string, shipping: string, tax: string, giftCard: string, orderTotal: string) {
        const totals = this.page.locator('.cart-total');
        await expect(totals.locator('tr:nth-child(1) span')).toHaveText(subtotal);
        await expect(totals.locator('tr:nth-child(2) span')).toHaveText(shipping);
        await expect(totals.locator('tr:nth-child(3) span')).toHaveText(tax);
        await expect(totals.locator('tr:nth-child(4) span')).toHaveText(giftCard);
        await expect(totals.locator('tr:nth-child(5) strong')).toHaveText(orderTotal);
    }
}


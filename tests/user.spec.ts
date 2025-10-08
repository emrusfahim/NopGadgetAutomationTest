import { test, expect } from '@playwright/test';
import { loadXlsxData } from '../utils/xlsxDataLoader';
import { UserLogin } from '../pages/user/UserLogin';
import { UserProfileManagement } from '../pages/user/UserProfileManagement';
import { AddressManagement } from '../pages/user/AddressManagement';
import { ChangePasswordPage } from '../pages/user/ChangePassword';
import { ProductSearch } from '../pages/user/ProductSearchAddCart';
import { ProductCart } from '../pages/user/ProductCart';

// Environment validation helper
function validateRequiredEnvVars(vars: string[]) {
  const missing = vars.filter(varName => !process.env[varName]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Validate required environment variables once
test.beforeAll(() => {
  validateRequiredEnvVars([
    'TEST_DATA_PATH',        // Still needed for other tests
    'WORKSHEET_USERS',       // Still needed for profile tests
    'WORKSHEET_PRODUCTS',    // Still needed for product tests
    'WORKSHEET_ADDRESSES',   // Still needed for address tests
    'TEST_EMAIL',           // Used by tests
    'LOGIN_EMAIL',          // Used by global setup
    'TEST_PASSWORD',        // Used by login
    'OLD_PASSWORD',
    'NEW_PASSWORD',
    'CONFIRM_PASSWORD',
    'ROW_INDEX',
    'STORAGE_STATE_PATH'    // Used by global setup
  ]);
});

test('Landing Page', async ({ page }) => {
  // Navigate to the baseURL
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Nop Gadget/);
});

test('Login to user account', async ({ page }) => {
  // No parameters needed - everything from .env
  const userLogin = new UserLogin(page);
  await userLogin.gotoLoginPage();
  const loginSuccess = await userLogin.login();
  expect(loginSuccess).toBe(true);
});

test('Update customer Profile info', async ({ page }) => {
  const testDataPath = process.env.TEST_DATA_PATH!;
  const worksheet = process.env.WORKSHEET_USERS!;
  const email = process.env.TEST_EMAIL!;

  // Create an instance of UserProfileManagement
  const userProfileManagement = new UserProfileManagement(page);

  // Update customer info
  await userProfileManagement.gotoCustomerInfo();
  await userProfileManagement.updateCustomerInfo(testDataPath, email, worksheet);
});

test('Address management', async ({ page }) => {
  const testDataPath = process.env.TEST_DATA_PATH!;
  const worksheet = process.env.WORKSHEET_ADDRESSES!;
  const rowIndex = parseInt(process.env.ROW_INDEX || '0');

  // Create an instance of AddressManagement
  const addressManagement = new AddressManagement(page);

  // Go to address page
  await addressManagement.gotoAddressPage();
  await addressManagement.editAddressButtonClick();

  // Add a new address and verify it was added
  const isAddressAdded = await addressManagement.addressFormFill(testDataPath, worksheet, rowIndex);
  expect(isAddressAdded).toBe(true);

  // Edit the address
  await addressManagement.gotoAddressPage();
  await addressManagement.editAddressButtonClick();
  const isAddressEdited = await addressManagement.addressFormFill(testDataPath, worksheet, rowIndex);
  expect(isAddressEdited).toBe(true);

  // Note: Skipping delete address test to retain at least one address for future tests
  // Go to address page
  // await addressManagement.gotoAddressPage();
  // // Delete the address and verify it was deleted
  // const isAddressDeleted = await addressManagement.deleteAddress();
  // expect(isAddressDeleted).toBe(true);
});

test('Change password', async ({ page }) => {
  const oldPassword = process.env.OLD_PASSWORD!;
  const newPassword = process.env.NEW_PASSWORD!;
  const confirmPassword = process.env.CONFIRM_PASSWORD!; // ✅ Fixed

  // Create an instance of ChangePasswordPage
  const changePasswordPage = new ChangePasswordPage(page);

  // goto change password page
  await changePasswordPage.gotoChangePasswordPage();

  // Change password
  await changePasswordPage.changePassword(oldPassword, newPassword, confirmPassword);
});


test('Search and Add All Products to Cart from Excel', async ({ page }) => {
  // Initialize the ProductSearch class
  test.setTimeout(120000); // Set timeout to 120 seconds per product
  const productSearch = new ProductSearch(page);
  const productCart = new ProductCart(page);
  await productCart.gotoCartPage();
  await productCart.removeProductFromCart();
  await page.waitForTimeout(2000);
  console.log("Cleared cart before starting product additions...");

  // Load all product data from Excel
  const testDataPath = process.env.TEST_DATA_PATH!;  // e.g., 'testData/products.xlsx'
  const worksheet = process.env.WORKSHEET_PRODUCTS!;  // e.g., 'Products'
  // const products = await productSearch.loadProductData(testDataPath, worksheet);
  const products = loadXlsxData(testDataPath, worksheet);

  if (products.length === 0) {
    throw new Error('No products found in Excel sheet');
  }

  console.log(`Processing ${products.length} products from Excel...`);

  // Loop through each product in the sheet
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    console.log(`\n--- Processing Product ${i + 1}/${products.length}: ${product['Product Name']} ---`);

    // Extract data from the current row (use optional chaining for safety)
    const productName = product['Product Name'];  // Required
    const manufacturer = product['Manufacturer'];  // Optional
    const sku = product['SKU'];  // Optional
    const processor = product['Processor'];  // Optional
    const ram = product['RAM'];  // Optional
    const hdd = product['HDD'];  // Optional
    const os = product['OS'];  // Optional
    const software = product['Software'];  // Optional
    const color = product['Color'];  // Optional
    const qty = product['Qty'];  // Optional (number)
    const serialFilePath = product['Serial File Path'];  // Optional

    // Skip if no product name
    if (!productName) {
      console.log(`Skipping row ${i + 1}: Missing 'Product Name'`);
      continue;
    }

    // Step 1: Navigate to search page (do this once at the start, or per product if needed)
    if (i === 0) {  // Only navigate once for efficiency
      await productSearch.gotoSearchPage();
    }

    // Step 2: Search for the product
    await productSearch.searchForProduct(productName);

    // Step 3: Select the first product from results
    await productSearch.selectProductFromResults(productName);
    await page.waitForLoadState('networkidle');

    // Step 4: Validate product details (manufacturer/SKU if provided)
    await productSearch.validateProductDetails(manufacturer, sku);

    // Step 5: Configure product options (dropdowns like processor, RAM, etc.)
    await productSearch.configureProductOptions(processor, ram, hdd, os, software);

    // Step 6: Select color (if applicable)
    await productSearch.selectColor(color);

    // Step 7: Set quantity
    await productSearch.setQuantity(qty);

    // Step 8: Upload serial file (if path provided)
    // console.log(`Serial file path: ${serialFilePath}`); 
    await productSearch.uploadSerialFile(serialFilePath);

    // Step 9: Add to cart
    await productSearch.addToCart();

    // Step 10: Verify success for this product
    await productSearch.verifyAddToCartSuccess(productName);

    // Optional: Add a small delay between products to avoid overwhelming the site
    await page.waitForTimeout(1000);
  }

  console.log(`\nSuccessfully processed all ${products.length} products!`);
});


test('Product Cart operations', async ({ page }) => {
  const testDataPath = process.env.TEST_DATA_PATH!;
  const worksheet = process.env.WORKSHEET_PRODUCTS!;

  const productCart = new ProductCart(page);

  await productCart.gotoCartPage();
  await productCart.checkProductsInCart(testDataPath, worksheet);
  await productCart.selectGiftWrappingOption("Yes [+$10.00]");
  const isCouponApplied = await productCart.applyCouponCode("DISCOUNT10");
  const isGiftCardApplied = await productCart.applyGiftCardCode("0fa83065-e9d5");

  // Assertions can be added here to verify the results
  expect(isCouponApplied).toBe(true);
  expect(isGiftCardApplied).toBe(true);
  await productCart.removeProductFromCart();

  await productCart.agreeToTermsAndCheckout();
});







// // Additional test examples for future use
// test.skip('Admin login', async ({ page }) => {
//   const adminEmail = process.env.ADMIN_EMAIL!;
//   const adminPassword = process.env.ADMIN_PASSWORD!;

//   // Admin-specific test logic here
// });

// test.skip('API integration test', async ({ page }) => {
//   const apiBaseUrl = process.env.API_BASE_URL;
//   const apiKey = process.env.API_KEY;

//   if (apiBaseUrl && apiKey) {
//     // API test logic here
//     // } else {
//     //   test.skip('API configuration not provided');
//     // }
//   }
// });
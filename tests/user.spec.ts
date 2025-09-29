import { test, expect } from '@playwright/test';
import { loadXlsxData } from '../utils/xlsxDataLoader';
import { UserLogin } from '../pages/user/UserLogin';
import { UserProfileManagement } from '../pages/user/UserProfileManagement';
import { AddressManagement } from '../pages/user/AddressManagement';
import { ChangePasswordPage } from '../pages/user/ChangePassword';
import { ProductSearch } from '../pages/user/ProductSearchAndCart';

test.skip('Landing Page', async ({ page }) => {
  // Navigate to the baseURL
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Nop Gadget/);
});

test.skip('Login to user account', async ({ page }) => {
  const testDataPath = 'testData/testData_user.xlsx';
  const email = 'sakib75@gmail.com';
  const worksheet = 0;

  // Create an instance of UserLogin
  const userLogin = new UserLogin(page);

  // Go to login page
  await userLogin.gotoLoginPage();

  // Perform login
  const loginSuccess = await userLogin.login(testDataPath, email, worksheet);
  expect(loginSuccess).toBe(true);
});

test.skip('Update customer Profile info', async ({ page }) => {
  const testDataPath = 'testData/testData_user.xlsx';
  const email = 'sakib75@gmail.com';
  const worksheet = 0;

  // // Create an instance of UserLogin
  // const userLogin = new UserLogin(page);

  // // Perform login
  // const loginSuccess = await userLogin.login(Email);
  // expect(loginSuccess).toBe(true);

  // Create an instance of UserProfileManagement
  const userProfileManagement = new UserProfileManagement(page);

  // Update customer info
  await userProfileManagement.gotoCustomerInfo();
  await userProfileManagement.updateCustomerInfo(testDataPath, email, worksheet);
});

test.skip('Address management', async ({ page }) => {
  const testDataPath = 'testData/testData_user.xlsx';
  const worksheet = 3;
  const rowIndex = 0; // Change this index to select different rows from the Excel sheet

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

test.skip('Change password', async ({ page }) => {
  const oldPassword = '123456';
  const newPassword = '123456';
  const confirmPassword = '123456';

  // Create an instance of ChangePasswordPage
  const changePasswordPage = new ChangePasswordPage(page);

  // goto change password page
  await changePasswordPage.gotoChangePasswordPage();
  // Change password
  await changePasswordPage.changePassword(oldPassword, newPassword, confirmPassword);
});

test('Search product', async ({ page }) => {
  const testDataPath = 'testData/testData_user.xlsx';
  // const worksheet = 'Products';
  const worksheet = 3;

  // Create an instance of ProductSearch
  const productSearch = new ProductSearch(page);

  await productSearch.gotoSearchPage();

  // Search for a product
  const searchResult = await productSearch.searchProduct(testDataPath, worksheet);
  // Validation is done inside the method and result is returned to the calling test function
  expect(searchResult).toBe(true);
});
import { Page } from '@playwright/test';

export class ChangePasswordPage {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    // Locators and URL
    private addressPageUrl = '/customer/changepassword';
    private oldPasswordInput = 'input[name="OldPassword"]';
    private newPasswordInput = 'input[name="NewPassword"]';
    private confirmPasswordInput = 'input[name="ConfirmNewPassword"]';
    private changePasswordButton = '//button[normalize-space()="Change password"]';

    // goto change password page
    async gotoChangePasswordPage() {
        await this.page.goto(this.addressPageUrl);
    }

    // Change password method
    async changePassword(oldPassword: string, newPassword: string, confirmPassword: string) {
        if (newPassword !== confirmPassword) {
            throw new Error('New password and confirm password do not match');
        }
        
        await this.page.fill(this.oldPasswordInput, oldPassword);
        await this.page.fill(this.newPasswordInput, newPassword);
        await this.page.fill(this.confirmPasswordInput, confirmPassword);
        await this.page.click(this.changePasswordButton);
    }
}
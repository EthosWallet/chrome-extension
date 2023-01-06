import { getEncrypted } from '_src/shared/storagex/store';

import type { AccountCustomization } from '_src/types/AccountCustomization';

export const ACCOUNT_CUSTOMIZATIONS_STORAGE_KEY = 'account-customizations';

class AccountCustomizations {
    public async getAccountCustomizations(): Promise<
        Record<string, AccountCustomization>
    > {
        const permissionString =
            (await getEncrypted(ACCOUNT_CUSTOMIZATIONS_STORAGE_KEY)) || '{}';
        return JSON.parse(permissionString);
    }

    // private async storeAccountCustomization(
    //     accountCustomization: AccountCustomization
    // ) {
    //     const accountCustomizations = await this.getAccountCustomizations();
    //     accountCustomizations[permission.origin] = permission;
    //     const permissionsString = JSON.stringify(permissions);
    //     await setEncrypted(PERMISSIONS_STORAGE_KEY, permissionsString);
    // }
}

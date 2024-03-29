import { decryptAccountCustomization } from './accountCustomizationEncryption';
import { explorerApiCall } from '_src/shared/utils/customizationsSync/ethosPlatformApiCall';

import type { AccountInfo } from '_src/ui/app/KeypairVault';

const getCustomization = async (
    jwt: string,
    privateKey: string
): Promise<AccountInfo | undefined | 'deleted'> => {
    const { json, status } = await explorerApiCall(
        'v1/user/profile',
        'GET',
        jwt
    );

    if (status !== 200 && !json) {
        return undefined;
    }

    if (json.data === 'deleted') {
        return 'deleted';
    }

    return decryptAccountCustomization(json.data, privateKey);
};

export default getCustomization;

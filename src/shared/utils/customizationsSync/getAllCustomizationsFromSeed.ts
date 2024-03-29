import getCustomization from './getCustomization';
import getJwtWithSigner from './getJwtWithSigner';
import { BaseSigner } from '_src/shared/cryptography/BaseSigner';
import KeypairVault from '_src/ui/app/KeypairVault';

import type { SuiClient } from '@mysten/sui.js/client';
import type { AccountCustomization } from '_src/types/AccountCustomization';

export const getAllCustomizationsFromSeed = async (
    mnemonic: string,
    client: SuiClient
): Promise<Record<string, AccountCustomization> | 'deleted'> => {
    const keypairVault = new KeypairVault();
    keypairVault.mnemonic = mnemonic;

    const accountCustomizations: Record<string, AccountCustomization> = {};

    let walletIndex = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const signer = new BaseSigner(
            keypairVault.getKeyPair(walletIndex),
            client
        );

        const jwt = await getJwtWithSigner(signer);

        const privateKey = keypairVault
            .getKeyPair(walletIndex)
            .export().privateKey;

        const accountCustomization = await getCustomization(jwt, privateKey);
        // console.log(
        //     'accountCustomization from server :>> ',
        //     accountCustomization
        // );

        if (!accountCustomization) {
            break;
        }

        if (accountCustomization === 'deleted') {
            return 'deleted';
        }

        const address = await signer.getAddress();
        accountCustomizations[address] = accountCustomization;
        walletIndex++;
    }

    return accountCustomizations;
};

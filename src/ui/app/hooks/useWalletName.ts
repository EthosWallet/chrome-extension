import { useMemo } from 'react';

import type { AccountInfo } from '../KeypairVault';

const useWalletName = (wallet?: AccountInfo) => {
    const name = useMemo(() => {
        if (!wallet) return 'Wallet';

        if (wallet.nickname) return wallet.nickname;

        if (
            wallet.importedMnemonicName !== undefined &&
            wallet.importedMnemonicIndex !== undefined &&
            wallet.ledgerAccountIndex !== undefined
        ) {
            return `${wallet.importedMnemonicName} ${
                wallet.importedMnemonicIndex + 1
            }`;
        }

        if (wallet.importedPrivateKeyName) return wallet.importedPrivateKeyName;

        return '';
    }, [wallet]);

    return name;
};

export default useWalletName;

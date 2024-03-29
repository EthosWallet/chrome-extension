import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

import { type AccountInfo } from '../../KeypairVault';
import getNextEmoji from '../../helpers/getNextEmoji';
import getNextWalletColor from '../../helpers/getNextWalletColor';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
    saveAccountInfos,
    saveActiveAccountIndex,
    setAccountInfos,
} from '../../redux/slices/account';
import { thunkExtras } from '../../redux/store/thunk-extras';
import { FailAlert } from '../../shared/alerts/FailAlert';
import { clearForNetworkOrWalletSwitch as clearBalancesForNetworkOrWalletSwitch } from '_redux/slices/balances';
import { clearForNetworkOrWalletSwitch as clearTokensForNetworkOrWalletSwitch } from '_redux/slices/sui-objects';
import Authentication from '_src/background/Authentication';
import Permissions from '_src/background/Permissions';
import { encryptAccountCustomization } from '_src/shared/utils/customizationsSync/accountCustomizationEncryption';
import saveCustomization from '_src/shared/utils/customizationsSync/saveCustomization';
import useJwt from '_src/shared/utils/customizationsSync/useJwt';

import type { Dispatch, SetStateAction } from 'react';

/*
    Because creating a wallet extensively uses hooks (and hooks can't be used outside
    react components), this component wraps a given component and provides a function
    to be called that creates a new wallet and navigates to the home page.
*/

interface CreateWalletProviderProps {
    setCreateWallet: Dispatch<SetStateAction<() => void>>;
    setLoading: Dispatch<SetStateAction<boolean>>;
    children: JSX.Element;
}

const CreateWalletProvider = ({
    setCreateWallet,
    setLoading,
    children,
}: CreateWalletProviderProps) => {
    const dispatch = useAppDispatch();
    const { accountInfos, authentication, customizationsSyncPreference } =
        useAppSelector(({ account }) => account);
    const { getCachedJwt } = useJwt();

    const keypairVault = thunkExtras.keypairVault;
    const draftAccountInfos = useRef<AccountInfo[]>(accountInfos);

    const handleSaveCustomization = useCallback(
        async (
            _address: string,
            _accountInfos: AccountInfo[],
            accountIndex: number
        ) => {
            const jwt = await getCachedJwt(
                _address,
                accountIndex,
                _accountInfos
            );

            const privateKey = keypairVault
                .getKeyPair(accountIndex)
                .export().privateKey;

            const encryptedAccountCustomization =
                await encryptAccountCustomization(
                    _accountInfos[accountIndex],
                    privateKey
                );

            try {
                await saveCustomization(jwt, encryptedAccountCustomization);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Failed saving customizations to server:', error);
            }
        },
        [getCachedJwt, keypairVault]
    );

    const getAccountInfos = useCallback(async () => {
        if (authentication) return;

        if (draftAccountInfos.current.length === 0) {
            draftAccountInfos.current = [
                {
                    index: 0,
                    address: keypairVault.getAddress(0) || '',
                    publicKey: keypairVault
                        .getKeyPair(0)
                        .getPublicKey()
                        .toBase64(),
                },
            ];
        }

        const accountInfosWithAddresses = draftAccountInfos.current.map(
            (accountInfo: AccountInfo) => {
                const address =
                    accountInfo.address ||
                    keypairVault.getAddress(accountInfo.index) ||
                    '';
                return {
                    ...accountInfo,
                    address,
                };
            }
        );
        setAccountInfos(accountInfosWithAddresses);
    }, [authentication, keypairVault]);

    const _saveAccountInfos = useCallback(async () => {
        if (authentication) {
            await Authentication.updateAccountInfos(draftAccountInfos.current);
            await dispatch(saveAccountInfos(draftAccountInfos.current));
            await Authentication.getAccountInfos(true);
        } else {
            await dispatch(clearTokensForNetworkOrWalletSwitch());
            await dispatch(clearBalancesForNetworkOrWalletSwitch());
            await dispatch(saveAccountInfos(draftAccountInfos.current));
            await dispatch(
                saveActiveAccountIndex(draftAccountInfos.current.length - 1)
            );
            getAccountInfos();
        }
    }, [authentication, dispatch, getAccountInfos]);

    const createWallet = useCallback(() => {
        const loadAccFromStorage = async () => {
            const relevantAccountInfos = accountInfos.filter(
                (a) =>
                    a.importedMnemonicIndex === undefined &&
                    a.importedPrivateKeyName === undefined &&
                    a.ledgerAccountIndex === undefined
            );
            const sortedAccountIndices = relevantAccountInfos
                .map((a) => a.index || 0)
                .sort(function (a, b) {
                    return a - b;
                });
            const nextAccountIndex =
                +sortedAccountIndices[sortedAccountIndices.length - 1] + 1;

            let newAccountInfos: AccountInfo[];
            if (authentication) {
                const newAccount = await Authentication.createAccount(
                    nextAccountIndex
                );
                if (newAccount) {
                    newAccount.nickname = `Wallet ${
                        relevantAccountInfos.length + 1
                    }`;
                    newAccount.color = getNextWalletColor(nextAccountIndex);
                    newAccount.emoji = getNextEmoji(nextAccountIndex);
                }
                newAccountInfos = newAccount
                    ? [...accountInfos, newAccount]
                    : accountInfos;

                draftAccountInfos.current = newAccountInfos;
                _saveAccountInfos();
            } else {
                newAccountInfos = [
                    ...accountInfos,
                    {
                        index: nextAccountIndex,
                        nickname: `Wallet ${relevantAccountInfos.length + 1}`,
                        color: getNextWalletColor(nextAccountIndex),
                        emoji: getNextEmoji(nextAccountIndex),
                        address:
                            keypairVault.getAddress(nextAccountIndex) || '',
                        publicKey: keypairVault
                            .getKeyPair(nextAccountIndex)
                            .getPublicKey()
                            .toBase64(),
                    },
                ];

                draftAccountInfos.current = newAccountInfos;
            }

            await Permissions.grantEthosDashboardBasicPermissionsForAccount(
                newAccountInfos[nextAccountIndex].address
            );

            setAccountInfos(newAccountInfos);

            if (customizationsSyncPreference) {
                await handleSaveCustomization(
                    keypairVault.getAddress(nextAccountIndex) || '',
                    newAccountInfos,
                    nextAccountIndex
                );
            }
        };

        const executeWithLoading = async () => {
            setLoading(true);
            await loadAccFromStorage();
            await _saveAccountInfos();
            setLoading(false);
        };
        try {
            executeWithLoading();
        } catch (error) {
            toast(
                <FailAlert text="There was an error creating a new wallet" />
            );
            setLoading(false);
        }
    }, [
        accountInfos,
        authentication,
        customizationsSyncPreference,
        _saveAccountInfos,
        keypairVault,
        handleSaveCustomization,
        setLoading,
    ]);

    useEffect(() => {
        setCreateWallet(() => createWallet);
    }, [createWallet, setCreateWallet, accountInfos]);

    return children;
};

export default CreateWalletProvider;

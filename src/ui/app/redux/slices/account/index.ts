// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { fromHEX } from '@mysten/bcs';
import {
    Ed25519Keypair,
    type SuiAddress,
    type SuiMoveObject,
} from '@mysten/sui.js';
import {
    createAsyncThunk,
    createSelector,
    createSlice,
} from '@reduxjs/toolkit';

import { api, type AppThunkConfig } from '../../store/thunk-extras';
import { suiBalancesAdapterSelectors } from '../balances';
import { NFT } from '../sui-objects/NFT';
import { Ticket } from '../sui-objects/Ticket';
import { isLocked, setLocked, setUnlocked } from '_app/helpers/lock-wallet';
import { clearForNetworkOrWalletSwitch as clearBalancesForNetworkOrWalletSwitch } from '_redux/slices/balances';
import {
    clearForNetworkOrWalletSwitch as clearTokensForNetworkOrWalletSwitch,
    suiObjectsAdapterSelectors,
} from '_redux/slices/sui-objects';
import { Coin } from '_redux/slices/sui-objects/Coin';
import { generateMnemonic } from '_shared/cryptography/mnemonics';
import Authentication from '_src/background/Authentication';
import { PERMISSIONS_STORAGE_KEY } from '_src/background/Permissions';
import { CUSTOMIZE_ID } from '_src/data/dappsMap';
import {
    AccountType,
    MNEMONIC_TEST,
    PASSPHRASE_TEST,
} from '_src/shared/constants';
import {
    deleteEncrypted,
    getEncrypted,
    setEncrypted,
} from '_src/shared/storagex/store';
import KeypairVault from '_src/ui/app/KeypairVault';
import getNextEmoji from '_src/ui/app/helpers/getNextEmoji';
import getNextWalletColor from '_src/ui/app/helpers/getNextWalletColor';
import { AUTHENTICATION_REQUESTED } from '_src/ui/app/pages/initialize/hosted';

import type { AsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '_redux/RootReducer';
import type { AccountInfo } from '_src/ui/app/KeypairVault';

type InitialAccountInfo = {
    authentication: string | null;
    mnemonic: string | null;
    passphrase: string | null;
    accountInfos: AccountInfo[];
    activeAccountIndex: number;
    locked: boolean;
    accountType: AccountType;
    importNames: { mnemonics: string[]; privateKeys: string[] };
};

export const loadAccountInformationFromStorage = createAsyncThunk(
    'account/loadAccountInformation',
    async (_args, { getState }): Promise<InitialAccountInfo> => {
        let activeAccountIndex = 0;

        const accountTypeString = ((await getEncrypted({
            key: 'account-type',
            session: false,
            strong: false,
        })) || AccountType.UNINITIALIZED) as keyof typeof AccountType;
        const accountType = AccountType[accountTypeString];

        let authentication = await getEncrypted({
            key: 'authentication',
            session: true,
            strong: false,
        });

        if (authentication) {
            let accountInfos: AccountInfo[] = [];
            if (authentication !== AUTHENTICATION_REQUESTED) {
                Authentication.set(authentication);
                accountInfos = await Authentication.getAccountInfos();
                activeAccountIndex = parseInt(
                    (await getEncrypted({
                        key: 'activeAccountIndex',
                        session: false,
                        strong: false,
                    })) || '0'
                );

                if (!accountInfos || !accountInfos.length) {
                    authentication = null;
                }

                if (activeAccountIndex >= (accountInfos?.length || 0)) {
                    activeAccountIndex = (accountInfos?.length || 1) - 1;
                }
            }

            return {
                authentication: authentication || null,
                passphrase: null,
                mnemonic: null,
                accountInfos,
                activeAccountIndex,
                locked: false,
                accountType,
                importNames: {
                    mnemonics: [],
                    privateKeys: [],
                },
            };
        }

        const passphrase = await getEncrypted({
            key: 'passphrase',
            session: true,
            strong: false,
        });

        if (!passphrase || passphrase.length === 0) {
            return {
                authentication: null,
                passphrase: null,
                mnemonic: null,
                accountInfos: [],
                activeAccountIndex: 0,
                locked: false,
                accountType,
                importNames: {
                    mnemonics: [],
                    privateKeys: [],
                },
            };
        }

        const mnemonic = await getEncrypted({
            key: 'mnemonic',
            session: false,
            passphrase,
            strong: true,
        });
        let accountInfos: AccountInfo[] = JSON.parse(
            (await getEncrypted({
                key: 'accountInfos',
                session: false,
                strong: false,
            })) || '[]'
        );
        const importNames = JSON.parse(
            (await getEncrypted({
                key: 'importNames',
                session: false,
                strong: false,
                passphrase,
            })) || '{ "mnemonics": [], "privateKeys": [] }'
        );

        activeAccountIndex = parseInt(
            (await getEncrypted({
                key: 'activeAccountIndex',
                session: false,
                strong: false,
            })) || '0'
        );

        if (!accountInfos.find((a) => a.index === activeAccountIndex)) {
            activeAccountIndex = accountInfos[0]?.index ?? 0;
        }

        if (mnemonic) {
            const keypairVault = new KeypairVault();
            keypairVault.mnemonic = mnemonic;

            let activeSeed: { address: string; seed: string } | undefined =
                undefined;
            if (accountInfos.length === 0) {
                accountInfos = [
                    {
                        index: 0,
                        name: 'Wallet',
                        color: getNextWalletColor(0),
                        emoji: getNextEmoji(0),
                        address: keypairVault.getAddress(0) ?? '',
                    },
                ];
                activeSeed = {
                    address: keypairVault.getAddress(0) ?? '',
                    seed: (keypairVault.getSeed(0) ?? '').toString(),
                };
            } else {
                for (let i = 0; i < accountInfos.length; i++) {
                    if (
                        accountInfos[i].importedMnemonicName ||
                        accountInfos[i].importedPrivateKeyName ||
                        accountInfos[i].importedLedgerIndex !== undefined
                    ) {
                        continue;
                    }
                    accountInfos[i].address = keypairVault.getAddress(i) ?? '';
                }

                const activeAccount = accountInfos.find(
                    (a) => a.index === activeAccountIndex
                );

                if (activeAccount?.importedMnemonicName) {
                    const importedKeyPairVault = new KeypairVault();

                    const importedMnemonic = await getEncrypted({
                        key: `importedMnemonic${activeAccount.importedMnemonicName}`,
                        session: false,
                        strong: true,
                        passphrase,
                    });

                    if (importedMnemonic) {
                        importedKeyPairVault.mnemonic = importedMnemonic;

                        const index = activeAccount.importedMnemonicIndex;
                        activeSeed = {
                            address:
                                importedKeyPairVault.getAddress(index) ?? '',
                            seed: (
                                importedKeyPairVault.getSeed(index) || ''
                            ).toString(),
                        };
                    }
                } else if (activeAccount?.importedPrivateKeyName) {
                    const importedPrivateKey = await getEncrypted({
                        key: `importedPrivateKey${activeAccount.importedPrivateKeyName}`,
                        session: false,
                        strong: true,
                        passphrase,
                    });

                    if (importedPrivateKey) {
                        const secretKey = fromHEX(importedPrivateKey);
                        const importedKeyPair =
                            Ed25519Keypair.fromSecretKey(secretKey);

                        activeSeed = {
                            address: importedKeyPair
                                .getPublicKey()
                                .toSuiAddress(),
                            seed: secretKey.toString(),
                        };
                    }
                } else if (activeAccount?.importedLedgerIndex !== undefined) {
                    activeSeed = undefined;
                } else {
                    activeSeed = {
                        address:
                            keypairVault.getAddress(activeAccountIndex) ?? '',
                        seed: (
                            keypairVault.getSeed(activeAccountIndex) || ''
                        ).toString(),
                    };
                }
            }

            await setEncrypted({
                key: 'accountInfos',
                value: JSON.stringify(accountInfos),
                session: false,
                strong: false,
            });
            await setEncrypted({
                key: 'activeSeed',
                value: JSON.stringify(activeSeed ?? '{}'),
                session: true,
                strong: false,
            });
        }

        const {
            account: { locked: alreadyLocked },
        } = getState() as RootState;

        // TODO: This seems unnecessary; if the redux state is locked, we shouldn't have to then delete the data.
        //  Deleting the data happens first, and later the redux state is updated
        if (alreadyLocked) {
            await setLocked(passphrase);
        }

        if (await isLocked(passphrase)) {
            return {
                authentication: null,
                passphrase: passphrase || null,
                mnemonic: mnemonic || null,
                accountInfos,
                activeAccountIndex,
                locked: true,
                accountType,
                importNames,
            };
        }

        return {
            authentication: authentication || null,
            passphrase: passphrase || null,
            mnemonic: mnemonic || null,
            accountInfos,
            activeAccountIndex,
            locked: false,
            accountType,
            importNames,
        };
    }
);

export const getEmail = createAsyncThunk(
    'account/getEmail',
    async (): Promise<string | null> => {
        return await getEncrypted({
            key: 'email',
            session: false,
            strong: false,
        });
    }
);

export const createMnemonic = createAsyncThunk(
    'account/createMnemonic',
    async (
        {
            existingMnemonic,
            name,
        }: { existingMnemonic?: string; name?: string },
        { getState }
    ): Promise<string | null> => {
        const mnemonic = existingMnemonic || generateMnemonic();

        const {
            account: { passphrase },
        } = getState() as RootState;

        if (passphrase) {
            await setEncrypted({
                key: `mnemonic`,
                value: mnemonic,
                session: false,
                strong: true,
                passphrase,
            });

            await setEncrypted({
                key: 'mnemonic-test',
                value: MNEMONIC_TEST,
                session: false,
                strong: false,
                passphrase: mnemonic,
            });
        }

        return mnemonic;
    }
);

export const saveImportedMnemonic = createAsyncThunk(
    'account/saveImportedMnemonic',
    async (
        { mnemonic, name }: { mnemonic: string; name: string },
        { getState }
    ): Promise<string | null> => {
        const {
            account: { passphrase, importNames },
        } = getState() as RootState;
        const mutableImportNames = JSON.parse(JSON.stringify(importNames));

        if (passphrase) {
            if (name) {
                mutableImportNames.mnemonics.push(name);
                await setEncrypted({
                    key: 'importNames',
                    value: JSON.stringify(mutableImportNames),
                    session: false,
                    strong: false,
                    passphrase,
                });
            }

            await setEncrypted({
                key: `importedMnemonic${name ?? ''}`,
                value: mnemonic,
                session: false,
                strong: true,
                passphrase,
            });
        }

        return name;
    }
);

export const saveImportedPrivateKey = createAsyncThunk(
    'account/saveImportedPrivateKey',
    async (
        { privateKey, name }: { privateKey: string; name: string },
        { getState }
    ): Promise<string | null> => {
        const {
            account: { passphrase, importNames },
        } = getState() as RootState;
        const mutableImportNames = JSON.parse(JSON.stringify(importNames));

        if (passphrase) {
            if (name) {
                mutableImportNames.privateKeys.push(name);
                await setEncrypted({
                    key: `importNames`,
                    value: JSON.stringify(mutableImportNames),
                    session: false,
                    strong: false,
                    passphrase,
                });
            }

            await setEncrypted({
                key: `importedPrivateKey${name ?? ''}`,
                value: privateKey,
                session: false,
                strong: true,
                passphrase,
            });
        }

        return name;
    }
);

export const getImportedMnemonic = createAsyncThunk(
    'account/getImportedMnemonic',
    async (
        { name }: { name: string },
        { getState }
    ): Promise<string | null> => {
        const {
            account: { passphrase },
        } = getState() as RootState;

        if (passphrase) {
            const mnemonic = await getEncrypted({
                key: `importedMnemonic${name ?? ''}`,
                session: false,
                strong: true,
                passphrase,
            });

            return mnemonic;
        }

        return null;
    }
);

export const getImportedPrivateKey = createAsyncThunk(
    'account/getImportedPrivateKey',
    async (
        { name }: { name: string },
        { getState }
    ): Promise<string | null> => {
        const {
            account: { passphrase },
        } = getState() as RootState;

        if (passphrase) {
            const privateKey = await getEncrypted({
                key: `importedPrivateKey${name ?? ''}`,
                session: false,
                strong: true,
                passphrase,
            });

            return privateKey;
        }

        return null;
    }
);

export const deleteImportedMnemonic = createAsyncThunk(
    'account/deleteImportedMnemonic',
    async ({ name }: { name: string }, { getState }) => {
        const {
            account: { passphrase, importNames, accountInfos },
        } = getState() as RootState;

        if (passphrase) {
            const mutableImportNames = JSON.parse(JSON.stringify(importNames));
            let mutableAccountInfos = JSON.parse(JSON.stringify(accountInfos));

            mutableImportNames.mnemonics = mutableImportNames.mnemonics.filter(
                (mnemonicName: string) => mnemonicName !== name
            );

            mutableAccountInfos = mutableAccountInfos.filter(
                (accountInfo: AccountInfo) =>
                    accountInfo.importedMnemonicName !== name
            );

            await setEncrypted({
                key: 'importNames',
                value: JSON.stringify(mutableImportNames),
                session: false,
                strong: false,
                passphrase,
            });

            await deleteEncrypted({
                key: `importedMnemonic${name ?? ''}`,
                session: false,
                strong: true,
                passphrase,
            });

            await setEncrypted({
                key: 'accountInfos',
                value: JSON.stringify(mutableAccountInfos),
                session: false,
                strong: false,
            });

            return {
                importNames: mutableImportNames,
                accountInfos: mutableAccountInfos,
            };
        }

        return null;
    }
);

export const deleteImportedPrivateKey = createAsyncThunk(
    'account/deleteImportedPrivateKey',
    async ({ name }: { name: string }, { getState }) => {
        const {
            account: { passphrase, importNames, accountInfos },
        } = getState() as RootState;

        if (passphrase) {
            const mutableImportNames = JSON.parse(JSON.stringify(importNames));
            let mutableAccountInfos = JSON.parse(JSON.stringify(accountInfos));

            mutableImportNames.privateKeys =
                mutableImportNames.privateKeys.filter(
                    (privateKey: string) => privateKey !== name
                );

            mutableAccountInfos = mutableAccountInfos.filter(
                (accountInfo: AccountInfo) =>
                    accountInfo.importedPrivateKeyName !== name
            );

            await setEncrypted({
                key: 'importNames',
                value: JSON.stringify(mutableImportNames),
                session: false,
                strong: false,
                passphrase,
            });

            await deleteEncrypted({
                key: `importedPrivateKey${name ?? ''}`,
                session: false,
                strong: true,
                passphrase,
            });

            await setEncrypted({
                key: 'accountInfos',
                value: JSON.stringify(mutableAccountInfos),
                session: false,
                strong: false,
            });

            return {
                importNames: mutableImportNames,
                accountInfos: mutableAccountInfos,
            };
        }

        return null;
    }
);

export const saveAuthentication = createAsyncThunk(
    'account/setAuthentication',
    async (authentication: string | null, { getState }) => {
        if (!authentication) {
            await deleteEncrypted({
                key: 'authentication',
                session: true,
                strong: false,
            });
        } else {
            await setEncrypted({
                key: 'authentication',
                value: authentication,
                strong: false,
                session: true,
            });

            await setEncrypted({
                key: 'account-type',
                value: AccountType.EMAIL,
                strong: false,
                session: false,
            });
        }
        return authentication;
    }
);

export const saveAccountInfos = createAsyncThunk(
    'account/setAccountInfos',
    async (accountInfos: AccountInfo[]): Promise<AccountInfo[]> => {
        await setEncrypted({
            key: 'accountInfos',
            value: JSON.stringify(accountInfos),
            session: false,
            strong: false,
        });
        return accountInfos;
    }
);

export const saveActiveAccountIndex = createAsyncThunk(
    'account/setActiveAccountIndex',
    async (activeAccountIndex: number, { getState }): Promise<number> => {
        await setEncrypted({
            key: 'activeAccountIndex',
            value: activeAccountIndex.toString(),
            session: false,
            strong: false,
        });
        await clearTokensForNetworkOrWalletSwitch();
        await clearBalancesForNetworkOrWalletSwitch();
        api.resetSignerInstance();
        return activeAccountIndex;
    }
);

export const saveEmail = createAsyncThunk(
    'account/setEmail',
    async (email: string | null) => {
        if (!email) {
            await deleteEncrypted({
                key: 'email',
                session: false,
                strong: false,
            });
        } else {
            await setEncrypted({
                key: 'email',
                value: email,
                strong: false,
                session: false,
            });
        }
        return email;
    }
);

export const changePassword: AsyncThunk<
    boolean,
    { currentPassword: string; newPassword: string },
    AppThunkConfig
> = createAsyncThunk<
    boolean,
    { currentPassword: string; newPassword: string },
    AppThunkConfig
>(
    'account/changePassword',
    async (
        { currentPassword, newPassword },
        { extra: { keypairVault }, getState }
    ) => {
        if (!isPasswordCorrect(currentPassword)) {
            return false;
        }

        const {
            account: { mnemonic, importNames },
        } = getState() as RootState;

        if (mnemonic) {
            await deleteEncrypted({
                key: 'mnemonic',
                session: false,
                strong: true,
                passphrase: currentPassword,
            });
            await setEncrypted({
                key: 'mnemonic',
                value: mnemonic,
                session: false,
                strong: true,
                passphrase: newPassword,
            });
        }

        for (const name of importNames.mnemonics) {
            const importedMnemonic = await getEncrypted({
                key: `importedMnemonic${name}`,
                session: false,
                strong: true,
                passphrase: currentPassword,
            });
            if (importedMnemonic) {
                await deleteEncrypted({
                    key: `importedMnemonic${name}`,
                    session: false,
                    strong: true,
                    passphrase: currentPassword,
                });
                await setEncrypted({
                    key: `importedMnemonic${name}`,
                    value: importedMnemonic,
                    session: false,
                    strong: true,
                    passphrase: newPassword,
                });
            }
        }

        for (const name of importNames.privateKeys) {
            const importedPrivateKey = await getEncrypted({
                key: `importedPrivateKey${name}`,
                session: false,
                strong: true,
                passphrase: currentPassword,
            });
            if (importedPrivateKey) {
                await deleteEncrypted({
                    key: `importedPrivateKey${name}`,
                    session: false,
                    strong: true,
                    passphrase: currentPassword,
                });
                await setEncrypted({
                    key: `importedPrivateKey${name}`,
                    value: importedPrivateKey,
                    session: false,
                    strong: true,
                    passphrase: newPassword,
                });
            }
        }

        await deleteEncrypted({
            key: 'importNames',
            session: false,
            strong: false,
            passphrase: currentPassword,
        });
        await setEncrypted({
            key: 'importNames',
            value: JSON.stringify(importNames),
            session: false,
            strong: false,
            passphrase: newPassword,
        });

        await deleteEncrypted({
            key: 'passphrase',
            session: true,
            strong: false,
            passphrase: currentPassword,
        });
        await setEncrypted({
            key: 'passphrase',
            value: newPassword,
            strong: false,
            session: true,
        });

        await deleteEncrypted({
            key: 'passphrase-test',
            session: false,
            strong: false,
            passphrase: currentPassword,
        });
        await setEncrypted({
            key: 'passphrase-test',
            value: PASSPHRASE_TEST,
            session: false,
            strong: false,
            passphrase: newPassword,
        });

        await setLocked(currentPassword);
        await setUnlocked(newPassword);

        return true;
    }
);

export const savePassphrase: AsyncThunk<
    string | null,
    string | null,
    AppThunkConfig
> = createAsyncThunk<string | null, string | null, AppThunkConfig>(
    'account/setPassphrase',
    async (passphrase, { extra: { keypairVault }, getState }) => {
        if (!passphrase) {
            deleteEncrypted({
                key: 'passphrase',
                session: true,
                strong: false,
            });
            return null;
        }

        await setEncrypted({
            key: 'passphrase',
            value: passphrase,
            strong: false,
            session: true,
        });

        await setEncrypted({
            key: 'passphrase-test',
            value: PASSPHRASE_TEST,
            session: false,
            strong: false,
            passphrase,
        });

        await setEncrypted({
            key: 'account-type',
            value: AccountType.PASSWORD,
            strong: false,
            session: false,
        });

        await setUnlocked(passphrase);

        const {
            account: { mnemonic },
        } = getState() as RootState;

        if (passphrase && mnemonic) {
            await setEncrypted({
                key: 'mnemonic',
                value: mnemonic,
                session: false,
                strong: true,
                passphrase,
            });

            await setEncrypted({
                key: 'accountInfos',
                value: JSON.stringify([
                    {
                        index: 0,
                        name: 'Wallet',
                        color: getNextWalletColor(0),
                        emoji: getNextEmoji(0),
                        address: keypairVault.getAddress() || '',
                    },
                ]),
                session: false,
                strong: false,
            });

            await setEncrypted({
                key: 'seeds',
                value: JSON.stringify([
                    {
                        address: keypairVault.getAddress() || '',
                        seed: (keypairVault.getSeed() || '').toString(),
                    },
                ]),
                session: true,
                strong: false,
            });
        }
        return passphrase;
    }
);

export const reset = createAsyncThunk(
    'account/reset',
    async (_args, { getState }): Promise<void> => {
        const {
            account: { passphrase, importNames },
        } = getState() as RootState;
        if (passphrase) {
            for (const name of importNames.mnemonics || []) {
                await deleteEncrypted({
                    key: `importedMnemonic${name}`,
                    passphrase,
                    session: false,
                    strong: true,
                });
            }
            for (const name of importNames.privateKeys || []) {
                await deleteEncrypted({
                    key: `importedPrivateKey${name}`,
                    passphrase,
                    session: false,
                    strong: true,
                });
            }
            await deleteEncrypted({
                key: 'importNames',
                session: false,
                strong: false,
                passphrase,
            });
            await deleteEncrypted({
                key: 'passphrase',
                session: true,
                strong: false,
            });
            await deleteEncrypted({
                key: 'mnemonic',
                passphrase,
                session: false,
                strong: true,
            });
            await deleteEncrypted({
                key: 'accountInfos',
                session: false,
                strong: false,
            });
            await deleteEncrypted({
                key: 'activeSeed',
                session: true,
                strong: false,
            });
        }
        await deleteEncrypted({
            key: 'authentication',
            session: true,
            strong: false,
        });
        await deleteEncrypted({ key: 'email', session: false, strong: false });
        await deleteEncrypted({
            key: 'activeAccountIndex',
            session: false,
            strong: false,
        });
        await deleteEncrypted({
            key: PERMISSIONS_STORAGE_KEY,
            session: false,
            strong: false,
        });
        await deleteEncrypted({
            key: 'account-type',
            session: false,
            strong: false,
        });

        window.location.reload();
    }
);

const isPasswordCorrect = async (password: string) => {
    const passphraseTest = await getEncrypted({
        key: 'passphrase-test',
        session: false,
        passphrase: password,
        strong: false,
    });

    if (passphraseTest !== PASSPHRASE_TEST) return false;

    return true;
};

const isMnemonicCorrect = async (mnemonic: string) => {
    const mnemonicTest = await getEncrypted({
        key: 'mnemonic-test',
        session: false,
        passphrase: mnemonic,
        strong: false,
    });

    if (mnemonicTest !== MNEMONIC_TEST) return false;

    return true;
};

export const assertPasswordIsCorrect: AsyncThunk<
    boolean,
    string | null,
    AppThunkConfig
> = createAsyncThunk<boolean, string | null, AppThunkConfig>(
    'account/assertPasswordIsCorrect',
    async (passphrase): Promise<boolean> => {
        return await isPasswordCorrect(passphrase || '');
    }
);

export const unlock: AsyncThunk<string | null, string | null, AppThunkConfig> =
    createAsyncThunk<string | null, string | null, AppThunkConfig>(
        'account/unlock',
        async (passphrase): Promise<string | null> => {
            if (passphrase) {
                const isCorrect = await isPasswordCorrect(passphrase);
                if (isCorrect) {
                    await setEncrypted({
                        key: 'passphrase',
                        value: passphrase,
                        strong: false,
                        session: true,
                    });

                    setUnlocked(passphrase);
                    return passphrase;
                }
            }
            return null;
        }
    );

export const assertMnemonicIsCorrect: AsyncThunk<
    boolean,
    string,
    AppThunkConfig
> = createAsyncThunk<boolean, string, AppThunkConfig>(
    'account/assertMnemonicIsCorrect',
    async (mnemonic): Promise<boolean> => {
        return await isMnemonicCorrect(mnemonic);
    }
);

export const loadFavoriteDappsKeysFromStorage = createAsyncThunk(
    'account/getFavoriteDappsKeys',
    async (): Promise<string[]> => {
        const favoriteDappsKeys = JSON.parse(
            (await getEncrypted({
                key: 'favoriteDappsKeys',
                session: false,
                strong: false,
            })) || '[]'
        );

        return favoriteDappsKeys;
    }
);

export const saveFavoriteDappsKeys = createAsyncThunk(
    'account/setFavoriteDappsKeys',
    async (favoriteDappsKeys: string[]): Promise<string[]> => {
        if (!favoriteDappsKeys.includes(CUSTOMIZE_ID)) {
            favoriteDappsKeys.push(CUSTOMIZE_ID);
        }

        await setEncrypted({
            key: 'favoriteDappsKeys',
            value: JSON.stringify(favoriteDappsKeys),
            session: false,
            strong: false,
        });

        return favoriteDappsKeys;
    }
);

export const loadExcludedDappsKeysFromStorage = createAsyncThunk(
    'account/getExcludedDappsKeys',
    async (): Promise<string[]> => {
        const excludedFavoriteDappsKeys = JSON.parse(
            (await getEncrypted({
                key: 'excludedDappsKeys',
                session: false,
                strong: false,
            })) || '[]'
        );

        return excludedFavoriteDappsKeys;
    }
);

export const saveExcludedDappsKeys = createAsyncThunk(
    'account/saveExcludedDappsKeys',
    async (excludedDappsKeys: string[]): Promise<string[]> => {
        await setEncrypted({
            key: 'excludedDappsKeys',
            value: JSON.stringify(excludedDappsKeys),
            session: false,
            strong: false,
        });

        return excludedDappsKeys;
    }
);

type AccountState = {
    loading: boolean;
    authentication: string | null;
    email: string | null;
    mnemonic: string | null;
    passphrase: string | null;
    creating: boolean;
    createdMnemonic: string | null;
    address: SuiAddress | null;
    accountInfos: AccountInfo[];
    activeAccountIndex: number;
    accountType: AccountType;
    locked: boolean;
    favoriteDappsKeys: string[];
    excludedDappsKeys: string[];
    importNames: { mnemonics: string[]; privateKeys: string[] };
    ledgerConnected: boolean;
};

const initialState: AccountState = {
    loading: true,
    authentication: null,
    email: null,
    mnemonic: null,
    passphrase: null,
    creating: false,
    createdMnemonic: null,
    address: null,
    accountInfos: [],
    activeAccountIndex: 0,
    accountType: AccountType.UNINITIALIZED,
    locked: false,
    favoriteDappsKeys: [],
    excludedDappsKeys: [],
    importNames: {
        mnemonics: [],
        privateKeys: [],
    },
    ledgerConnected: false,
};

const accountSlice = createSlice({
    name: 'account',
    initialState,
    reducers: {
        setMnemonic: (state, action: PayloadAction<string | null>) => {
            state.mnemonic = action.payload;
        },
        changePassword: (state, action: PayloadAction<string | null>) => {
            state.passphrase = action.payload;
        },
        setPassphrase: (state, action: PayloadAction<string | null>) => {
            state.passphrase = action.payload;
        },
        setAddress: (state, action: PayloadAction<string | null>) => {
            state.address = action.payload;
        },
        setAuthentication: (state, action: PayloadAction<string | null>) => {
            state.authentication = action.payload;
        },
        setAccountInfos: (state, action: PayloadAction<AccountInfo[]>) => {
            state.accountInfos = action.payload;
        },
        setActiveAccountIndex: (state, action: PayloadAction<number>) => {
            state.activeAccountIndex = action.payload;
        },
        setEmail: (state, action: PayloadAction<string | null>) => {
            state.email = action.payload;
        },
        lockWalletUI: (state, action: PayloadAction<boolean>) => {
            if (action.payload) {
                state.authentication = null;
            } else {
                state.locked = true;
            }
        },
    },
    extraReducers: (builder) =>
        builder
            .addCase(
                loadAccountInformationFromStorage.fulfilled,
                (state, action) => {
                    state.loading = false;
                    state.authentication = action.payload.authentication;
                    state.passphrase = action.payload.passphrase;
                    state.mnemonic = action.payload.mnemonic;
                    state.accountInfos = action.payload.accountInfos;
                    state.activeAccountIndex =
                        action.payload.activeAccountIndex || 0;

                    state.address =
                        state.accountInfos.find(
                            (accountInfo) =>
                                (accountInfo.index || 0) ===
                                state.activeAccountIndex
                        )?.address || null;
                    state.accountType = action.payload.accountType;
                    state.importNames = action.payload.importNames;
                    state.locked = action.payload.locked;
                }
            )
            .addCase(createMnemonic.pending, (state) => {
                state.creating = true;
            })
            .addCase(createMnemonic.fulfilled, (state, action) => {
                state.creating = false;
                state.createdMnemonic = action.payload;
            })
            .addCase(createMnemonic.rejected, (state) => {
                state.creating = false;
                state.createdMnemonic = null;
            })
            .addCase(savePassphrase.fulfilled, (state, action) => {
                state.passphrase = action.payload;
            })
            .addCase(saveAccountInfos.fulfilled, (state, action) => {
                state.accountInfos = action.payload;
            })
            .addCase(saveActiveAccountIndex.fulfilled, (state, action) => {
                state.activeAccountIndex = action.payload;
                state.address =
                    state.accountInfos.find(
                        (accountInfo: AccountInfo) =>
                            (accountInfo.index || 0) ===
                            state.activeAccountIndex
                    )?.address || null;
            })
            .addCase(saveAuthentication.fulfilled, (state, action) => {
                state.authentication = action.payload;
            })
            .addCase(saveEmail.fulfilled, (state, action) => {
                state.email = action.payload;
            })
            .addCase(assertMnemonicIsCorrect.fulfilled, (state, action) => {
                state.loading = false;
            })
            .addCase(unlock.fulfilled, (state, action) => {
                state.locked = !action.payload;
                if (!state.locked) {
                    state.loading = true;
                }
                state.passphrase = action.payload;
            })
            .addCase(
                loadFavoriteDappsKeysFromStorage.fulfilled,
                (state, action) => {
                    state.favoriteDappsKeys = action.payload;
                }
            )
            .addCase(
                loadExcludedDappsKeysFromStorage.fulfilled,
                (state, action) => {
                    state.excludedDappsKeys = action.payload;
                }
            )
            .addCase(saveFavoriteDappsKeys.fulfilled, (state, action) => {
                state.favoriteDappsKeys = action.payload;
            })
            .addCase(saveExcludedDappsKeys.fulfilled, (state, action) => {
                state.excludedDappsKeys = action.payload;
            })
            .addCase(saveImportedMnemonic.fulfilled, (state, action) => {
                state.importNames.mnemonics.push(action.payload || '');
            })
            .addCase(saveImportedPrivateKey.fulfilled, (state, action) => {
                state.importNames.privateKeys.push(action.payload || '');
            })
            .addCase(deleteImportedMnemonic.fulfilled, (state, action) => {
                if (action.payload) {
                    state.importNames = action.payload.importNames;
                    state.accountInfos = action.payload.accountInfos;

                    const activeAccountIndex = state.accountInfos.findIndex(
                        (accountInfo) => accountInfo.address === state.address
                    );

                    if (activeAccountIndex === -1) {
                        state.address = state.accountInfos[0]?.address || null;
                        state.activeAccountIndex =
                            state.accountInfos[0]?.index || 0;
                    }
                }
            })
            .addCase(deleteImportedPrivateKey.fulfilled, (state, action) => {
                if (action.payload) {
                    state.importNames = action.payload.importNames;
                    state.accountInfos = action.payload.accountInfos;

                    const activeAccountIndex = state.accountInfos.findIndex(
                        (accountInfo) => accountInfo.address === state.address
                    );

                    if (activeAccountIndex === -1) {
                        state.address = state.accountInfos[0]?.address || null;
                        state.activeAccountIndex =
                            state.accountInfos[0]?.index || 0;
                    }
                }
            }),
});

export const { setMnemonic, setAddress, setAccountInfos, lockWalletUI } =
    accountSlice.actions;

export default accountSlice.reducer;

export const activeAccountSelector = ({ account }: RootState) =>
    account.address;

export const ownedObjects = createSelector(
    suiObjectsAdapterSelectors.selectAll,
    activeAccountSelector,
    (objects, address) => {
        if (address) {
            return objects.filter(
                ({ owner }) =>
                    typeof owner === 'object' &&
                    ('ObjectOwner' in owner ||
                        ('AddressOwner' in owner &&
                            owner.AddressOwner === address))
            );
        }
        return [];
    }
);

export const balances = createSelector(
    suiBalancesAdapterSelectors.selectAll,
    activeAccountSelector,
    (balances) => balances
);

export const accountCoinsSelector = createSelector(
    ownedObjects,
    (allSuiObjects) => {
        return allSuiObjects
            .filter(Coin.isCoin)
            .map((aCoin) => aCoin.content as SuiMoveObject);
    }
);

export const accountAggregateBalancesSelector = createSelector(
    balances,
    (balances) =>
        balances.reduce((acc, balance) => {
            acc[balance.coinType] = BigInt(balance.totalBalance);
            return acc;
        }, {} as Record<string, bigint>)
);

// return a list of balances for each coin object for each coin type
export const accountItemizedBalancesSelector = createSelector(
    accountCoinsSelector,
    (coins) => {
        return coins.reduce((acc, aCoin) => {
            const coinType = Coin.getCoinTypeArg(aCoin);
            if (coinType) {
                if (typeof acc[coinType] === 'undefined') {
                    acc[coinType] = [];
                }
                acc[coinType].push(Coin.getBalance(aCoin));
            }
            return acc;
        }, {} as Record<string, bigint[]>);
    }
);

export const accountNftsSelector = createSelector(
    ownedObjects,
    (allSuiObjects) => {
        return allSuiObjects.filter(
            (anObj) => !Coin.isCoin(anObj) && NFT.isNFT(anObj)
        );
    }
);

export const accountTicketsSelector = createSelector(
    ownedObjects,
    (allSuiObjects) => {
        return allSuiObjects.filter(
            (anObj) => !Coin.isCoin(anObj) && Ticket.isTicket(anObj) && anObj
        );
    }
);

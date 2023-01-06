// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import {
    createAsyncThunk,
    createSelector,
    createSlice,
} from '@reduxjs/toolkit';

import {
    clearForNetworkOrWalletSwitch,
    suiObjectsAdapterSelectors,
} from '_redux/slices/sui-objects';
import { Coin } from '_redux/slices/sui-objects/Coin';
import { generateMnemonic } from '_shared/cryptography/mnemonics';
import Authentication from '_src/background/Authentication';
import { PERMISSIONS_STORAGE_KEY } from '_src/background/Permissions';
import {
    getEncrypted,
    setEncrypted,
    deleteEncrypted,
} from '_src/shared/storagex/store';
import KeypairVault from '_src/ui/app/KeypairVault';
import getNextEmoji from '_src/ui/app/helpers/getNextEmoji';
import getNextWalletColor from '_src/ui/app/helpers/getNextWalletColor';
import { AUTHENTICATION_REQUESTED } from '_src/ui/app/pages/initialize/hosted';

import type { AppThunkConfig } from '../../store/thunk-extras';
import type { SuiAddress, SuiMoveObject } from '@mysten/sui.js';
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
};

export const LOCKED = 'locked';

export const loadAccountInformationFromStorage = createAsyncThunk(
    'account/loadAccountInformation',
    async (_args, { getState }): Promise<InitialAccountInfo> => {
        let activeAccountIndex = 0;

        let authentication = await getEncrypted('authentication');

        if (authentication) {
            let accountInfos: AccountInfo[] = [];
            if (authentication !== AUTHENTICATION_REQUESTED) {
                Authentication.set(authentication);
                accountInfos = await Authentication.getAccountInfos();
                activeAccountIndex = parseInt(
                    (await getEncrypted(
                        'activeAccountIndex',
                        authentication
                    )) || '0'
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
            };
        }

        const passphrase = await getEncrypted('passphrase');
        if (!passphrase || passphrase.length === 0) {
            return {
                authentication: null,
                passphrase: null,
                mnemonic: null,
                accountInfos: [],
                activeAccountIndex: 0,
                locked: false,
            };
        }

        const mnemonic = await getEncrypted('mnemonic', passphrase);
        let accountInfos = JSON.parse(
            (await getEncrypted('accountInfos', passphrase)) || '[]'
        );

        if (accountInfos.length === 0 && mnemonic) {
            const keypairVault = new KeypairVault();
            keypairVault.mnemonic = mnemonic;
            accountInfos = [
                {
                    index: 0,
                    name: 'Wallet',
                    color: getNextWalletColor(0),
                    emoji: getNextEmoji(0),
                    address: keypairVault.getAddress(0),
                    seed: (keypairVault.getSeed(0) || '').toString(),
                },
            ];
            await setEncrypted(
                'accountInfos',
                JSON.stringify(accountInfos),
                passphrase
            );
        }

        activeAccountIndex = parseInt(
            (await getEncrypted('activeAccountIndex', passphrase)) || '0'
        );

        if (activeAccountIndex >= (accountInfos?.length || 0)) {
            activeAccountIndex = (accountInfos?.length || 1) - 1;
        }

        const {
            account: { locked: alreadyLocked },
        } = getState() as RootState;

        if (alreadyLocked) {
            await deleteEncrypted(LOCKED, passphrase);
        }

        const locked = await getEncrypted(LOCKED, passphrase);
        if (!locked || locked !== `${LOCKED}${passphrase}`) {
            return {
                authentication: null,
                passphrase: passphrase || null,
                mnemonic: mnemonic || null,
                accountInfos,
                activeAccountIndex,
                locked: true,
            };
        }

        return {
            authentication: authentication || null,
            passphrase: passphrase || null,
            mnemonic: mnemonic || null,
            accountInfos,
            activeAccountIndex,
            locked: false,
        };
    }
);

export const getEmail = createAsyncThunk(
    'account/getEmail',
    async (): Promise<string | null> => {
        return await getEncrypted('email');
    }
);

export const createMnemonic = createAsyncThunk(
    'account/createMnemonic',
    async (
        existingMnemonic: string | undefined,
        { getState }
    ): Promise<string | null> => {
        const mnemonic = existingMnemonic || generateMnemonic();

        const {
            account: { passphrase },
        } = getState() as RootState;
        if (passphrase) {
            await setEncrypted('mnemonic', mnemonic, passphrase);
        }

        return mnemonic;
    }
);

export const saveAuthentication = createAsyncThunk(
    'account/setAuthentication',
    async (authentication: string | null, { getState }) => {
        if (!authentication) {
            await deleteEncrypted('authentication');
        } else {
            await setEncrypted('authentication', authentication);
        }
        return authentication;
    }
);

export const saveAccountInfos = createAsyncThunk(
    'account/setAccountInfos',
    async (
        accountInfos: AccountInfo[],
        { getState }
    ): Promise<AccountInfo[]> => {
        const {
            account: { passphrase },
        } = getState() as RootState;

        if (passphrase) {
            console.log('SETTING ENCRYPTED ACCINFOS in saveAccountInfos');

            await setEncrypted(
                'accountInfos',
                JSON.stringify(accountInfos),
                passphrase
            );
        }

        return accountInfos;
    }
);

export const saveActiveAccountIndex = createAsyncThunk(
    'account/setActiveAccountIndex',
    async (activeAccountIndex: number, { getState }): Promise<number> => {
        const {
            account: { passphrase, authentication },
        } = getState() as RootState;
        await setEncrypted(
            'activeAccountIndex',
            activeAccountIndex.toString(),
            passphrase || authentication || undefined
        );
        await clearForNetworkOrWalletSwitch();
        return activeAccountIndex;
    }
);

export const saveEmail = createAsyncThunk(
    'account/setEmail',
    async (email: string | null) => {
        if (!email) {
            await deleteEncrypted('email');
        } else {
            await setEncrypted('email', email);
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

        // First, decrypt the existing data with the current password
        // Then, encrypt it with the new password
        const {
            account: { mnemonic },
        } = getState() as RootState;

        if (mnemonic) {
            await deleteEncrypted('mnemonic');
            await setEncrypted('mnemonic', mnemonic, newPassword);
        }

        const authentication = await getEncrypted(
            'authentication',
            currentPassword
        );
        if (authentication) {
            await deleteEncrypted('authentication');
            await setEncrypted('authentication', newPassword);
        }

        const email = await getEncrypted('email', currentPassword);
        if (email) {
            await deleteEncrypted('email');
            await setEncrypted('email', newPassword);
        }

        const accountInfos = JSON.parse(
            (await getEncrypted('accountInfos', currentPassword)) || '[]'
        );
        await deleteEncrypted('accountInfos');
        await setEncrypted(
            'accountInfos',
            JSON.stringify(accountInfos),
            newPassword
        );

        const activeAccountIndex = parseInt(
            (await getEncrypted('activeAccountIndex', currentPassword)) || '0'
        );
        await deleteEncrypted('activeAccountIndex');
        await setEncrypted(
            'activeAccountIndex',
            activeAccountIndex.toString(),
            newPassword
        );

        await deleteEncrypted('passphrase');
        await setEncrypted('passphrase', newPassword);

        await deleteEncrypted(LOCKED);
        await setEncrypted(LOCKED, `${LOCKED}${newPassword}`, newPassword);

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
            deleteEncrypted('passphrase');
            return null;
        }

        await setEncrypted('passphrase', passphrase);
        await setEncrypted(LOCKED, `${LOCKED}${passphrase}`, passphrase);

        const {
            account: { mnemonic },
        } = getState() as RootState;

        if (passphrase && mnemonic) {
            await setEncrypted('mnemonic', mnemonic, passphrase);
            console.log('SETTING ENCRYPTED ACCINFOS in savePassphrase');

            await setEncrypted(
                'accountInfos',
                JSON.stringify([
                    {
                        index: 0,
                        name: 'Wallet',
                        color: getNextWalletColor(0),
                        emoji: getNextEmoji(0),
                        address: keypairVault.getAddress() || '',
                        seed: (keypairVault.getSeed() || '').toString(),
                    },
                ]),
                passphrase
            );
        }
        return passphrase;
    }
);

export const reset = createAsyncThunk(
    'account/reset',
    async (_args, { getState }): Promise<void> => {
        const {
            account: { passphrase },
        } = getState() as RootState;
        if (passphrase) {
            await deleteEncrypted('passphrase');
            await deleteEncrypted('mnemonic', passphrase);
            await deleteEncrypted('accountInfos', passphrase);
        }
        await deleteEncrypted('authentication');
        await deleteEncrypted('email');
        await deleteEncrypted('activeAccountIndex');
        await deleteEncrypted(PERMISSIONS_STORAGE_KEY);

        window.location.reload();
    }
);

export const logout = createAsyncThunk(
    'account/logout',
    async (_args, { getState }): Promise<void> => {
        const {
            account: { authentication, passphrase },
        } = getState() as RootState;
        if (authentication) {
            await deleteEncrypted('authentication');
        } else if (passphrase) {
            await deleteEncrypted(LOCKED, passphrase);
        }
    }
);

const isPasswordCorrect = async (password: string) => {
    const existingPassphrase = await getEncrypted('passphrase');

    if (existingPassphrase !== password) return false;

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

export const unlock: AsyncThunk<boolean, string | null, AppThunkConfig> =
    createAsyncThunk<boolean, string | null, AppThunkConfig>(
        'account/unlock',
        async (passphrase): Promise<boolean> => {
            if (passphrase) {
                const isCorrect = await isPasswordCorrect(passphrase);
                if (isCorrect) {
                    await setEncrypted(
                        LOCKED,
                        `${LOCKED}${passphrase}`,
                        passphrase
                    );
                    return true;
                }
            }
            return false;
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
    locked: boolean;
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
    locked: false,
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
            .addCase(unlock.fulfilled, (state, action) => {
                state.locked = !action.payload;
            })
            .addCase(logout.fulfilled, (state) => {
                if (state.authentication) {
                    state.authentication = null;
                } else {
                    state.locked = true;
                }
            }),
});

export const { setMnemonic, setAddress, setAccountInfos, setAuthentication } =
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
                    'AddressOwner' in owner &&
                    owner.AddressOwner === address
            );
        }
        return [];
    }
);

export const accountCoinsSelector = createSelector(
    ownedObjects,
    (allSuiObjects) => {
        return allSuiObjects
            .filter(Coin.isCoin)
            .map((aCoin) => aCoin.data as SuiMoveObject);
    }
);

// return an aggregate balance for each coin type
export const accountAggregateBalancesSelector = createSelector(
    accountCoinsSelector,
    (coins) => {
        return coins.reduce((acc, aCoin) => {
            const coinType = Coin.getCoinTypeArg(aCoin);
            if (coinType) {
                if (typeof acc[coinType] === 'undefined') {
                    acc[coinType] = BigInt(0);
                }
                acc[coinType] += Coin.getBalance(aCoin);
            }
            return acc;
        }, {} as Record<string, bigint>);
    }
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
        return allSuiObjects.filter((anObj) => !Coin.isCoin(anObj));
    }
);

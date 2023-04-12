// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { type SuiAddress, toB64, TransactionBlock } from '@mysten/sui.js';
import {
    SUI_CHAINS,
    ReadonlyWalletAccount,
    SUI_DEVNET_CHAIN,
    SUI_TESTNET_CHAIN,
    SUI_LOCALNET_CHAIN,
    type SuiFeatures,
    type SuiSignAndExecuteTransactionBlockMethod,
    type StandardConnectFeature,
    type StandardConnectMethod,
    type Wallet,
    type StandardEventsFeature,
    type StandardEventsOnMethod,
    type StandardEventsListeners,
    type SuiSignTransactionBlockMethod,
    type SuiSignMessageMethod,
    type StandardDisconnectFeature,
    type StandardDisconnectMethod,
} from '@mysten/wallet-standard';
import mitt, { type Emitter } from 'mitt';
import { filter, map, type Observable } from 'rxjs';

import { mapToPromise } from './utils';
import { createMessage } from '_messages';
import { WindowMessageStream } from '_messaging/WindowMessageStream';
import {
    type AcquirePermissionsRequest,
    type AcquirePermissionsResponse,
    type HasPermissionsRequest,
    type HasPermissionsResponse,
    ALL_PERMISSION_TYPES,
} from '_payloads/permissions';
import { API_ENV } from '_src/shared/api-env';
import { type SignMessageRequest } from '_src/shared/messaging/messages/payloads/transactions';
import { isWalletStatusChangePayload } from '_src/shared/messaging/messages/payloads/wallet-status-change';

import type { IconString } from '@wallet-standard/standard';
import type { BasePayload, Payload } from '_payloads';
import type { GetAccount } from '_payloads/account/GetAccount';
import type { GetAccountResponse } from '_payloads/account/GetAccountResponse';
import type { SetNetworkPayload } from '_payloads/network';
import type {
    StakeRequest,
    ExecuteTransactionRequest,
    ExecuteTransactionResponse,
    SignTransactionRequest,
    SignTransactionResponse,
} from '_payloads/transactions';
import type { NetworkEnvType } from '_src/background/NetworkEnv';
import type { DisconnectRequest } from '_src/shared/messaging/messages/payloads/connections/DisconnectRequest';
import type { DisconnectResponse } from '_src/shared/messaging/messages/payloads/connections/DisconnectResponse';

type WalletEventsMap = {
    [E in keyof StandardEventsListeners]: Parameters<
        StandardEventsListeners[E]
    >[0];
};

// NOTE: Because this runs in a content script, we can't fetch the manifest.
const name = process.env.APP_NAME || 'Ethos Wallet';

type StakeInput = { validatorAddress: string };
type SuiWalletStakeFeature = {
    'suiWallet:stake': {
        version: '0.0.1';
        stake: (input: StakeInput) => Promise<void>;
    };
};
type ChainType = Wallet['chains'][number];
const API_ENV_TO_CHAIN: Record<
    Exclude<API_ENV, API_ENV.customRPC>,
    ChainType
> = {
    [API_ENV.local]: SUI_LOCALNET_CHAIN,
    [API_ENV.devNet]: SUI_DEVNET_CHAIN,
    [API_ENV.testNet]: SUI_TESTNET_CHAIN,
    [API_ENV.mainNet]: 'sui:mainnet',
};

export class EthosWallet implements Wallet {
    readonly #events: Emitter<WalletEventsMap>;
    readonly #version = '1.0.0' as const;
    readonly #name = name;
    #accounts: ReadonlyWalletAccount[];
    #messagesStream: WindowMessageStream;
    #activeChain: ChainType | null = null;

    get version() {
        return this.#version;
    }

    get name() {
        return this.#name;
    }

    get icon() {
        return dataIcon;
    }

    get chains() {
        // TODO: Extract chain from wallet:
        return SUI_CHAINS;
    }

    get features(): StandardConnectFeature &
        StandardEventsFeature &
        SuiFeatures &
        SuiWalletStakeFeature &
        StandardDisconnectFeature {
        return {
            'standard:connect': {
                version: '1.0.0',
                connect: this.#connect,
            },
            'standard:disconnect': {
                version: '1.0.0',
                disconnect: this.#disconnect,
            },
            'standard:events': {
                version: '1.0.0',
                on: this.#on,
            },
            'sui:signTransactionBlock': {
                version: '1.0.0',
                signTransactionBlock: this.#signTransactionBlock,
            },
            'sui:signAndExecuteTransactionBlock': {
                version: '1.0.0',
                signAndExecuteTransactionBlock:
                    this.#signAndExecuteTransactionBlock,
            },
            'suiWallet:stake': {
                version: '0.0.1',
                stake: this.#stake,
            },
            'sui:signMessage': {
                version: '1.0.0',
                signMessage: this.#signMessage,
            },
        };
    }

    get accounts() {
        return this.#accounts;
    }

    #setAccounts(addresses: SuiAddress[]) {
        this.#accounts = addresses.map(
            (address) =>
                new ReadonlyWalletAccount({
                    address,
                    // TODO: Expose public key instead of address:
                    publicKey: new Uint8Array(),
                    chains: this.#activeChain ? [this.#activeChain] : [],
                    features: [
                        'standard:connect',
                        'standard:disconnect',
                        'standard:events',
                        'sui:signMessage',
                        'sui:signTransactionBlock',
                        'sui:signAndExecuteTransactionBlock',
                    ],
                    icon: dataIcon,
                    label: this.#name,
                })
        );
    }

    constructor() {
        this.#events = mitt();
        this.#accounts = [];
        this.#messagesStream = new WindowMessageStream(
            'ethos_in-page',
            'ethos_content-script'
        );
        this.#messagesStream.messages.subscribe(({ payload }) => {
            if (isWalletStatusChangePayload(payload)) {
                const { network, accounts } = payload;
                if (network) {
                    this.#setActiveChain(network);
                    if (!accounts) {
                        // in case an accounts change exists skip updating chains of current accounts
                        // accounts will be updated in the if block below
                        this.#accounts = this.#accounts.map(
                            ({ address, features, icon, label, publicKey }) =>
                                new ReadonlyWalletAccount({
                                    address,
                                    publicKey,
                                    chains: this.#activeChain
                                        ? [this.#activeChain]
                                        : [],
                                    features,
                                    label,
                                    icon,
                                })
                        );
                    }
                }
                if (accounts) {
                    this.#setAccounts(accounts);
                }
                this.#events.emit('change', { accounts: this.accounts });
            }
        });
        this.#connected();
    }

    #on: StandardEventsOnMethod = (event, listener) => {
        this.#events.on(event, listener);
        return () => this.#events.off(event, listener);
    };

    #connected = async () => {
        const activeNetwork = await this.#getActiveNetwork();
        this.#setActiveChain(activeNetwork);
        if (!(await this.#hasPermissions(['viewAccount']))) {
            return;
        }
        const accounts = await this.#getAccounts();
        this.#setAccounts(accounts);
        if (this.#accounts.length) {
            this.#events.emit('change', { accounts: this.accounts });
        }
    };

    #connect: StandardConnectMethod = async (input) => {
        if (!input?.silent) {
            await mapToPromise(
                this.#send<
                    AcquirePermissionsRequest,
                    AcquirePermissionsResponse
                >({
                    type: 'acquire-permissions-request',
                    permissions: ALL_PERMISSION_TYPES,
                }),
                (response) => response.result
            );
        }

        await this.#connected();

        return { accounts: this.accounts };
    };

    #disconnect: StandardDisconnectMethod = async () => {
        await mapToPromise(
            this.#send<DisconnectRequest, DisconnectResponse>({
                type: 'disconnect-request',
            }),
            (response) => response.success
        );
        this.#setAccounts([]);
        this.#events.emit('change', { accounts: this.accounts });
    };

    #signTransactionBlock: SuiSignTransactionBlockMethod = async (input) => {
        if (!TransactionBlock.is(input.transactionBlock)) {
            throw new Error(
                'Unexpect transaction format found. Ensure that you are using the `Transaction` class.'
            );
        }

        return mapToPromise(
            this.#send<SignTransactionRequest, SignTransactionResponse>({
                type: 'sign-transaction-request',
                transaction: {
                    ...input,
                    // account might be undefined if previous version of adapters is used
                    // in that case use the first account address
                    account:
                        input.account?.address ||
                        this.#accounts[0]?.address ||
                        '',
                    transaction: input.transactionBlock.serialize(),
                },
            }),
            (response) => response.result
        );
    };

    #signAndExecuteTransactionBlock: SuiSignAndExecuteTransactionBlockMethod =
        async (input) => {
            const { transactionBlock, account, chain, options } = input;

            if (!TransactionBlock.is(transactionBlock)) {
                throw new Error(
                    'Unexpect transaction format found. Ensure that you are using the `Transaction` class.'
                );
            }

            return mapToPromise(
                this.#send<
                    ExecuteTransactionRequest,
                    ExecuteTransactionResponse
                >({
                    type: 'execute-transaction-request',
                    transaction: {
                        type: 'transaction',
                        data: transactionBlock.serialize(),
                        options,
                        // account might be undefined if previous version of adapters is used
                        // in that case use the first account address
                        account:
                            account?.address ||
                            this.#accounts[0]?.address ||
                            '',
                        chain,
                    },
                }),
                (response) => response.result
            );
        };

    #stake = async (input: StakeInput) => {
        this.#send<StakeRequest, void>({
            type: 'stake-request',
            validatorAddress: input.validatorAddress,
        });
    };

    #signMessage: SuiSignMessageMethod = async ({ message, account }) => {
        return mapToPromise(
            this.#send<SignMessageRequest, SignMessageRequest>({
                type: 'sign-message-request',
                args: {
                    message: toB64(message),
                    accountAddress: account.address,
                },
            }),
            (response) => {
                if (!response.return) {
                    throw new Error('Invalid sign message response');
                }
                return response.return;
            }
        );
    };

    #hasPermissions(permissions: HasPermissionsRequest['permissions']) {
        return mapToPromise(
            this.#send<HasPermissionsRequest, HasPermissionsResponse>({
                type: 'has-permissions-request',
                permissions: permissions,
            }),
            ({ result }) => result
        );
    }

    #getAccounts() {
        return mapToPromise(
            this.#send<GetAccount, GetAccountResponse>({
                type: 'get-account',
            }),
            (response) => response.accounts
        );
    }

    #getActiveNetwork() {
        return mapToPromise(
            this.#send<BasePayload, SetNetworkPayload>({
                type: 'get-network',
            }),
            ({ network }) => network
        );
    }

    #setActiveChain({ env }: NetworkEnvType) {
        this.#activeChain =
            env === API_ENV.customRPC ? 'sui:unknown' : API_ENV_TO_CHAIN[env];
    }

    #send<
        RequestPayload extends Payload,
        ResponsePayload extends Payload | void = void
    >(
        payload: RequestPayload,
        responseForID?: string
    ): Observable<ResponsePayload> {
        const msg = createMessage(payload, responseForID);
        this.#messagesStream.send(msg);
        return this.#messagesStream.messages.pipe(
            filter(({ id }) => id === msg.id),
            map((msg) => msg.payload as ResponsePayload)
        );
    }
}

const dataIcon: IconString = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzZEMjhEOSIvPgo8cGF0aCBvcGFjaXR5PSIwLjgiIGQ9Ik05LjEyMTg3IDYuODU3MDZIMTkuOTU4M0MyMC40NTcxIDYuODU3MDYgMjAuODYxNCA3LjI2MTQxIDIwLjg2MTQgNy43NjAyVjE5Ljk4ODZDMjAuODYxNCAyMC40ODc0IDIwLjQ1NzEgMjAuODkxOCAxOS45NTgzIDIwLjg5MThIOS4xMjE4N0M4LjYyMzA4IDIwLjg5MTggOC4yMTg3MiAyMC40ODc0IDguMjE4NzIgMTkuOTg4NlY3Ljc2MDJDOC4yMTg3MiA3LjI2MTQxIDguNjIzMDggNi44NTcwNiA5LjEyMTg3IDYuODU3MDZaIiBzdHJva2U9InVybCgjcGFpbnQwX2xpbmVhcl82OTlfMjY5OCkiIHN0cm9rZS13aWR0aD0iMC40NTE1NzIiLz4KPHBhdGggZD0iTTguNzEyNzQgNy40NTQ1OUwxNi4wOTQ1IDEwLjg4OTRDMTYuNDEyOSAxMS4wMzc2IDE2LjYxNjYgMTEuMzU3IDE2LjYxNjYgMTEuNzA4M1YyMy44MUMxNi42MTY2IDI0LjQ2MzUgMTUuOTQ0IDI0LjkwMDcgMTUuMzQ2OCAyNC42MzUzTDcuOTY1MDIgMjEuMzU1NkM3LjYzODgyIDIxLjIxMDcgNy40Mjg1OCAyMC44ODcyIDcuNDI4NTggMjAuNTMwM1Y4LjI3MzQzQzcuNDI4NTggNy42MTMxMSA4LjExNDA2IDcuMTc2MDIgOC43MTI3NCA3LjQ1NDU5WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTIzLjM3ODIgMTUuMzc2N0MyMy40MzAzIDE1LjEzMjEgMjMuNTUzOCAxNC45MDg2IDIzLjczMzIgMTQuNzM0M0MyMy45MTI1IDE0LjU2IDI0LjEzOTYgMTQuNDQzIDI0LjM4NTYgMTQuMzk3OUwyNS4wNDA0IDE0LjI3ODRMMjQuMzg1NSAxNC4xNTg4SDI0LjM4NTZDMjQuMTM5NiAxNC4xMTM3IDIzLjkxMjUgMTMuOTk2NyAyMy43MzMyIDEzLjgyMjRDMjMuNTUzOCAxMy42NDgxIDIzLjQzMDMgMTMuNDI0NiAyMy4zNzgyIDEzLjE4TDIzLjIzNDEgMTIuNTAxM0wyMy4wOSAxMy4xOEMyMy4wMzc5IDEzLjQyNDYgMjIuOTE0NCAxMy42NDgxIDIyLjczNTEgMTMuODIyNEMyMi41NTU4IDEzLjk5NjcgMjIuMzI4NyAxNC4xMTM4IDIyLjA4MjcgMTQuMTU4OEwyMS40Mjc4IDE0LjI3ODRMMjIuMDgyNyAxNC4zOTc5SDIyLjA4MjdDMjIuMzI4NyAxNC40NDMgMjIuNTU1NyAxNC41NiAyMi43MzUgMTQuNzM0M0MyMi45MTQ0IDE0LjkwODYgMjMuMDM3OSAxNS4xMzIxIDIzLjA5IDE1LjM3NjdMMjMuMjM0MSAxNi4wNTU0TDIzLjM3ODIgMTUuMzc2N1oiIGZpbGw9IndoaXRlIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfNjk5XzI2OTgiIHgxPSIyMC44NjE0IiB5MT0iMTAuNTkyNiIgeDI9IjE0LjUzOTgiIHkyPSIxMy43NTM0IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IndoaXRlIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0id2hpdGUiIHN0b3Atb3BhY2l0eT0iMCIvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPgo=`;

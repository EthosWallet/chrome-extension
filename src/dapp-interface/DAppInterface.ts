// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { filter, map } from 'rxjs';

import { mapToPromise } from './utils';
import { createMessage } from '_messages';
import { WindowMessageStream } from '_messaging/WindowMessageStream';
import { ALL_PERMISSION_TYPES } from '_payloads/permissions';
import { type GetAccountCustomizations } from '_src/shared/messaging/messages/payloads/account/GetAccountCustomizations';
import { type GetAccountCustomizationsResponse } from '_src/shared/messaging/messages/payloads/account/GetAccountCustomizationsResponse';

import type { SuiAddress } from '@mysten/sui.js';
import type { Payload } from '_payloads';
import type { GetAccount } from '_payloads/account/GetAccount';
import type { GetAccountResponse } from '_payloads/account/GetAccountResponse';
import type {
    PermissionType,
    HasPermissionsRequest,
    HasPermissionsResponse,
    AcquirePermissionsRequest,
    AcquirePermissionsResponse,
} from '_payloads/permissions';
import type {
    PreapprovalRequest,
    PreapprovalResponse,
} from '_payloads/transactions';
import type { NetworkEnvType } from '_src/background/NetworkEnv';
import type { GetContacts } from '_src/shared/messaging/messages/payloads/account/GetContacts';
import type { GetContactsResponse } from '_src/shared/messaging/messages/payloads/account/GetContactsResponse';
import type { GetFavorites } from '_src/shared/messaging/messages/payloads/account/GetFavorites';
import type { GetFavoritesResponse } from '_src/shared/messaging/messages/payloads/account/GetFavoritesResponse';
import type { GetNetwork } from '_src/shared/messaging/messages/payloads/account/GetNetwork';
import type { GetNetworkResponse } from '_src/shared/messaging/messages/payloads/account/GetNetworkResponse';
import type { SetAccountCustomizations } from '_src/shared/messaging/messages/payloads/account/SetAccountCustomizations';
import type { SetAccountCustomizationsResponse } from '_src/shared/messaging/messages/payloads/account/SetAccountCustomizationsResponse';
import type { SetContacts } from '_src/shared/messaging/messages/payloads/account/SetContacts';
import type { SetContactsResponse } from '_src/shared/messaging/messages/payloads/account/SetContactsResponse';
import type { SetFavorites } from '_src/shared/messaging/messages/payloads/account/SetFavorites';
import type { SetFavoritesResponse } from '_src/shared/messaging/messages/payloads/account/SetFavoritesResponse';
import type { DisconnectRequest } from '_src/shared/messaging/messages/payloads/connections/DisconnectRequest';
import type { DisconnectResponse } from '_src/shared/messaging/messages/payloads/connections/DisconnectResponse';
import type { Preapproval } from '_src/shared/messaging/messages/payloads/transactions/Preapproval';
import type { OpenWallet } from '_src/shared/messaging/messages/payloads/url/OpenWallet';
import type { OpenWalletResponse } from '_src/shared/messaging/messages/payloads/url/OpenWalletResponse';
import type {
    AccountCustomization,
    Favorite,
} from '_src/types/AccountCustomization';
import type { Contact } from '_src/ui/app/redux/slices/contacts';
import type { Observable } from 'rxjs';

export class DAppInterface {
    private _messagesStream: WindowMessageStream;

    constructor() {
        this._messagesStream = new WindowMessageStream(
            'ethos_in-page',
            'ethos_content-script'
        );
    }

    public openWallet(): Promise<boolean> {
        return mapToPromise(
            this.send<OpenWallet, OpenWalletResponse>({
                type: 'open-wallet',
            }),
            (response) => response.success
        );
    }

    public hasPermissions(
        permissions: readonly PermissionType[] = ALL_PERMISSION_TYPES
    ): Promise<boolean> {
        return mapToPromise(
            this.send<HasPermissionsRequest, HasPermissionsResponse>({
                type: 'has-permissions-request',
                permissions,
            }),
            (response) => response.result
        );
    }

    public requestPermissions(
        permissions: readonly PermissionType[] = ALL_PERMISSION_TYPES
    ): Promise<boolean> {
        return mapToPromise(
            this.send<AcquirePermissionsRequest, AcquirePermissionsResponse>({
                type: 'acquire-permissions-request',
                permissions,
            }),
            (response) => response.result
        );
    }

    public getAccounts(): Promise<SuiAddress[]> {
        return mapToPromise(
            this.send<GetAccount, GetAccountResponse>({
                type: 'get-account',
            }),
            (response) => response.accounts
        );
    }

    public getAccountCustomizations(): Promise<AccountCustomization[]> {
        return mapToPromise(
            this.send<
                GetAccountCustomizations,
                GetAccountCustomizationsResponse
            >({
                type: 'get-account-customizations',
            }),
            (response) => response.accountCustomizations
        );
    }

    public setAccountCustomizations(
        accountCustomizations: AccountCustomization[]
    ) {
        return mapToPromise(
            this.send<
                SetAccountCustomizations,
                SetAccountCustomizationsResponse
            >({
                type: 'set-account-customizations',
                accountCustomizations,
            }),
            (response) => response
        );
    }

    public getContacts(): Promise<Contact[]> {
        return mapToPromise(
            this.send<GetContacts, GetContactsResponse>({
                type: 'get-contacts',
            }),
            (response) => response.contacts
        );
    }

    public getFavorites(): Promise<Favorite[]> {
        return mapToPromise(
            this.send<GetFavorites, GetFavoritesResponse>({
                type: 'get-favorites',
            }),
            (response) => response.favorites
        );
    }

    public setContacts(contacts: Contact[]) {
        return mapToPromise(
            this.send<SetContacts, SetContactsResponse>({
                type: 'set-contacts',
                contacts,
            }),
            (response) => response
        );
    }

    public setFavorites(favorites: Favorite[]) {
        return mapToPromise(
            this.send<SetFavorites, SetFavoritesResponse>({
                type: 'set-favorites',
                favorites,
            }),
            (response) => response
        );
    }

    public getNetwork(): Promise<NetworkEnvType> {
        return mapToPromise(
            this.send<GetNetwork, GetNetworkResponse>({
                type: 'get-network',
            }),
            (response) => response.network
        );
    }

    public requestPreapproval(preapproval: Preapproval) {
        return mapToPromise(
            this.send<PreapprovalRequest, PreapprovalResponse>({
                type: 'preapproval-request',
                preapproval,
            }),
            (response) => response
        );
    }

    public disconnect() {
        return mapToPromise(
            this.send<DisconnectRequest, DisconnectResponse>({
                type: 'disconnect-request',
            }),
            (response) => response.success
        );
    }

    private send<
        RequestPayload extends Payload,
        ResponsePayload extends Payload | void = void
    >(
        payload: RequestPayload,
        responseForID?: string
    ): Observable<ResponsePayload> {
        const msg = createMessage(payload, responseForID);
        this._messagesStream.send(msg);
        return this._messagesStream.messages.pipe(
            filter(({ id }) => id === msg.id),
            map((msg) => msg.payload as ResponsePayload)
        );
    }
}

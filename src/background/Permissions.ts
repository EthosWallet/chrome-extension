// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { filter, lastValueFrom, map, race, Subject, take, tap } from 'rxjs';
import { v4 as uuidV4 } from 'uuid';
import Browser from 'webextension-polyfill';

import { Window } from './Window';
import { BASE_URL } from '_src/shared/constants';
import { getEncrypted, setEncrypted } from '_src/shared/storagex/store';

import type { ContentScriptConnection } from './connections/ContentScriptConnection';
import type {
    Permission,
    PermissionResponse,
    PermissionType,
} from '_messages/payloads/permissions';

function openPermissionWindow(permissionID: string) {
    return new Window({
        url:
            Browser.runtime.getURL('ui.html') +
            `#/connect/${encodeURIComponent(permissionID)}`,
    });
}

export const PERMISSIONS_STORAGE_KEY = 'permissions';

class Permissions {
    private _permissionResponses: Subject<PermissionResponse> = new Subject();

    public async acquirePermissions(
        permissionTypes: readonly PermissionType[],
        connection: ContentScriptConnection
    ): Promise<Permission> {
        const { origin } = connection;
        const existingPermission = await this.getPermission(origin);
        // const hasPendingRequest = await this.hasPendingPermissionRequest(
        //     origin,
        //     existingPermission
        // );
        // if (hasPendingRequest) {
        //     throw new Error('Another permission request is pending.');
        // }
        const alreadyAllowed = await this.hasPermissions(
            origin,
            permissionTypes,
            existingPermission
        );
        if (alreadyAllowed && existingPermission) {
            return existingPermission;
        }
        const pRequest = await this.createPermissionRequest(
            connection.origin,
            permissionTypes,
            connection.originFavIcon,
            connection.originTitle,
            existingPermission
        );
        const permissionWindow = openPermissionWindow(pRequest.id);
        const onWindowCloseStream = await permissionWindow.show();
        const responseStream = this._permissionResponses.pipe(
            filter((resp) => resp.id === pRequest.id),
            map((resp) => {
                pRequest.allowed = resp.allowed;
                pRequest.accounts = resp.accounts;
                pRequest.responseDate = resp.responseDate;
                return pRequest;
            })
            // tap(() => permissionWindow.close())
        );
        return lastValueFrom(
            race(
                onWindowCloseStream.pipe(
                    map(() => {
                        pRequest.allowed = false;
                        pRequest.accounts = [];
                        pRequest.responseDate = new Date().toISOString();
                        return pRequest;
                    })
                ),
                responseStream
            ).pipe(
                take(1),
                tap(async (permission) => {
                    await this.storePermission(permission);
                }),
                map((permission) => {
                    if (!permission.allowed) {
                        throw new Error('Permission rejected');
                    }
                    return permission;
                })
            )
        );
    }

    public handlePermissionResponse(response: PermissionResponse) {
        this._permissionResponses.next(response);
    }

    public async getPermissions(): Promise<Record<string, Permission>> {
        const permissionString =
            (await getEncrypted(PERMISSIONS_STORAGE_KEY)) || '{}';
        return JSON.parse(permissionString);
    }

    public async getPermission(
        origin: string,
        permission?: Permission | null
    ): Promise<Permission | null> {
        if (permission && permission.origin !== origin) {
            throw new Error(
                `Provided permission has different origin from the one provided. "${permission.origin} !== ${origin}"`
            );
        }
        if (permission) {
            return permission;
        }
        const permissions = await this.getPermissions();
        return permissions[origin] || null;
    }

    public async revokeAllPermissions(origin: string): Promise<void> {
        const permissions = await this.getPermissions();
        const filteredPermissions: Record<string, Permission> = {};
        for (const key in permissions) {
            if (
                Object.prototype.hasOwnProperty.call(permissions, key) &&
                key !== origin
            ) {
                filteredPermissions[key] = permissions[key];
            }
        }

        // const passphrase = await getEncrypted('passphrase');
        // await setEncrypted(
        //     PERMISSIONS_STORAGE_KEY,
        //     JSON.stringify(filteredPermissions),
        //     passphrase
        // );

        const {
            id,
            favIcon,
            title,
            accounts,
            allowed,
            createdDate,
            responseDate,
        } = permissions[origin];

        const revokedPermission: Permission = {
            id,
            origin,
            favIcon,
            title,
            accounts,
            allowed,
            permissions: [],
            createdDate,
            responseDate,
        };
        this.storePermission(revokedPermission);
    }

    public async grantEthosDashboardBasicPermissionsForAccount(
        account: string
    ): Promise<void> {
        const permission: Permission = {
            accounts: [account],
            allowed: true,
            createdDate: Date.now().toString(),
            favIcon: BASE_URL + '/favicon.ico',
            id: uuidV4(),
            origin: BASE_URL,
            permissions: [
                'viewAccount',
                'suggestTransactions',
                'suggestSignMessages',
            ],
            responseDate: Date.now().toString(),
            title: 'Ethos Wallet Dashboard',
        };
        await this.storePermission(permission);
    }

    public async hasPendingPermissionRequest(
        origin: string,
        permission?: Permission | null
    ): Promise<boolean> {
        const existingPermission = await this.getPermission(origin, permission);
        return !!existingPermission && existingPermission.responseDate === null;
    }

    public async hasPermissions(
        origin: string,
        permissionTypes: readonly PermissionType[],
        permission?: Permission | null
    ): Promise<boolean> {
        const existingPermission = await this.getPermission(origin, permission);
        return Boolean(
            existingPermission &&
                existingPermission.allowed &&
                permissionTypes.every((permissionType) =>
                    existingPermission.permissions.includes(permissionType)
                )
        );
    }

    private async createPermissionRequest(
        origin: string,
        permissionTypes: readonly PermissionType[],
        favIcon: string | undefined,
        title: string | undefined,
        existingPermission?: Permission | null
    ): Promise<Permission> {
        let permissionToStore: Permission;
        if (existingPermission) {
            existingPermission.allowed = null;
            existingPermission.responseDate = null;
            permissionTypes.forEach((aPermission) => {
                if (!existingPermission.permissions.includes(aPermission)) {
                    existingPermission.permissions.push(aPermission);
                }
            });
            permissionToStore = existingPermission;
        } else {
            permissionToStore = {
                id: uuidV4(),
                accounts: [],
                allowed: null,
                createdDate: new Date().toISOString(),
                origin,
                favIcon,
                title,
                permissions: permissionTypes as PermissionType[],
                responseDate: null,
            };
        }
        await this.storePermission(permissionToStore);
        return permissionToStore;
    }

    private async storePermission(permission: Permission) {
        const permissions = await this.getPermissions();
        permissions[permission.origin] = permission;
        const permissionsString = JSON.stringify(permissions);
        await setEncrypted(PERMISSIONS_STORAGE_KEY, permissionsString);
    }
}

export default new Permissions();

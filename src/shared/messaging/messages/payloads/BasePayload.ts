// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { Payload } from './Payload';

export type PayloadType =
    | 'permission-request'
    | 'permission-response'
    | 'get-permission-requests'
    | 'get-account'
    | 'get-account-response'
    | 'get-account-customizations'
    | 'get-account-customizations-response'
    | 'open-wallet'
    | 'open-wallet-response'
    | 'disconnect-request'
    | 'disconnect-response'
    | 'has-permissions-request'
    | 'has-permissions-response'
    | 'acquire-permissions-request'
    | 'acquire-permissions-response'
    | 'execute-transaction-request'
    | 'execute-transaction-response'
    | 'get-transaction-requests'
    | 'get-transaction-requests-response'
    | 'transaction-request-response'
    | 'preapproval-request'
    | 'preapproval-response'
    | 'get-preapproval-requests'
    | 'get-preapproval-response'
    | 'execute-sign-message-request'
    | 'execute-sign-message-response'
    | 'sign-message-request-response'
    | 'get-sign-message-requests'
    | 'get-sign-message-requests-response';

export interface BasePayload {
    type: PayloadType;
}

export function isBasePayload(payload: Payload): payload is BasePayload {
    return 'type' in payload && typeof payload.type !== 'undefined';
}

// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { isBasePayload } from '_payloads';

import type { BasePayload, Payload } from '_payloads';

export interface GetAccountCustomizations extends BasePayload {
    type: 'get-account-customizations';
}

export function isGetAccountCustomizations(
    payload: Payload
): payload is GetAccountCustomizations {
    return (
        isBasePayload(payload) && payload.type === 'get-account-customizations'
    );
}

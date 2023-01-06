// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { SuiAddress } from '@mysten/sui.js';
import type { BasePayload } from '_payloads';
import type { AccountCustomization } from '_src/types/AccountCustomization';

export interface GetAccountCustomizationsResponse extends BasePayload {
    type: 'get-account-customizations-response';
    accountCustomizations: AccountCustomization[];
}

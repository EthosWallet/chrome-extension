// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { isAnyOf } from '@reduxjs/toolkit';

import { changeRPCNetwork } from '_redux/slices/app';
import { clearForNetworkOrWalletSwitch } from '_redux/slices/sui-objects';

import type { Middleware } from '@reduxjs/toolkit';

const isChangeNetwork = isAnyOf(changeRPCNetwork.pending);

export const NetworkSwitchMiddleware: Middleware =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        if (isChangeNetwork(action)) {
            dispatch(clearForNetworkOrWalletSwitch());
        }
        return next(action);
    };

// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { type SuiAddress } from '@mysten/sui.js';
import { useQuery } from '@tanstack/react-query';

import { api } from '_redux/store/thunk-extras';

const dedupe = (arr: string[]) => Array.from(new Set(arr));

export function useQueryTransactionsByAddress(address: SuiAddress | null) {
    const rpc = api.instance.fullNode;

    return useQuery(
        ['transactions-by-address', address],
        async () => {
            // combine from and to transactions
            const [txnIds, fromTxnIds] = await Promise.all([
                rpc.queryTransactions({
                    filter: {
                        ToAddress: address || '',
                    },
                }),
                rpc.queryTransactions({
                    filter: {
                        FromAddress: address || '',
                    },
                }),
            ]);
            // TODO: replace this with queryTransactions
            // It seems to be expensive to fetch all transaction data at once though
            const resp = await rpc.multiGetTransactions({
                digests: dedupe(
                    [...txnIds.data, ...fromTxnIds.data].map((x) => x.digest)
                ),
                options: {
                    showInput: true,
                    showEffects: true,
                    showEvents: true,
                    showObjectChanges: true,
                },
            });
            console.log('resp', resp);

            return resp.sort(
                // timestamp could be null, so we need to handle
                (a, b) => (b.timestampMs || 0) - (a.timestampMs || 0)
            );
        },
        { enabled: !!address, staleTime: 10 * 1000 }
    );
}

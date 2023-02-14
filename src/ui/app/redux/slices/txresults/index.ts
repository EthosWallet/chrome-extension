// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import {
    getTransactions,
    getTransactionKindName,
    getTransferObjectTransaction,
    getExecutionStatusType,
    getTotalGasUsed,
    getTransferSuiTransaction,
    getExecutionStatusError,
    getMoveCallTransaction,
    getTransactionSender,
    getObjectId,
    getObjectFields,
    Coin,
    getPaySuiTransaction,
    getPayTransaction,
} from '@mysten/sui.js';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { notEmpty } from '_helpers';
import getObjTypeFromObjId from '_src/ui/app/helpers/getObjTypeFromObjId';

import type {
    SuiTransactionResponse,
    TransactionKindName,
    ExecutionStatusType,
    TransactionEffects,
    SuiEvent,
    SuiTransactionKind,
} from '@mysten/sui.js';
import type { AppThunkConfig } from '_store/thunk-extras';

export type TxResultState = {
    to?: string;
    txId: string;
    status: ExecutionStatusType;
    txGas: number;
    kind: TransactionKindName | undefined;
    from: string;
    amount?: number;
    timestampMs?: number;
    url?: string;
    balance?: number;
    objectId?: string;
    description?: string;
    name?: string;
    objType?: string;
    isSender?: boolean;
    error?: string;
    callFunctionName?: string;
    coinSymbol?: string;
    coinType?: string;
    toAddr?: string;
    txAmount?: number;
    vendor?: string;
    txType?: string;
    type: string;
};

interface TransactionManualState {
    loading: boolean;
    error: false | { code?: string; message?: string; name?: string };
    latestTx: TxResultState[];
    recentAddresses: string[];
}

const initialState: TransactionManualState = {
    loading: true,
    latestTx: [],
    recentAddresses: [],
    error: false,
};
type TxResultByAddress = TxResultState[];

// Remove duplicate transactionsId, reduces the number of RPC calls
const deduplicate = (results: string[] | undefined) =>
    results
        ? results.filter((value, index, self) => self.indexOf(value) === index)
        : [];

const moveCallTxnName = (moveCallFunctionName?: string): string | null =>
    moveCallFunctionName ? moveCallFunctionName.replace(/_/g, ' ') : null;

// Return amount of SUI from a transaction
// if multiple recipients return list of recipients and amounts
function getAmount(
    txnData: SuiTransactionKind,
    address?: string
): { [key: string]: number } | number | null {
    //TODO: add PayAllSuiTransaction
    const transferSui = getTransferSuiTransaction(txnData);
    if (transferSui?.amount) {
        return transferSui.amount;
    }

    const paySuiData =
        getPaySuiTransaction(txnData) ?? getPayTransaction(txnData);

    const amountByRecipient =
        paySuiData?.recipients.reduce((acc, value, index) => {
            return {
                ...acc,
                [value]:
                    paySuiData.amounts[index] + (value in acc ? acc[value] : 0),
            };
        }, {} as { [key: string]: number }) ?? null;

    // return amount if only one recipient or if address is in recipient object
    const amountByRecipientList = Object.values(amountByRecipient || {});

    const amount =
        amountByRecipientList.length === 1
            ? amountByRecipientList[0]
            : amountByRecipient;

    return address && amountByRecipient ? amountByRecipient[address] : amount;
}

// Get objectId from a transaction effects -> events where recipient is the address
const getTxnEffectsEventID = (
    txEffects: TransactionEffects,
    address: string
): string[] => {
    const events = txEffects?.events || [];
    const objectIDs = events
        ?.map((event: SuiEvent) => {
            const data = Object.values(event).find(
                (itm) => itm?.recipient?.AddressOwner === address
            );
            return data?.objectId;
        })
        .filter(notEmpty);
    return objectIDs;
};

export const getTransactionsByAddress = createAsyncThunk<
    TxResultByAddress,
    SuiTransactionResponse[] | undefined,
    AppThunkConfig
>(
    'sui-transactions/get-transactions-by-address',
    async (
        txEffs,
        { getState, extra: { api } }
    ): Promise<TxResultByAddress> => {
        const address = getState().account.address;
        if (!address || !txEffs) {
            return [];
        }

        const txResults = txEffs.map((txEff) => {
            const txns = getTransactions(txEff.certificate);

            // TODO handle batch transactions
            if (txns.length > 1) {
                return null;
            }

            const txn = txns[0];
            const txKind = getTransactionKindName(txn);
            const payCoin = getPayTransaction(txn);
            const transferSui = getTransferSuiTransaction(txn);
            const paySui = getPaySuiTransaction(txn);
            const txTransferObject = getTransferObjectTransaction(txn);
            const recipient =
                payCoin?.recipients[0] ||
                transferSui?.recipient ||
                txTransferObject?.recipient ||
                paySui?.recipients[0];
            const moveCallTxn = getMoveCallTransaction(txn);
            const objId = txEff.effects?.created?.[0]?.reference.objectId;
            const metaDataObjectId = getTxnEffectsEventID(
                txEff.effects,
                address
            );
            const sender = getTransactionSender(txEff.certificate);
            const amountByRecipient = getAmount(txn);

            // todo: handle multiple recipients, for now just return first
            const amount =
                typeof amountByRecipient === 'number'
                    ? amountByRecipient
                    : Object.values(amountByRecipient || {})[0];

            return {
                txId: txEff.certificate.transactionDigest,
                status: getExecutionStatusType(txEff),
                txGas: getTotalGasUsed(txEff),
                kind: txKind,
                callModuleName: moveCallTxnName(moveCallTxn?.module),
                callFunctionName: moveCallTxnName(moveCallTxn?.function),
                from: sender,
                isSender: sender === address,
                error: getExecutionStatusError(txEff),
                timestampMs: txEff.timestamp_ms,
                ...(recipient && { to: recipient }),
                ...(amount && {
                    amount,
                }),
                ...((txTransferObject?.objectRef?.objectId ||
                    metaDataObjectId.length > 0) && {
                    objectId: txTransferObject?.objectRef?.objectId
                        ? [txTransferObject?.objectRef?.objectId]
                        : [...metaDataObjectId],
                }),
                objId,
            };
        });

        const objectIds = txResults
            .map((itm) => itm?.objectId)
            .filter(notEmpty);
        const objectIDs = Array.from(new Set(objectIds.flat()));
        const getObjectBatch = await api.instance.fullNode.getObjectBatch(
            objectIDs
        );
        const txObjects = getObjectBatch.filter(
            ({ status }) => status === 'Exists'
        );

        const txnResp: TxResultState[] = await Promise.all(
            txResults.map(async (itm) => {
                const txnObjects =
                    txObjects && itm?.objectId && Array.isArray(txObjects)
                        ? txObjects
                              .filter(({ status }) => status === 'Exists')
                              .find((obj) =>
                                  itm.objectId?.includes(getObjectId(obj))
                              )
                        : null;

                const { details } = txnObjects || {};

                let objType = undefined;
                if (itm?.objId) {
                    objType = await getObjTypeFromObjId(itm.objId);
                }

                const fields =
                    txnObjects &&
                    details &&
                    typeof details !== 'string' &&
                    'data' in details &&
                    details.data.dataType === 'moveObject'
                        ? getObjectFields(txnObjects)
                        : null;

                return {
                    ...itm,
                    objType,
                    objSymbol: objType && Coin.getCoinSymbol(objType),
                    ...(fields &&
                        fields.url && {
                            description:
                                typeof fields.description === 'string' &&
                                fields.description,
                            name:
                                typeof fields.name === 'string' && fields.name,
                            url: fields.url,
                        }),
                    ...(fields && {
                        balance: fields.balance,
                    }),
                };
            })
        );

        return txnResp;
    }
);

const txSlice = createSlice({
    name: 'txresult',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getTransactionsByAddress.fulfilled, (state, action) => {
                state.loading = false;
                state.error = false;
                state.latestTx = action.payload;
                // Add recent addresses to the list
                const recentAddresses = action.payload.map((tx) => [
                    tx?.to as string,
                    tx.from as string,
                ]);
                // Remove duplicates
                state.recentAddresses = [
                    ...new Set(recentAddresses.flat().filter((itm) => itm)),
                ];
            })
            .addCase(getTransactionsByAddress.pending, (state, action) => {
                state.loading = true;
                state.latestTx = [];
                state.recentAddresses = [];
            })
            .addCase(
                getTransactionsByAddress.rejected,
                (state, { error: { code, name, message } }) => {
                    state.loading = false;
                    state.error = { code, message, name };
                    state.latestTx = [];
                    state.recentAddresses = [];
                }
            );
    },
});

export default txSlice.reducer;

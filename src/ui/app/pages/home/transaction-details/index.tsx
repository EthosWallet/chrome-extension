// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import clBind from 'classnames/bind';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import ExplorerLink from '_components/explorer-link';
import { ExplorerLinkType } from '_components/explorer-link/ExplorerLinkType';
import Icon from '_components/icon';
import { useAppSelector } from '_hooks';
import { txSelectors } from '_redux/slices/transactions';
import Alert from '_src/ui/app/shared/feedback/Alert';

import type { SuiTransactionBlockResponse } from '@mysten/sui.js/client';
import type { RootState } from '_redux/RootReducer';

import st from './TransactionDetailsPage.module.scss';

const cl = clBind.bind(st);

// const txKindToTxt: Record<TransactionKindName, string> = {
//     // TransferObject: 'Object transfer',
//     // Call: 'Call',
//     // Publish: 'Publish',
//     // TransferSui: 'Sui transfer',
//     // ChangeEpoch: 'Change epoch',
//     // Pay: 'Pay',
//     // PaySui: 'PaySui',
//     // PayAllSui: 'PayAllSui',
//     ProgrammableTransaction: 'ProgrammableTransaction',
//     ChangeEpoch: 'ChangeEpoch',
//     Genesis: 'Genesis',
//     ConsensusCommitPrologue: 'ConsensusCommitPrologue',
// };

function TransactionDetailsPage() {
    const { txDigest } = useParams();
    const txSelector = useMemo(
        () => (state: RootState) =>
            txDigest ? txSelectors.selectById(state, txDigest) : null,
        [txDigest]
    );
    // TODO: load tx if not found locally
    const txDetails = useAppSelector(txSelector) as SuiTransactionBlockResponse;
    const status = txDetails && txDetails.effects?.status?.status;
    const statusIcon = status === 'success' ? 'check2-circle' : 'x-circle';
    // const txnKind = getTransactionKind(txDetails);
    // const transferKind = txnKind ? getTransactionKindName(txnKind) : undefined;

    return (
        <div className={cl('container')}>
            {txDetails ? (
                <>
                    <Icon className={cl('status', status)} icon={statusIcon} />
                    {/* {transferKind ? (
                        <span className={cl('txt')}>
                            <strong>{txKindToTxt[transferKind]}</strong>{' '}
                            {status === 'success' ? 'was successful' : 'failed'}
                        </span>
                    ) : null} */}
                    {txDigest ? (
                        <ExplorerLink
                            className={cl('link')}
                            type={ExplorerLinkType.transaction}
                            transactionID={txDigest}
                            title="View on Sui Explorer"
                        />
                    ) : null}
                </>
            ) : (
                <Alert title="Transaction not found" />
                // <Alert className={cl('error')}>
                //     <strong>Transaction not found.</strong>{' '}
                //     {txDigest ? (
                //         <span>
                //             Click{' '}
                //             <ExplorerLink
                //                 type={ExplorerLinkType.transaction}
                //                 transactionID={txDigest}
                //             >
                //                 here
                //             </ExplorerLink>{' '}
                //             to go to Sui Explorer.
                //         </span>
                //     ) : null}
                // </Alert>
            )}
        </div>
    );
}

export default TransactionDetailsPage;

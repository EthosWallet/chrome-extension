// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useMemo, useState, Fragment } from 'react';
import { useParams } from 'react-router-dom';

import { AppState } from '../../hooks/useInitializedGuard';
import Loading from '_components/loading';
import {
    useAppDispatch,
    useAppSelector,
    useFormatCoin,
    useInitializedGuard,
} from '_hooks';
import {
    respondToTransactionRequest,
    txRequestsSelectors,
} from '_redux/slices/transaction-requests';
import { thunkExtras } from '_redux/store/thunk-extras';
import UserApproveContainer from '_src/ui/app/components/user-approve-container';

import type { SuiJsonValue, TypeTag, TransactionEffects } from '@mysten/sui.js';
import type { RootState } from '_redux/RootReducer';

import st from './DappTxApprovalPage.module.scss';
import SectionElement from './SectionElement';
import TabElement from './TabElement';

const truncateMiddle = (s = '', length = 6) =>
    s.length > length * 2.5
        ? `${s.slice(0, length)}...${s.slice(length * -1)}`
        : s;

function toList(items: SuiJsonValue[] | TypeTag[]) {
    if (!items?.length) {
        return '-';
    }
    return (
        <ul className={st.list}>
            {items.map((anItem) => {
                const val = JSON.stringify(anItem, null, 4);
                return (
                    <li key={val} title={val} className="text-right">
                        {truncateMiddle(val, 8)}
                    </li>
                );
            })}
        </ul>
    );
}

export enum TxApprovalTab {
    SUMMARY = 'Summary',
    ASSETS = 'Assets',
    DETAILS = 'Details',
}

export type Cost = {
    value: string;
    symbol: string;
    dollars: string;
    total?: boolean;
};

export type NumberedDetail = {
    label: string;
    count: number;
};

export type Detail = {
    label?: string;
    content?: string | number | NumberedDetail | Cost;
    title?: string;
};

export type Section = {
    title: string;
    tooltip?: string;
    details: Detail[];
};

export type TabSections = {
    [key in TxApprovalTab]?: Section[];
};

export function DappTxApprovalPage() {
    const [tab, setTab] = useState(TxApprovalTab.SUMMARY);

    const { txID } = useParams();
    const guardLoading = useInitializedGuard([
        AppState.MNEMONIC,
        AppState.HOSTED,
    ]);
    const txRequestsLoading = useAppSelector(
        ({ transactionRequests }) => !transactionRequests.initialized
    );
    const { activeAccountIndex, address } = useAppSelector(
        ({ account }) => account
    );
    const txRequestSelector = useMemo(
        () => (state: RootState) =>
            (txID && txRequestsSelectors.selectById(state, txID)) || null,
        [txID]
    );
    const txRequest = useAppSelector(txRequestSelector);
    const dispatch = useAppDispatch();

    const [effects, setEffects] = useState<
        TransactionEffects | undefined | null
    >();
    const [dryRunError, setDryRunError] = useState<string | undefined>();

    const loading =
        guardLoading || txRequestsLoading || !(effects || dryRunError);

    const gasUsed = effects?.gasUsed;
    const gas = gasUsed
        ? gasUsed.computationCost +
          (gasUsed.storageCost - gasUsed.storageRebate)
        : null;

    const ownedCreating = useMemo(() => {
        if (!effects?.events) return [];

        const newEvents = effects.events.filter((event) => event.newObject);
        const ownedCreating = newEvents
            .map((event) => {
                const typeParts = event.newObject.objectType.split('::');
                return typeParts[2];
            })
            .reduce((summed, name) => {
                const index = summed.findIndex(
                    (info: (string | number)[]) => info[0] === name
                );
                if (index !== -1) {
                    summed[index][1]++;
                } else {
                    summed.push([name, 1]);
                }
                return summed;
            }, []);

        return ownedCreating;
    }, [effects]);

    const ownedMutated = useMemo(() => {
        if (!effects?.mutated) return [];

        const ownedMutated = effects.mutated.filter((object) => {
            if (typeof object.owner === 'string') {
                return false;
            }
            if ('AddressOwner' in object.owner) {
                if (object.owner.AddressOwner !== address) {
                    return false;
                }
            } else {
                return false;
            }
            if (
                object.reference.objectId ===
                effects.gasObject.reference.objectId
            ) {
                return false;
            }

            return true;
        });

        return ownedMutated;
    }, [effects, address]);

    const ownedTransferred = useMemo(() => {
        if (!effects?.events) return [];

        const ownedTransferred = effects.events.filter(
            (event) => event.transferObject
        );

        return ownedTransferred;
    }, [effects]);

    const ownedDeleted = useMemo(() => {
        if (!effects?.deleted) return [];

        const ownedDeleted: string[] = [];
        // effects.deleted.filter(

        // );
        console.log('DELETED', effects.deleted);

        return ownedDeleted;
    }, [effects]);

    const suiSpent = useMemo(() => {
        if (!effects?.events) return 0;

        const coinBalanceChangeEvents = effects.events.filter(
            (e) =>
                e.coinBalanceChange &&
                e.coinBalanceChange.coinType === '0x2::sui::SUI'
        );

        return (
            coinBalanceChangeEvents.reduce(
                (total, e) => total + e.coinBalanceChange.amount,
                0
            ) * -1
        );
    }, [effects]);

    const charges = useMemo(() => suiSpent - (gas || 0), [suiSpent, gas]);
    const [formattedCharges, chargesSymbol, chargeDollars] = useFormatCoin(
        charges,
        '0x2::sui::SUI'
    );
    const [formattedGas, gasSymbol, gasDollars] = useFormatCoin(
        gas,
        '0x2::sui::SUI'
    );
    const [formattedTotal, totalSymbol, totalDollars] = useFormatCoin(
        suiSpent,
        '0x2::sui::SUI'
    );

    useEffect(() => {
        const getEffects = async () => {
            try {
                if (!txRequest || txRequest.tx.type === 'move-call') {
                    setEffects(null);
                    return;
                }

                const signer = thunkExtras.api.getSignerInstance(
                    thunkExtras.keypairVault.getKeyPair(activeAccountIndex)
                );
                const transactionEffects = await signer.dryRunTransaction(
                    txRequest.tx.data
                );
                setEffects(transactionEffects);
            } catch (e) {
                if ((e as Error).message === 'Account mnemonic is not set') {
                    setTimeout(getEffects, 100);
                } else {
                    setDryRunError((e as Error).message);
                }
            }
        };

        getEffects();
    }, [txRequest, activeAccountIndex]);
    console.log('Effects', effects);

    useEffect(() => {
        const getNormalizedFunction = async () => {
            if (!txRequest) return;
            if (txRequest.tx.type === 'move-call') return;
            if (typeof txRequest.tx.data === 'string') return;
            if (!('packageObjectId' in txRequest.tx.data.data)) return;

            const {
                packageObjectId,
                module,
                function: f,
            } = txRequest.tx.data.data;

            const normalizedP =
                await thunkExtras.api.instance.fullNode.getNormalizedMoveModulesByPackage(
                    packageObjectId
                );
            console.log('getNormalizedMoveModulesByPackage', normalizedP);

            const normalizedM =
                await thunkExtras.api.instance.fullNode.getNormalizedMoveModule(
                    packageObjectId,
                    module
                );
            console.log('getNormalizedMoveModule', normalizedM);

            const normalizedF =
                await thunkExtras.api.instance.fullNode.getNormalizedMoveFunction(
                    packageObjectId,
                    module,
                    f
                );
            console.log('getNormalizedFunction', normalizedF);
        };

        getNormalizedFunction();
    }, [txRequest]);

    const handleOnSubmit = useCallback(
        async (approved: boolean) => {
            if (txRequest) {
                await dispatch(
                    respondToTransactionRequest({
                        approved,
                        txRequestID: txRequest.id,
                    })
                );
            }
        },
        [dispatch, txRequest]
    );
    useEffect(() => {
        if (
            !loading &&
            (!txRequest || (txRequest && txRequest.approved !== null))
        ) {
            window.close();
        }
    }, [loading, txRequest]);

    const content: TabSections = useMemo(() => {
        switch (txRequest?.tx.type) {
            case 'v2': {
                if (txRequest.tx.data.kind === 'moveCall') {
                    const summary = [
                        {
                            title: 'Requesting Permission To Call',
                            details: [
                                {
                                    label: 'Contract',
                                    content: txRequest.tx.data.data.module,
                                },
                                {
                                    label: 'Function',
                                    content: txRequest.tx.data.data.function,
                                },
                                {
                                    label: 'Permissions',
                                    content: {
                                        label: 'Assets',
                                        count: 3,
                                    },
                                },
                            ],
                        } as Section,
                    ];

                    if (ownedCreating.length > 0) {
                        const effects = {
                            title: 'Effects',
                            tooltip:
                                'This transaction will have the following effects on the assets in your wallet.',
                            details: [] as Detail[],
                        } as Section;

                        if (ownedCreating.length > 0) {
                            effects.details.push({
                                label: 'Creating',
                                content: ownedCreating.map(
                                    (creating: (string | number)[]) => ({
                                        label: creating[0],
                                        count: creating[1],
                                    })
                                ),
                            });
                        }

                        summary.push(effects);

                        const costs = {
                            title: 'Costs',
                            details: [
                                {
                                    label: 'Charges',
                                    content: {
                                        value: formattedCharges,
                                        symbol: chargesSymbol,
                                        dollars: chargeDollars,
                                    },
                                },
                                {
                                    label: 'Gas',
                                    content: {
                                        value: formattedGas,
                                        symbol: gasSymbol,
                                        dollars: gasDollars,
                                    },
                                },
                                {
                                    break: true,
                                },
                                {
                                    label: 'Total',
                                    content: {
                                        value: formattedTotal,
                                        symbol: totalSymbol,
                                        dollars: totalDollars,
                                        total: true,
                                    },
                                },
                            ],
                        };

                        summary.push(costs);
                    }
                    return {
                        [TxApprovalTab.SUMMARY]: summary,
                    };
                } else {
                    return {};
                }
            }
            default:
                return {};
        }
    }, [
        txRequest?.tx,
        ownedCreating,
        formattedCharges,
        chargesSymbol,
        chargeDollars,
        formattedGas,
        gasSymbol,
        gasDollars,
        formattedTotal,
        totalSymbol,
        totalDollars,
    ]);

    return (
        <Loading loading={loading} big={true}>
            {txRequest ? (
                <UserApproveContainer
                    title="Transaction Request"
                    origin={txRequest.origin}
                    originFavIcon={txRequest.originFavIcon}
                    approveTitle="Approve"
                    rejectTitle="Reject"
                    onSubmit={handleOnSubmit}
                >
                    <div className="flex flex-row justify-between items-baseline text-lg pb-6">
                        {[
                            TxApprovalTab.SUMMARY,
                            TxApprovalTab.ASSETS,
                            TxApprovalTab.DETAILS,
                        ].map((t, index) => (
                            <TabElement
                                key={`tab-${index}`}
                                type={tab}
                                isSelected={t === tab}
                                setTab={setTab}
                            />
                        ))}
                    </div>

                    <div className="flex flex-col gap-6 grow">
                        <>
                            {(content[tab] || []).map(
                                (section, sectionIndex) => (
                                    <SectionElement
                                        key={`section-${sectionIndex}`}
                                        section={section}
                                    />
                                )
                            )}
                        </>
                    </div>
                </UserApproveContainer>
            ) : null}
        </Loading>
    );
}

import { useCallback, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { defer, filter, from, of, repeat, switchMap } from 'rxjs';

import { useBalancesState } from '../../hooks/useBalancesState';
import { AppState } from '../../hooks/useInitializedGuard';
import { completeOnboarding } from '../../redux/slices/account';
import { fetchAllBalances } from '../../redux/slices/balances';
import {
    fetchInvalidPackages,
    initializeInvalidPackages,
} from '../../redux/slices/valid';
import { WarningAlert } from '../../shared/alerts/WarningAlert';
import Alert from '../../shared/feedback/Alert';
import BaseLayout from '../../shared/layouts/BaseLayout';
import NavBar from '../../shared/navigation/nav-bar/NavBar';
import TabBar from '../../shared/navigation/tab-bar/TabBar';
import Loading from '_components/loading';
import { useAppDispatch, useAppSelector, useInitializedGuard } from '_hooks';
import { fetchAllOwnedAndRequiredObjects } from '_redux/slices/sui-objects';
import featureGating from '_src/background/FeatureGating';
import PageLayout from '_src/ui/app/pages/PageLayout';

import type { AppDispatch } from '../../redux/store';
import { loadAccountInformationFromStorage } from '../../redux/slices/account';

export const POLL_SUI_OBJECTS_INTERVAL = 4000;
export const POLL_INVALID_PACKAGES = 300000;

const AppContainer = () => {
    const account = useAppSelector((state) => state.account);
    console.log('account :>> ', account);
    const { pathname } = useLocation();
    const { loading, error, showError } = useBalancesState();
    const guardChecking = useInitializedGuard([
        AppState.MNEMONIC,
        AppState.HOSTED,
        AppState.ZK,
    ]);
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (guardChecking) return;
        dispatch(completeOnboarding());
    }, [guardChecking, dispatch]);

    useEffect(() => {
        dispatch(initializeInvalidPackages());
    }, [guardChecking, dispatch]);

    useEffect(() => {
        const sub = fetchAllInvalidPackagesSubscription(
            guardChecking,
            dispatch
        ).subscribe();
        return () => sub.unsubscribe();
    }, [guardChecking, dispatch]);

    useEffect(() => {
        const sub = fetchAllBalancesSubscription(
            guardChecking,
            dispatch
        ).subscribe();
        return () => sub.unsubscribe();
    }, [guardChecking, dispatch]);

    useEffect(() => {
        const sub = fetchAllOwnedObjectsSubscription(
            guardChecking,
            dispatch
        ).subscribe();
        return () => sub.unsubscribe();
    }, [guardChecking, dispatch]);

    useEffect(() => {
        (async () => {
            const growthbook = await featureGating.getGrowthBook();
            if (growthbook.isOn('devnet-issues')) {
                toast(
                    <WarningAlert
                        text={'Sui Devnet is having technical issues.'}
                    />,
                    {
                        autoClose: false,
                        closeOnClick: true,
                    }
                );
            }
        })();
    }, []);

    useEffect(() => {
        document.getElementsByTagName('main')[0]?.scrollTo?.(0, 0);
    }, [pathname]);

    return (
        <PageLayout>
            <Loading
                loading={guardChecking}
                big={true}
                className="w-[360px] h-[420px] flex justify-center items-center"
            >
                <BaseLayout>
                    <NavBar />
                    <main className="flex-grow h-[494px] overflow-scroll no-scrollbar">
                        {showError && error ? (
                            <div className="px-6 py-6">
                                <Alert
                                    title="Something's wrong"
                                    subtitle="You've lost connection with the network. The network may be unstable. Please refresh or try again later."
                                />
                            </div>
                        ) : (
                            <Loading
                                loading={loading}
                                big={true}
                                className="flex py-6 justify-center items-center"
                            >
                                <Outlet />
                            </Loading>
                        )}
                    </main>
                    <TabBar />
                </BaseLayout>
            </Loading>
        </PageLayout>
    );
};

export default AppContainer;
export { default as NFTDetailsPage } from './nft-details';
export { default as NftsPage } from './nfts';
export { default as TicketsPage } from './tickets';
export { default as TicketDetailsPage } from './ticket-details';
export { default as TicketProjectDetailsPage } from './ticket-project-details';
export { default as ReceiptPage } from './receipt';
export { default as HomePage } from './home';
export { default as TransactionDetailsPage } from './transaction-details';
export { default as TransactionsPage } from './transactions';

function fetchAllOwnedObjectsSubscription(
    guardChecking: boolean,
    dispatch: AppDispatch
) {
    return of(guardChecking).pipe(
        filter(() => !guardChecking),
        switchMap(() =>
            defer(() => from(dispatch(fetchAllOwnedAndRequiredObjects()))).pipe(
                repeat({ delay: POLL_SUI_OBJECTS_INTERVAL })
            )
        )
    );
}

export function fetchAllBalancesSubscription(
    guardChecking: boolean,
    dispatch: AppDispatch
) {
    return of(guardChecking).pipe(
        filter(() => !guardChecking),
        switchMap(() =>
            defer(() => from(dispatch(fetchAllBalances()))).pipe(
                repeat({ delay: POLL_SUI_OBJECTS_INTERVAL })
            )
        )
    );
}

export function fetchAllInvalidPackagesSubscription(
    guardChecking: boolean,
    dispatch: AppDispatch
) {
    return of(guardChecking).pipe(
        filter(() => !guardChecking),
        switchMap(() =>
            defer(() => from(dispatch(fetchInvalidPackages()))).pipe(
                repeat({ delay: POLL_INVALID_PACKAGES })
            )
        )
    );
}

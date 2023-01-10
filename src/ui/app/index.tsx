// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { useEffect } from 'react';
import {
    Navigate,
    Route,
    Routes,
    useLocation,
    useParams,
} from 'react-router-dom';

import useSizeWindow from './hooks/useSizeWindow';
import { DappSignMessageApprovalPage } from './pages/dapp-sign-message-approval';
import BuyPage from './pages/home/buy';
import TransferNftRecipient from './pages/home/nft-details/transfer-nft-recipient';
import TransferNftReview from './pages/home/nft-details/transfer-nft-review';
import ReceivePage from './pages/home/receive';
import TransferCoinAmountPage from './pages/home/transfer-coin-amount';
import TransferCoinRecipientPage from './pages/home/transfer-coin-recipient';
import TransferCoinReviewPage from './pages/home/transfer-coin-review';
import CompletePage from './pages/initialize/complete';
import LoggingInPage from './pages/initialize/hosted/logging-in';
import ImportPage from './pages/initialize/import';
import ConfirmImportPage from './pages/initialize/import/confirm';
import ImportPrivateKeyPage from './pages/initialize/import/key';
import ImportSeedPage from './pages/initialize/import/seed';
import PinPage from './pages/initialize/pin';
import SavePhrasePage from './pages/initialize/save-phrase';
import StylePage from './pages/initialize/style';
import OnboardingThemePage from './pages/initialize/theme';
import VerifyPhrasePage from './pages/initialize/verify-phrase';
import LockedPage from './pages/locked';
import PasswordPage from './pages/password';
import { AppType } from './redux/slices/app/AppType';
import LockWalletProvider from './shared/LockWalletProvider';
import { useAppDispatch, useAppSelector } from '_hooks';
import { DappTxApprovalPage } from '_pages/dapp-tx-approval';
import HomePage, {
    NFTDetailsPage,
    NftsPage,
    ReceiptPage,
    TokensPage,
    TransactionDetailsPage,
    TransactionsPage,
} from '_pages/home';
import InitializePage from '_pages/initialize';
import { loadAccountInformationFromStorage } from '_redux/slices/account';
import { ThemeProvider } from '_src/shared/utils/themeContext';
import { DappPreapprovalPage } from '_src/ui/app/pages/dapp-preapproval';
import CreatePasswordPage from '_src/ui/app/pages/initialize/create-password';
import HostedPage from '_src/ui/app/pages/initialize/hosted';
import SiteConnectPage from '_src/ui/app/pages/site-connect';
import WelcomePage from '_src/ui/app/pages/welcome';

const App = () => {
    const dispatch = useAppDispatch();
    useSizeWindow();

    useEffect(() => {
        dispatch(loadAccountInformationFromStorage());
    }, [dispatch]);

    const isPopup = useAppSelector(
        (state) => state.app.appType === AppType.popup
    );

    useEffect(() => {
        document.body.classList[isPopup ? 'add' : 'remove']('is-popup');
    }, [isPopup]);

    return (
        <ThemeProvider initialTheme={undefined}>
            <LockWalletProvider>
                <Routes>
                    <Route path="/*" element={<HomePage />}>
                        <Route
                            index
                            element={<Navigate to="/tokens" replace={true} />}
                        />
                        <Route path="tokens" element={<TokensPage />} />
                        <Route path="nfts" element={<NftsPage />} />
                        <Route path="nft">
                            <Route
                                path="details"
                                element={<NFTDetailsPage />}
                            />
                            <Route
                                path="transfer/recipient"
                                element={<TransferNftRecipient />}
                            />
                            <Route
                                path="transfer/review"
                                element={<TransferNftReview />}
                            />
                        </Route>
                        <Route
                            path="transactions"
                            element={<TransactionsPage />}
                        />
                        <Route path="send">
                            <Route
                                path="recipient"
                                element={<TransferCoinRecipientPage />}
                            />
                            <Route
                                path="amount"
                                element={<TransferCoinAmountPage />}
                            />
                            <Route
                                path="review"
                                element={<TransferCoinReviewPage />}
                            />
                        </Route>
                        <Route path="receive" element={<ReceivePage />} />
                        <Route path="buy" element={<BuyPage />} />
                        <Route
                            path="tx/:txDigest"
                            element={<TransactionDetailsPage />}
                        />
                        <Route path="receipt" element={<ReceiptPage />} />
                    </Route>
                    <Route path="welcome" element={<WelcomePage />} />
                    <Route path="initialize" element={<InitializePage />}>
                        <Route path="hosted">
                            <Route path="" element={<HostedPage />} />
                            <Route
                                path="logging-in"
                                element={<LoggingInPage />}
                            />
                        </Route>
                        <Route path="import">
                            <Route path="" element={<ImportPage />} />
                            <Route
                                path="key"
                                element={<ImportPrivateKeyPage />}
                            />
                            <Route path="seed" element={<ImportSeedPage />} />
                            <Route
                                path="confirm"
                                element={<ConfirmImportPage />}
                            />
                        </Route>
                        <Route
                            path="create-password"
                            element={<CreatePasswordPage />}
                        />
                        <Route
                            path="save-phrase"
                            element={<SavePhrasePage />}
                        />
                        <Route
                            path="verify-phrase"
                            element={<VerifyPhrasePage />}
                        />
                        <Route path="style" element={<StylePage />} />
                        <Route path="theme" element={<OnboardingThemePage />} />
                        <Route path="pin" element={<PinPage />} />
                        <Route path="complete" element={<CompletePage />} />
                    </Route>
                    <Route path="password" element={<PasswordPage />} />
                    <Route path="locked" element={<LockedPage />} />
                    <Route path="locked/*" element={<LockedPage />} />
                    <Route
                        path="/connect/:requestID"
                        element={<SiteConnectPage />}
                    />
                    <Route
                        path="/tx-approval/:txID"
                        element={<DappTxApprovalPage />}
                    />
                    <Route
                        path="/sign-message-approval/:signMessageRequestID"
                        element={<DappSignMessageApprovalPage />}
                    />
                    <Route
                        path="/preapproval/:preapprovalRequestID"
                        element={<DappPreapprovalPage />}
                    />
                    <Route
                        path="*"
                        element={<Navigate to="/tokens" replace={true} />}
                    />
                </Routes>
            </LockWalletProvider>
        </ThemeProvider>
    );
};

export default App;

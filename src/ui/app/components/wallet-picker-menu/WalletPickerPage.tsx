// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { useCallback } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import {
    useNextWalletPickerUrl,
    useWalletEditorIsOpen,
    useWalletPickerIsOpen,
    useWalletPickerUrl,
} from '_src/ui/app/components/settings-menu/hooks';
import EditWallet from '_src/ui/app/components/wallet-picker/EditWallet';
import WalletPicker from '_src/ui/app/components/wallet-picker/WalletPicker';

interface WalletPickerPageProps {
    isWalletEditing: boolean;
    setIsWalletEditing: React.Dispatch<React.SetStateAction<boolean>>;
}

function WalletPickerPage({
    isWalletEditing,
    setIsWalletEditing,
}: WalletPickerPageProps) {
    const isWalletPickerOpen = useWalletPickerIsOpen();
    const walletPickerUrl = useWalletPickerUrl();
    const walletPickerHomeUrl = useNextWalletPickerUrl(true, '/');
    const isWalletEditorIsOpen = useWalletEditorIsOpen();
    console.log('walletPickerUrl', isWalletEditorIsOpen, walletPickerUrl);

    const navigate = useNavigate();
    const handleOnCloseMenu = useCallback(() => {
        setIsWalletEditing(false);
        if (isWalletEditorIsOpen) {
            navigate(-2);
            return;
        }
        navigate(-1);
    }, [isWalletEditorIsOpen, navigate, setIsWalletEditing]);

    if (!isWalletPickerOpen) {
        return null;
    }
    return (
        <div className="absolute w-full h-full z-10">
            {/* Backdrop: */}
            <div
                className="absolute top-0 w-full h-[535px] sm:rounded-[20px] bg-black opacity-20 dark:opacity-80"
                onClick={handleOnCloseMenu}
            />

            {/* Content */}
            <div className="relative flex flex-col max-h-full drop-shadow-ethos-box-shadow rounded-b-[20px] sm:rounded-[20px] bg-ethos-light-background-default dark:bg-ethos-dark-background-default">
                <Routes location={walletPickerUrl || ''}>
                    <Route
                        path="/"
                        element={
                            <WalletPicker isWalletEditing={isWalletEditing} />
                        }
                    />
                    <Route
                        path="/edit"
                        element={
                            <EditWallet
                                setIsWalletEditing={setIsWalletEditing}
                            />
                        }
                    />
                    <Route
                        path="*"
                        element={
                            <Navigate to={walletPickerHomeUrl} replace={true} />
                        }
                    />
                </Routes>
            </div>
        </div>
    );
}

export default WalletPickerPage;

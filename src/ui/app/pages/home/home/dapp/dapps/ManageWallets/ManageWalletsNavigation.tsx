import { Outlet, Route, Routes } from 'react-router-dom';

import ImportPrivateKey from './ImportPrivateKey';
import ImportSeedPhrase from './ImportSeedPhrase';
import ManagePrivateKey from './ManagePrivateKey';
import ManageSeed from './ManageSeed';
import ManageWallets from './ManageWallets';
import { DappWrapper } from '../../DappWrapper';

function ManageWalletNavigation() {
    return (
        <DappWrapper dappTitle="Manage Wallets" hideFavorite={true}>
            <div className="flex flex-col">
                <Routes>
                    <Route path="/" element={<ManageWallets />} />
                    <Route path="/import-seed" element={<ImportSeedPhrase />} />
                    <Route path="/import-key" element={<ImportPrivateKey />} />
                    <Route path="/manage-seed" element={<ManageSeed />} />
                    <Route
                        path="/manage-private-key"
                        element={<ManagePrivateKey />}
                    />
                </Routes>
                <Outlet />
            </div>
        </DappWrapper>
    );
}

export default ManageWalletNavigation;

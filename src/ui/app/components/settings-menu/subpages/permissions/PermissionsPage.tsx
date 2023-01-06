import { useCallback, useEffect, useMemo, useState } from 'react';

import ConfirmRevokeModal from './ConfirmRevokeModal';
import ConnectedAppDisplay from './ConnectedAppDisplay';
import Permissions from '_src/background/Permissions';
import Transactions from '_src/background/Transactions';
import BodyLarge from '_src/ui/app/shared/typography/BodyLarge';
import ContentBlock from '_src/ui/app/shared/typography/ContentBlock';
import Header from '_src/ui/app/shared/typography/Header';

import type { Permission } from '_src/shared/messaging/messages/payloads/permissions';
import type { PreapprovalRequest } from '_src/shared/messaging/messages/payloads/transactions';

export interface ConnectedApp extends Permission {
    preappovals: PreapprovalRequest[];
}

const PermissionsPage = () => {
    const [connectedApps, setConnectedApps] = useState<ConnectedApp[]>([]);
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] =
        useState(false);
    const [appToRevoke, setAppToRevoke] = useState<ConnectedApp>();

    const getConnectedApps = async () => {
        const _permissions = Object.values(await Permissions.getPermissions());
        const _preapprovals = await Transactions.getPreapprovalRequests();

        console.log('_permissions :>> ', _permissions);

        const _connectedApps: ConnectedApp[] = [];

        for (const _permission in _permissions) {
            if (
                Object.prototype.hasOwnProperty.call(_permissions, _permission)
            ) {
                const connectedApp = _permissions[_permission] as ConnectedApp;
                connectedApp.preappovals = [];
                for (const _preapproval in _preapprovals) {
                    if (
                        Object.prototype.hasOwnProperty.call(
                            _preapprovals,
                            _preapproval
                        )
                    ) {
                        const preapproval = _preapprovals[_preapproval];
                        if (connectedApp.origin === preapproval.origin) {
                            connectedApp.preappovals.push(preapproval);
                        }
                    }
                }
                _connectedApps.push(connectedApp);
            }
        }
        setConnectedApps(_connectedApps);
    };

    const connectedAppsDisplay = useMemo(() => {
        return connectedApps.filter(
            (connectedApp) => connectedApp.permissions.length > 0
        );
    }, [connectedApps]);

    const revokePermissions = async (app: ConnectedApp) => {
        await Permissions.revokeAllPermissions(app.origin);
    };

    const revokePreapprovals = async (preappovals: PreapprovalRequest[]) => {
        for (const preappoval of preappovals) {
            await Transactions.removePreapprovalRequest(
                preappoval.id as string
            );
        }
    };

    const revokeAllAccess = useCallback(async () => {
        if (!appToRevoke) {
            setIsConfirmationModalOpen(false);
            return;
        }
        await revokePermissions(appToRevoke);
        await revokePreapprovals(appToRevoke.preappovals);
        getConnectedApps();
        setIsConfirmationModalOpen(false);
    }, [appToRevoke]);

    const openConfirmationModal = useCallback(() => {
        setIsConfirmationModalOpen(true);
    }, []);

    const closeConfirmationModal = useCallback(() => {
        setIsConfirmationModalOpen(false);
    }, []);

    const onClickRevoke = useCallback(
        async (app: ConnectedApp) => {
            if (app.preappovals.length === 0) {
                // If app has no preapprovals, don't open confirmation modal
                await revokePermissions(app);

                await getConnectedApps();
                // remove site from UI (thinking about how I can do this by having state keep track of current permissions instead)
                const updatedConnectedApps = connectedApps.filter(
                    (c) => c.origin !== app.origin
                );
                setConnectedApps(updatedConnectedApps);
            } else {
                setAppToRevoke(app);
                openConfirmationModal();
            }
        },
        [connectedApps, openConfirmationModal]
    );

    useEffect(() => {
        getConnectedApps();
    }, []);

    return (
        <>
            <div className="flex flex-col">
                <ContentBlock className="!py-6">
                    <Header>Connected Apps</Header>
                    <BodyLarge isTextColorMedium>
                        Here you can manage or remove your connected apps.
                    </BodyLarge>
                </ContentBlock>
                {connectedAppsDisplay.map((connectedApp, key) => {
                    return (
                        <ConnectedAppDisplay
                            connectedApp={connectedApp}
                            onClickRevoke={onClickRevoke}
                            key={key}
                        />
                    );
                })}
            </div>
            <ConfirmRevokeModal
                isOpen={isConfirmationModalOpen}
                setIsOpen={setIsConfirmationModalOpen}
                onCancel={closeConfirmationModal}
                onConfirm={revokeAllAccess}
            />
        </>
    );
};

export default PermissionsPage;

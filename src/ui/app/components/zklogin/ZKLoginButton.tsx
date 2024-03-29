import { capitalize } from 'lodash';
import { useCallback, useState } from 'react';

import { Zk } from './ZKLogin';
import getNextEmoji from '../../helpers/getNextEmoji';
import getNextWalletColor from '../../helpers/getNextWalletColor';
import { useAppDispatch } from '../../hooks';
import { saveAccountInfos, setZk } from '../../redux/slices/account';
import Permissions from '_src/background/Permissions';
import { api } from '_src/ui/app/redux/store/thunk-extras';

import type { ZkData } from './ZKLogin';
import type { ZkProvider } from './providers';
import type { AccountInfo } from '../../KeypairVault';
import ZkLoginWarningDialog from '../../shared/dialog/ZkLoginWarningDialog';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ZKLoginButtonProps {
    provider: ZkProvider;
    logo: string;
    setLoading: (loading: boolean) => void;
}

const ZKLoginButton: React.FC<ZKLoginButtonProps> = ({
    provider,
    logo,
    setLoading,
}) => {
    const client = api.instance.client;
    const dispatch = useAppDispatch();
    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);

    const openWarning = useCallback(() => {
        setIsWarningModalOpen(true);
    }, []);

    const startZkLogin = useCallback(async () => {
        setLoading(true);
        let zkData: ZkData | null;
        try {
            zkData = await Zk.login(client, provider);
            if (!zkData) {
                setLoading(false);
                return;
            }
        } catch (error) {
            setLoading(false);
            return;
        }

        setLoading(false);

        let pictureUrl: string | undefined;
        let profileName: string | undefined;

        if (zkData.profileInfo) {
            if ('picture' in zkData.profileInfo) {
                pictureUrl = zkData.profileInfo.picture;
            }
            if ('given_name' in zkData.profileInfo) {
                profileName = zkData.profileInfo.given_name;
            }
            if ('preferred_username' in zkData.profileInfo) {
                profileName = zkData.profileInfo.preferred_username;
            }
        }

        await dispatch(
            saveAccountInfos([
                {
                    address: zkData.address,
                    index: 0,
                    publicKey: zkData.address,
                    color: getNextWalletColor(0),
                    emoji: getNextEmoji(0),
                    nftPfpUrl: pictureUrl,
                    nickname: profileName
                        ? `${profileName}'s Wallet`
                        : 'Primary Wallet',
                } as AccountInfo,
            ])
        );

        await Permissions.grantEthosDashboardBasicPermissionsForAccount(
            zkData.address
        );

        await dispatch(setZk(zkData));
        return;
    }, [client, dispatch, provider, setLoading]);

    return (
        <>
            <button
                onClick={openWarning}
                className="flex items-center place-content-center w-[68px] h-[52px] rounded-[10px] bg-ethos-light-background-secondary"
            >
                <span className="sr-only">
                    Sign in with {capitalize(provider)}
                </span>
                <img
                    src={logo}
                    alt={`${capitalize(provider)} logo`}
                    className="w-7 h-7"
                />
            </button>
            <ZkLoginWarningDialog
                isOpen={isWarningModalOpen}
                setIsOpen={setIsWarningModalOpen}
                title="Warning"
                paragraphs={[
                    'Signing in with Google and Twitch using ZK Login will no longer be supported.',
                    'Please do not create a new wallet using these methods, and if you have an existing account please transfer your assets to a new wallet.',
                ]}
                primaryButtonText="Continue with sign in"
                onClickPrimaryButton={startZkLogin}
                iconWithNoClasses={<ExclamationTriangleIcon />}
                forceLightTheme
            />
        </>
    );
};

export default ZKLoginButton;

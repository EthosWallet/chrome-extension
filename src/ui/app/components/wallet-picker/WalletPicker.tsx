import { ArrowLongUpIcon } from '@heroicons/react/24/solid';

import { useAppSelector } from '../../hooks';
import Body from '../../shared/typography/Body';
import WalletList from '../../shared/wallet-list/WalletList';
import CreateWalletButton from './CreateWalletButton';
import { TextColor } from '_src/enums/Typography';

interface WalletPickerProps {
    isWalletEditing: boolean;
}

const WalletPicker = ({ isWalletEditing }: WalletPickerProps) => {
    const accountInfos = useAppSelector(({ account }) => account.accountInfos);
    const activeAccountIndex = useAppSelector(
        ({ account: { activeAccountIndex } }) => activeAccountIndex
    );

    return (
        <div className="flex flex-col h-full">
            <WalletList
                hasTopPadding
                wallets={accountInfos}
                activeAccountIndex={activeAccountIndex}
                isWalletEditing={isWalletEditing}
            />
            <div className="border-t border-t-ethos-light-text-stroke dark:border-t-ethos-dark-text-stroke">
                {!isWalletEditing ? (
                    <div className="pt-6">
                        <CreateWalletButton />
                    </div>
                ) : (
                    <div className="flex gap-2 py-4 px-5 place-content-center">
                        <ArrowLongUpIcon className="h-5 w-5 text-ethos-light-text-medium dark:text-ethos-dark-text-medium" />
                        <Body textColor={TextColor.Medium}>
                            Select the wallet you&apos;d like to edit
                        </Body>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WalletPicker;

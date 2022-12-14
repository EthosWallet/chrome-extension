import { Cog6ToothIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';

import WalletProfile from '../../content/rows-and-lists/WalletProfile';
import {
    useSettingsIsOpen,
    useNextSettingsUrl,
    useWalletPickerIsOpen,
} from '_src/ui/app/components/settings-menu/hooks';

const NavBarWithSettingsAndWalletPicker = () => {
    const menuUrl = useNextSettingsUrl(true);
    const isMenuOpen = useSettingsIsOpen();
    const isWalletPickerOpen = useWalletPickerIsOpen();

    return (
        <div
            className={`${
                isMenuOpen || isWalletPickerOpen ? 'hidden' : 'flex'
            } flex-row items-center justify-between px-6 py-4 border-b border-b-ethos-light-text-stroke dark:border-b-ethos-dark-text-stroke`}
        >
            <Link to={menuUrl}>
                <Cog6ToothIcon className="h-6 w-6 text-ethos-light-text-medium dark:text-ethos-dark-text-medium" />
            </Link>
            <WalletProfile />
        </div>
    );
};

export default NavBarWithSettingsAndWalletPicker;

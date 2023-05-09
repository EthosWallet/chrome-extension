import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';

import Body from '../typography/Body';

const HideShowToggle = ({
    name,
    hide,
    onToggle,
}: {
    name: string;
    hide: boolean;
    onToggle: () => void;
}) => {
    return (
        <div
            className="flex justify-center text-sm cursor-pointer"
            onClick={onToggle}
        >
            <div className="flex items-center gap-2">
                <Body>
                    {hide ? 'Show ' : 'Hide '}
                    {name}
                </Body>
                <div
                    className={`${
                        hide
                            ? 'bg-ethos-light-background-secondary dark:bg-ethos-dark-background-secondary'
                            : 'bg-ethos-light-primary-light dark:bg-ethos-dark-primary-dark'
                    } w-12 h-6 rounded-full flex items-center dark:border dark:border-ethos-dark-background-light-grey`}
                >
                    <div
                        className={`${
                            hide ? 'translate-x-6' : 'translate-x-0'
                        } w-6 h-6 rounded-full bg-ethos-light-background-secondary dark:bg-ethos-dark-background-secondary dark:border dark:border-ethos-dark-background-light-grey transform transition-transform flex justify-center items-center`}
                    >
                        {hide ? (
                            <EyeSlashIcon className="w-3 h-3 text-ethos-light-text-default dark:text-ethos-dark-text-default" />
                        ) : (
                            <EyeIcon className="w-3 h-3 text-ethos-light-text-default dark:text-ethos-dark-text-default" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HideShowToggle;

import { memo, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import Sui from './Sui';
import UnknownToken from './UnknownToken';
import { useDependencies } from '_shared/utils/dependenciesContext';
import truncateString from '_src/ui/app/helpers/truncate-string';
import { useFormatCoin } from '_src/ui/app/hooks/useFormatCoin';
import BodyLarge from '_src/ui/app/shared/typography/BodyLarge';

export type CoinProps = {
    type: string;
    balance: string;
    replaceUrl?: boolean;
};

function CoinBalance({ type, balance, replaceUrl }: CoinProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [balanceFormatted, symbol, usdAmount, name, icon] = useFormatCoin(
        balance,
        type
    );

    const isSendAmountPage = useMemo(
        () => location.pathname === '/send/amount',
        [location]
    );

    const sendUrl = useMemo(
        () =>
            `/send/${
                isSendAmountPage ? 'amount' : 'recipient'
            }?${new URLSearchParams({ type }).toString()}`,
        [isSendAmountPage, type]
    );

    const updateUrl = useCallback(() => {
        navigate(sendUrl, { replace: replaceUrl });
    }, [navigate, sendUrl, replaceUrl]);

    const { featureFlags } = useDependencies();

    return (
        <button
            onClick={updateUrl}
            className="flex w-full items-center justify-between py-2 pl-2 pr-4 rounded-[10px] bg-ethos-light-gray dark:bg-ethos-dark-background-secondary"
        >
            <div className="flex gap-4 items-center">
                {icon ? (
                    <img
                        src={icon}
                        alt={`coin-${symbol}`}
                        height={39}
                        width={39}
                    />
                ) : symbol === 'SUI' ? (
                    <Sui />
                ) : (
                    <UnknownToken />
                )}
                <BodyLarge isSemibold>{truncateString(name, 12)}</BodyLarge>
            </div>

            <div className="flex flex-col">
                <BodyLarge>
                    {balanceFormatted} {symbol}
                </BodyLarge>
                {featureFlags.showUsd && (
                    <div className="flex items-center text-base text-slate-800 dark:text-slate-300">
                        <div>{usdAmount}</div>
                    </div>
                )}
            </div>
        </button>
    );
}

export default memo(CoinBalance);

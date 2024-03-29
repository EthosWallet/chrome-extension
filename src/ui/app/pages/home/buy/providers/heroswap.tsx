import { useAppSelector } from '../../../../hooks';
import { API_ENV } from '_src/shared/api-env';
import { useTheme } from '_src/shared/utils/themeContext';

export default function HeroswapOnboarding() {
    const selectedApiEnv = useAppSelector(({ app }) => app.apiEnv);
    const { address } = useAppSelector(({ account }) => account);
    const { resolvedTheme } = useTheme();

    const isProduction = selectedApiEnv.toString() === API_ENV.mainNet;
    const network = isProduction ? 'mainnet' : 'testnet';
    const theme = resolvedTheme === 'dark' ? 'dark-purple' : 'light-purple';
    const affiliateAddress = '0x5a457230B6AE02dFD8549293138AeD5565884434';

    return (
        <div
            id={'iframe-container'}
            className={`w-full h-full bg-ethos-dark-backround-primary dark:bg-ethos-dark-background-secondary`}
        >
            <iframe
                id="heroswap-iframe"
                title="heroswap-iframe"
                src={`https://heroswap.com/widget?theme=${theme}&network=${network}&destinationTickers=SUI&affiliateAddress=${affiliateAddress}&destinationAddress=${address}`}
                className="border-0 m-0 p-0 w-full h-full relative z-20"
            />
        </div>
    );
}

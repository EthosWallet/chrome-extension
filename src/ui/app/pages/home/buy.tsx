import { useSearchParams } from 'react-router-dom';

import { useAppSelector } from '../../hooks';
import BackButton from '../../shared/buttons/BackButton';
import Alert from '../../shared/feedback/Alert';
import { API_ENV } from '_src/shared/api-env';
import { useDependencies } from '_src/shared/utils/dependenciesContext';
import { useTheme } from '_src/shared/utils/themeContext';

export default function MoonpayOnboarding() {
    // When SUI is added as a supported currency we can pass the users
    // active address in, that address is checked for validtity on the Sui
    // network and used if it is valid. We need to Sign the URL in this case
    // https://docs.moonpay.com/moonpay/implementation-guide/on-ramp/sign-the-url-server-side
    // const address = useAppSelector((state) => state.account.address);

    const [selectedApiEnv] = useAppSelector(({ app }) => [app.apiEnv]);
    const [searchParams] = useSearchParams();
    const envParam = searchParams.get('env');
    const { featureFlags } = useDependencies();

    const isProduction = selectedApiEnv.toString() === API_ENV.mainNet;
    const key =
        isProduction || envParam === 'mainNet'
            ? process.env.MOONPAY_PRODUCTION_API_KEY
            : process.env.MOONPAY_TEST_API_KEY;
    const { resolvedTheme } = useTheme();
    const baseTestingUrl = 'https://buy-staging.moonpay.io';
    const baseProductionUrl = 'https://buy.moonpay.com';
    const baseUrl =
        isProduction || envParam === 'mainNet'
            ? baseProductionUrl
            : baseTestingUrl;
    const coinCode = 'btc'; // TODO: Change to SUI when supported
    const redirect = '/home';
    const colorCode =
        resolvedTheme === 'dark'
            ? encodeURIComponent('#9C78F7')
            : encodeURIComponent('#6D28D9');

    return featureFlags.showWipFeatures ? (
        <iframe
            title="Moonpay Onboarding: Buy Sui"
            allow="accelerometer; autoplay; camera; gyroscope; payment"
            height="100%"
            width="100%"
            src={`${baseUrl}?apiKey=${key}&currencyCode=${coinCode}&colorCode=${colorCode}&theme=${resolvedTheme}&redirectUrl=${redirect}`}
        >
            <p>
                We could not display this page in your browser. Please update or
                try another browser to view.
            </p>
        </iframe>
    ) : (
        <div className={'p-6'}>
            <div className={'mb-6'}>
                <BackButton />
            </div>
            <Alert
                title={'Coming Soon'}
                subtitle={
                    'Ethos will support SUI purchases with Visa, Debit or Mastercard soon.'
                }
            />
        </div>
    );
}

import {
    ChatBubbleOvalLeftIcon,
    GlobeAltIcon,
} from '@heroicons/react/24/solid';
import { SUI_TYPE_ARG } from '@mysten/sui.js';
import { useCallback, useState, type ReactNode, useEffect } from 'react';

import ConfettiPop from '../../components/Confetti';
import { useAppDispatch, useAppSelector, useFormatCoin } from '../../hooks';
import { accountAggregateBalancesSelector } from '../../redux/slices/account';
import { fetchAllBalances } from '../../redux/slices/balances';
import OnboardingButton from '../../shared/buttons/OnboardingButton';
import Alert from '../../shared/feedback/Alert';
import OnboardingCard from '../../shared/layouts/OnboardingCard';
import SuiIcon from '../../shared/svg/SuiIcon';
import TwitterIcon from '../../shared/svg/TwitterIcon';
import BodyLarge from '../../shared/typography/BodyLarge';
import Header from '../../shared/typography/Header';
import JumboTitle from '../../shared/typography/JumboTitle';
import {
    DASHBOARD_LINK,
    MAILTO_SUPPORT_URL,
    TWITTER_URL,
} from '_src/shared/constants';

import type { OnboardingButtonProps } from '../../shared/buttons/OnboardingButton';

const socialLinks: SocialLinkProps[] = [
    {
        title: 'Follow us on Twitter',
        iconWithNoClasses: <TwitterIcon />,
        to: TWITTER_URL,
    },
    {
        title: 'Give us feedback',
        iconWithNoClasses: <ChatBubbleOvalLeftIcon />,
        to: MAILTO_SUPPORT_URL,
    },
];

interface SocialLinkProps {
    title: string;
    iconWithNoClasses: ReactNode;
    to: string;
}

const SocialLink = ({ title, iconWithNoClasses, to }: SocialLinkProps) => {
    return (
        <a href={to} target="_blank" rel="noreferrer" className="flex gap-2">
            <span className="h-6 w-6 text-ethos-light-text-medium">
                {iconWithNoClasses}
            </span>
            <BodyLarge isTextColorMedium isSemibold>
                {title}
            </BodyLarge>
        </a>
    );
};

const CompletePage = () => {
    const [error, setError] = useState(false);
    const [hasUsedFaucet, setHasUsedFaucet] = useState(false);
    const [faucetCompletedSuccessfully, setFaucetCompletedSuccessfully] =
        useState(false);
    const address = useAppSelector(({ account }) => account.address);
    const balances = useAppSelector(accountAggregateBalancesSelector);
    const mistBalance = balances[SUI_TYPE_ARG];

    const [balanceFormatted] = useFormatCoin(mistBalance, SUI_TYPE_ARG);
    const dispatch = useAppDispatch();

    const onFaucetClicked = useCallback(async () => {
        setHasUsedFaucet(true);

        setTimeout(async () => {
            if (!faucetCompletedSuccessfully) {
                setError(true);
            }
        }, 5000);

        const result = await fetch('https://faucet.devnet.sui.io/gas', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                FixedAmountRequest: {
                    recipient: address,
                },
            }),
        });

        setFaucetCompletedSuccessfully(true);
        if (result.status !== 201 && result.status !== 200) {
            setError(true);
            return;
        }
    }, [address, faucetCompletedSuccessfully]);

    const setupButtons: OnboardingButtonProps[] = [
        {
            title: 'Use Faucet',
            linkType: 'none',
            onClick: onFaucetClicked,
            iconWithNoClasses: <SuiIcon width={20} height={20} />,
            iconBackgroundColor: '#3D5FF2',
            buttonGradientColor: '#DDEEFA',
            disabled: hasUsedFaucet,
        },
        {
            title: 'Explore Ethos',
            to: DASHBOARD_LINK,
            linkType: 'external',
            iconWithNoClasses: <GlobeAltIcon />,
            iconBackgroundColor: '#6D28D9',
            buttonGradientColor: '#EFECF8',
        },
    ];

    const rightCardContent = (
        <div className="flex flex-col gap-3 p-4 place-items-center">
            <div className="flex place-content-center place-items-center h-[104px] w-[104px] rounded-full bg-ethos-light-background-default">
                <SuiIcon width={50} height={50} color="black" />
            </div>
            <div className="flex flex-col gap-2 text-center">
                <JumboTitle forceLightMode>{balanceFormatted}</JumboTitle>
                <Header isTextColorMedium forceLightMode>
                    Sui Balance
                </Header>
            </div>
        </div>
    );

    useEffect(() => {
        dispatch(fetchAllBalances());
    }, [dispatch]);

    return (
        <OnboardingCard
            hideBackButton
            title="Go Explore"
            subtitle="Your Ethos Wallet is all setup. Start exploring, you know you want to."
            accentColor="purple"
            icon="sui"
            isIconBlurred
            customRightCard={rightCardContent}
        >
            <div className="fixed top-[200px] left-1/2">
                <ConfettiPop />
            </div>
            <div className="flex flex-col gap-3 px-6 sm:px-10 pb-6">
                {error && (
                    <div className="pb-4">
                        <Alert
                            title="The faucet isn't working"
                            subtitle="There could be an issue with the Sui network or the Sui faucet. Please try again later."
                            borderRadius={16}
                            forceLightMode
                        />
                    </div>
                )}
                {setupButtons.map((b, key) => {
                    return (
                        <OnboardingButton
                            title={b.title}
                            to={b.to}
                            linkType={b.linkType}
                            onClick={b.onClick}
                            iconWithNoClasses={b.iconWithNoClasses}
                            iconBackgroundColor={b.iconBackgroundColor}
                            buttonGradientColor={b.buttonGradientColor}
                            disabled={b.disabled}
                            key={key}
                        />
                    );
                })}
            </div>
            <div className="flex flex-col gap-6 p-10 place-content-center place-items-center">
                {socialLinks.map(({ title, iconWithNoClasses, to }, key) => {
                    return (
                        <SocialLink
                            title={title}
                            iconWithNoClasses={iconWithNoClasses}
                            to={to}
                            key={key}
                        />
                    );
                })}
            </div>
        </OnboardingCard>
    );
};

export default CompletePage;

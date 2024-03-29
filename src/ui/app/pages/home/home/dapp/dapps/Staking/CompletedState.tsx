import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import StakeSummary from './StakeSummary';
import StakingIcon from '_assets/images/staking-icon.png';
import { useAppSelector } from '_src/ui/app/hooks';
import { useValidatorsWithApy } from '_src/ui/app/hooks/staking/useValidatorsWithApy';
import mistToSui from '_src/ui/app/pages/dapp-tx-approval/lib/mistToSui';
import Button from '_src/ui/app/shared/buttons/Button';
import BodyLarge from '_src/ui/app/shared/typography/BodyLarge';

const CompletedStake: React.FC = () => {
    const queryClient = useQueryClient();
    const { address } = useAppSelector(({ account }) => account);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const validatorSuiAddress = searchParams.get('validator');
    const amount = searchParams.get('amount');

    const { data: validators } = useValidatorsWithApy();

    const validator = useMemo(() => {
        return validators && validators[validatorSuiAddress || ''];
    }, [validatorSuiAddress, validators]);

    const onNavigateToTokens = useCallback(async () => {
        navigate('/home/staking');
    }, [navigate]);

    useEffect(() => {
        queryClient.refetchQueries({ queryKey: ['validator', address] });
    }, [address, queryClient]);

    return (
        <div className="flex flex-col h-full justify-between">
            <div className="flex gap-2 items-center place-content-center py-5 bg-ethos-light-green/10 dark:bg-ethos-dark-green/10 ">
                <CheckCircleIcon className="h-5 w-5 text-ethos-light-green dark:text-ethos-dark-green" />
                <BodyLarge
                    className="text-ethos-light-green dark:text-ethos-dark-green"
                    isSemibold
                >
                    Staking Complete!
                </BodyLarge>
            </div>
            <div>
                <img
                    src={StakingIcon}
                    alt={'Icon representing staking on the Sui network'}
                    className={'h-[200px] mx-auto'}
                />

                <div className="px-6 pb-6">
                    <StakeSummary
                        amount={amount || undefined}
                        stakingAPY={validator?.apy?.toString()}
                        commissionRate={validator?.commissionRate}
                        rewardsStart={'Tomorrow'}
                        gasPrice={mistToSui(+(validator?.gasPrice || '0'), 4)}
                    />
                </div>
            </div>
            <div>
                <Button onClick={onNavigateToTokens}>View your stakes</Button>
            </div>
        </div>
    );
};

export default CompletedStake;

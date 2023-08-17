import { SUI_TYPE_ARG } from '@mysten/sui.js/utils';
import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import ValidatorImage from './Validator/ValidatorImage';
import ns from '_shared/namespace';
import { maybeGetValue } from '_src/shared/namespace/unknown';
import { AnimatedTooltip } from '_src/ui/app/components/AnimatedTooltip';
import { TooltipDirection } from '_src/ui/app/components/Tooltip';
import CopyToClipboard from '_src/ui/app/components/copy-to-clipboard';
import Loading from '_src/ui/app/components/loading';
import { getValidatorMoveEvent } from '_src/ui/app/helpers/staking/getValidatorMoveEvent';
import { useFormatCoin, useMiddleEllipsis } from '_src/ui/app/hooks';
import { useValidatorsEvents } from '_src/ui/app/hooks/staking/useValidatorEvents';
import { useValidatorsWithApy } from '_src/ui/app/hooks/staking/useValidatorsWithApy';
import KeyValueList from '_src/ui/app/shared/content/rows-and-lists/KeyValueList';
import Body from '_src/ui/app/shared/typography/Body';
import Subheader from '_src/ui/app/shared/typography/Subheader';

const VALIDATOR_FIELD_INFO_TEXT_MAP = {
    apy: 'This is the Annualized Percentage Yield of the a specific validator’s past operations. Note there is no guarantee this APY will be true in the future',
    totalSuiStaked:
        'The total SUI staked on the network by validators and delegators to validate the network and earn rewards',
    commission:
        'Fee charged by the validator for staking services; deducted from earned rewards',
    lastEpochRewards: 'The stake rewards collected during the last epoch',
    rewardsPool: 'Amount currently in this validator’s reward pool',
    checkpointParticipation: 'Coming Soon', // 'The percentage of checkpoints certified thus far by this validator.',
    votedLastRound: 'Did this validator vote in the latest round',
    tallyingScore: 'Coming Soon', // 'A score generated by validators to evaluate each other’s performance throughout Sui’s regular operations.',
    lastNarwhalRound: 'Coming Soon', //'Latest Narwhal round for this epoch.',
    proposedNextEpochGasPrice:
        "This validator's gas price quote for the next epoch",
};

const ValidatorDetail = () => {
    const { validatorAddress } = useParams();
    const { locale } = useIntl();

    const { data: validators, isLoading: isLoadingValidatorWithApy } =
        useValidatorsWithApy();
    const validator = validators?.[validatorAddress ?? ''];
    const [stakingPoolSuiBalanceFmt, stakingPoolSuiBalanceSymbol] =
        useFormatCoin(validator?.stakingPoolSuiBalance, SUI_TYPE_ARG);

    const [rewardsPoolFmt, rewardsPoolSymbol] = useFormatCoin(
        validator?.rewardsPool,
        SUI_TYPE_ARG
    );

    const computedCommissionRate = useMemo(() => {
        return (Number(validator?.commissionRate) / 100).toString();
    }, [validator?.commissionRate]);

    const numberOfValidators = useMemo(
        () => Object.values(validators || {}).length ?? null,
        [validators]
    );

    const { data: validatorEvents, isLoading: validatorsEventsLoading } =
        useValidatorsEvents({
            limit: numberOfValidators,
            order: 'descending',
        });

    const tallyingScore = useMemo(() => {
        const validatorEvent = validatorEvents?.find(({ parsedJson }) => {
            const validator_address = maybeGetValue<string>(
                parsedJson,
                'validator_address'
            );
            return validator_address === validatorAddress;
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tallyingRuleGlobalScore = maybeGetValue<any>(
            validatorEvent?.parsedJson,
            'tallying_rule_global_score'
        );
        return tallyingRuleGlobalScore || null;
    }, [validatorAddress, validatorEvents]);

    const validatorRewards = useMemo(() => {
        if (!validatorEvents || !validatorAddress) return 0;
        // const rewards = getValidatorMoveEvent(
        //     validatorEvents,
        //     validatorAddress
        // )?.pool_staking_reward;
        const moveEvent = getValidatorMoveEvent(
            validatorEvents,
            validatorAddress
        );
        let rewards;
        if (
            moveEvent &&
            typeof moveEvent === 'object' &&
            'pool_staking_reward' in moveEvent
        ) {
            rewards = moveEvent.pool_staking_reward;
        }

        return rewards ? Number(rewards) : null;
    }, [validatorAddress, validatorEvents]);

    const [validatorRewardsFmt, validatorRewardsSymbol] = useFormatCoin(
        validatorRewards,
        SUI_TYPE_ARG
    );

    return (
        <div className="flex flex-col items-center justify-center gap-5 mt-5">
            <div className="flex flex-col px-4 items-center justify-center gap-5">
                <ValidatorImage
                    validator={validator}
                    className="h-10 w-10 rounded-full object-contain"
                />
                <Subheader>{validator?.name}</Subheader>
                <Body>{validator?.description}</Body>
                <div>
                    <Body>Address</Body>
                    <CopyToClipboard
                        txt={validator?.suiAddress || ''}
                        mode="normal"
                        direction={TooltipDirection.DOWN}
                    >
                        <Body isSemibold>
                            {useMiddleEllipsis(
                                validator?.suiAddress || null,
                                27,
                                7
                            )}
                        </Body>
                    </CopyToClipboard>
                </div>
                <div className="mb-4">
                    <Body>Public Key</Body>
                    <CopyToClipboard
                        txt={validator?.protocolPubkeyBytes || ''}
                        mode="normal"
                        direction={TooltipDirection.DOWN}
                    >
                        <Body isSemibold>
                            {useMiddleEllipsis(
                                validator?.protocolPubkeyBytes || null,
                                32,
                                4
                            )}
                        </Body>
                    </CopyToClipboard>
                </div>
            </div>

            <div className="w-full">
                <Loading loading={isLoadingValidatorWithApy}>
                    <KeyValueList
                        TooltipComponent={AnimatedTooltip}
                        header="Sui Staked on Validator"
                        rowClassName="w-full border-t py-2 !mb-0"
                        keyNamesAndValues={[
                            {
                                keyName: 'Staking APY',
                                value: `${validator?.apy}%`,
                                keyHelpMessage:
                                    VALIDATOR_FIELD_INFO_TEXT_MAP.apy,
                            },
                            {
                                keyName: 'Total SUI Staked',
                                value: `${stakingPoolSuiBalanceFmt} ${stakingPoolSuiBalanceSymbol}`,
                                keyHelpMessage:
                                    VALIDATOR_FIELD_INFO_TEXT_MAP.totalSuiStaked,
                            },
                            {
                                keyName: 'Commission',
                                value: `${computedCommissionRate || '--'}%`,
                                keyHelpMessage:
                                    VALIDATOR_FIELD_INFO_TEXT_MAP.commission,
                            },
                        ]}
                    />
                </Loading>
            </div>

            <div className="w-full">
                <Loading
                    loading={
                        isLoadingValidatorWithApy && validatorsEventsLoading
                    }
                >
                    <KeyValueList
                        TooltipComponent={AnimatedTooltip}
                        header="Sui Staked on Validator"
                        rowClassName="w-full border-t py-2 !mb-0"
                        keyNamesAndValues={[
                            {
                                keyName: 'Last Epoch Rewards',
                                value: `${validatorRewardsFmt} ${validatorRewardsSymbol}`,
                                keyHelpMessage:
                                    VALIDATOR_FIELD_INFO_TEXT_MAP.lastEpochRewards,
                            },
                            {
                                keyName: 'Rewards Pool',
                                value: `${rewardsPoolFmt} ${rewardsPoolSymbol}`,
                                keyHelpMessage:
                                    VALIDATOR_FIELD_INFO_TEXT_MAP.rewardsPool,
                            },
                        ]}
                    />
                </Loading>
            </div>

            <div className="w-full">
                <Loading
                    loading={
                        isLoadingValidatorWithApy && validatorsEventsLoading
                    }
                >
                    <KeyValueList
                        TooltipComponent={AnimatedTooltip}
                        header="Network Participation"
                        rowClassName="w-full border-t py-2 !mb-0"
                        keyNamesAndValues={[
                            {
                                keyName: 'Checkpoint Participation',
                                value: '--',
                                keyHelpMessage:
                                    VALIDATOR_FIELD_INFO_TEXT_MAP.checkpointParticipation,
                            },
                            {
                                keyName: 'Voted Last Round',
                                value: '--',
                                keyHelpMessage:
                                    VALIDATOR_FIELD_INFO_TEXT_MAP.votedLastRound,
                            },
                            {
                                keyName: 'Tallying Score',
                                value: tallyingScore,
                                keyHelpMessage:
                                    VALIDATOR_FIELD_INFO_TEXT_MAP.tallyingScore,
                            },
                            {
                                keyName: 'Last Narwhal Round',
                                value: '--',
                                keyHelpMessage:
                                    VALIDATOR_FIELD_INFO_TEXT_MAP.lastNarwhalRound,
                            },
                            {
                                keyName: 'Proposed next epoch Gas Price',
                                value: `${ns.parse.numberString({
                                    numberString:
                                        validator?.nextEpochGasPrice || '',
                                    locale,
                                })} MIST`,
                                keyHelpMessage:
                                    VALIDATOR_FIELD_INFO_TEXT_MAP.proposedNextEpochGasPrice,
                            },
                        ]}
                    />
                </Loading>
            </div>
        </div>
    );
};

export default ValidatorDetail;

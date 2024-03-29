// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { Field, Form, useFormikContext } from 'formik';
import { memo, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

import AddressInput from '_components/address-input';
import LoadingIndicator from '_components/loading/LoadingIndicator';
import Loading from '_src/ui/app/components/loading';
import truncateMiddle from '_src/ui/app/helpers/truncate-middle';
import { useAppDispatch, useAppSelector } from '_src/ui/app/hooks';
import { CoinSelect } from '_src/ui/app/pages/home/home/CoinDropdown';
import { setSuiRecipient } from '_src/ui/app/redux/slices/forms';
import WalletColorAndEmojiCircle from '_src/ui/app/shared/WalletColorAndEmojiCircle';
import Button from '_src/ui/app/shared/buttons/Button';
import BodyLarge from '_src/ui/app/shared/typography/BodyLarge';
import SuiTxWalletList from '_src/ui/app/shared/wallet-list/SuiTxWalletList';

export type TransferCoinRecipientFormProps = {
    submitError: string | null;
    onClearSubmitError: () => void;
};

const vals = {
    to: '',
};

export type FormValues = typeof vals;

function TransferCoinRecipientForm({
    onClearSubmitError,
}: TransferCoinRecipientFormProps) {
    const accountInfos = useAppSelector(({ account }) => account.accountInfos);
    const activeAccountIndex = useAppSelector(
        ({ account: { activeAccountIndex } }) => activeAccountIndex
    );
    const { contacts } = useAppSelector(({ contacts }) => contacts);

    const [searchParams] = useSearchParams();
    const coinType = searchParams.get('type');
    const toAddress = searchParams.get('to');
    const disableToInput =
        searchParams.has('disableToInput') &&
        searchParams.get('disableToInput') === 'true';
    const hideWalletRecommendations =
        searchParams.has('hideWalletRecommendations') &&
        searchParams.get('hideWalletRecommendations') === 'true';

    const loading = false; //useAppSelector(({ txresults }) => txresults.loading);
    const dispatch = useAppDispatch();

    const {
        isSubmitting,
        isValid,
        errors,
        values: { to },
        setFieldValue,
    } = useFormikContext<FormValues>();

    const contact = useMemo(() => {
        return contacts.find(
            (contact) => contact.address === toAddress || contact.address === to
        );
    }, [contacts, toAddress, to]);

    const onClearRef = useRef(onClearSubmitError);
    onClearRef.current = onClearSubmitError;

    const handleOnblur = useCallback(
        (e: { target: { name: string } }) => {
            dispatch(
                setSuiRecipient({
                    to: e.target.name,
                    from:
                        accountInfos.find((a) => a.index === activeAccountIndex)
                            ?.nickname || 'Wallet',
                })
            );
        },
        [accountInfos, activeAccountIndex, dispatch]
    );

    if (!coinType) return <></>;

    return (
        <Loading loading={loading} big={true}>
            <Form autoComplete="off" noValidate={true}>
                <div className="pt-6 px-6 text-left flex flex-col absolute w-full bg-ethos-light-background-default dark:bg-ethos-dark-background-default">
                    <div
                        className={
                            'mb-6 flex flex-row items-center gap-6 relative z-5'
                        }
                    >
                        <BodyLarge isTextColorMedium>Sending</BodyLarge>
                        <CoinSelect selectedCoinType={coinType} />
                    </div>
                    <div className={'relative'}>
                        {disableToInput && contact ? (
                            <div className="flex flex-row items-center w-full gap-2 py-[16px] px-[20px] shadow-sm rounded-[16px] bg-ethos-light-background-secondary dark:bg-ethos-dark-background-secondary font-weight-ethos-body-large text-size-ethos-body-large leading-line-height-ethos-body-large tracking-letter-spacing-ethos-body-large border border-ethos-light-text-stroke">
                                <WalletColorAndEmojiCircle
                                    {...contact}
                                    circleSizeClasses="w-8 h-8"
                                    emojiSizeInPx={20}
                                />
                                <BodyLarge>
                                    {truncateMiddle(contact.address)}
                                </BodyLarge>
                            </div>
                        ) : (
                            <Field
                                placeholder={'0x... or SuiNS name'}
                                className={'flex flex-col gap-2 pl-0 pr-0'}
                                component={AddressInput}
                                name="to"
                                id="to"
                                label={'Recipient'}
                                onBlur={handleOnblur}
                                disabled={disableToInput}
                            />
                        )}
                        <div
                            className={`absolute top-0 right-0 mt-1 text-red-500 dark:text-red-400 ${
                                isValid && 'hidden'
                            }`}
                        >
                            {!isValid && to !== '' ? errors.to : ' '}
                        </div>
                    </div>
                </div>

                <div className={'pb-[80px] pt-[202px]'}>
                    {!hideWalletRecommendations && contacts.length > 0 && (
                        <SuiTxWalletList
                            header={'Address Book'}
                            wallets={contacts}
                            activeAccountIndex={activeAccountIndex}
                            setFieldValue={setFieldValue}
                        />
                    )}
                    {!hideWalletRecommendations && accountInfos.length > 1 && (
                        <SuiTxWalletList
                            header={'Transfer Between My Wallets'}
                            wallets={accountInfos}
                            activeAccountIndex={activeAccountIndex}
                            setFieldValue={setFieldValue}
                        />
                    )}
                </div>
                <div className="flex flex-col mb-2 absolute w-full bottom-[-10px] bg-ethos-light-background-default dark:bg-ethos-dark-background-default pt-4 rounded-b-2xl">
                    <Button
                        buttonStyle="primary"
                        type="submit"
                        disabled={!isValid || isSubmitting}
                        className="mt-2"
                    >
                        {isSubmitting ? <LoadingIndicator /> : 'Continue'}
                    </Button>
                </div>
            </Form>
        </Loading>
    );
}

export default memo(TransferCoinRecipientForm);

// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import cl from 'classnames';
import { ErrorMessage, Field, Form, useFormikContext } from 'formik';
import { memo, useEffect, useRef, useState, useCallback } from 'react';

import { Content } from '_app/shared/bottom-menu-layout';
import truncateMiddle from '_src/ui/app/helpers/truncate-middle';
import AddressInput from '_components/address-input';
import LoadingIndicator from '_components/loading/LoadingIndicator';
import NFTDisplayCard from '_components/nft-display';
import { DEFAULT_NFT_TRANSFER_GAS_FEE } from '_redux/slices/sui-objects/Coin';
import { useAppSelector } from '_src/ui/app/hooks';
import { type AccountInfo } from '_src/ui/app/KeypairVault';
import Button from '_src/ui/app/shared/buttons/Button';
import KeyValueList from '_src/ui/app/shared/content/rows-and-lists/KeyValueList';
import { AssetCard } from '_src/ui/app/shared/nfts/AssetCard';
import Body from '_src/ui/app/shared/typography/Body';
import BodyLarge from '_src/ui/app/shared/typography/BodyLarge';
import Header from '_src/ui/app/shared/typography/Header';

import type { FormValues } from '.';

import 'react-toastify/dist/ReactToastify.css';
import st from './TransferNFTForm.module.scss';

export type TransferNFTFormProps = {
    submitError: string | null;
    gasBalance: string;
    nftobj: any;
    onClearSubmitError: () => void;
};

function TransferNFTForm({
    submitError,
    gasBalance,
    nftobj,
    onClearSubmitError,
}: TransferNFTFormProps) {
    const {
        isSubmitting,
        isValid,
        dirty,
        values: { to, amount },
    } = useFormikContext<FormValues>();

    const [isReview, setIsReview] = useState(false);
    const onClearRef = useRef(onClearSubmitError);
    onClearRef.current = onClearSubmitError;

    const accountInfo = useAppSelector(
        ({ account: { accountInfos, activeAccountIndex } }) =>
            accountInfos.find(
                (accountInfo: AccountInfo) =>
                    (accountInfo.index || 0) === activeAccountIndex
            )
    );

    useEffect(() => {
        onClearRef.current();
    }, [to, amount]);

    const setIsReviewTrue = useCallback(() => {
        setIsReview(true);
    }, []);

    return (
        <div>
            <Content>
                <Form
                    className={st.container}
                    autoComplete="off"
                    noValidate={true}
                >
                    {!isReview ? (
                        <div className={'p-6'}>
                            <div className={'mb-6'}>
                                <BodyLarge
                                    className={
                                        'text-ethos-light-text-medium mb-4'
                                    }
                                >
                                    Sending
                                </BodyLarge>
                                {nftobj && (
                                    <NFTDisplayCard
                                        nftobj={nftobj}
                                        wideview={true}
                                    />
                                )}
                            </div>
                            <div
                                className={cl(
                                    st.group,
                                    dirty && to !== '' && !isValid
                                        ? st.invalidAddr
                                        : ''
                                )}
                            >
                                <Field
                                    className={
                                        'flex flex-col gap-2 text-left pl-0 pr-0'
                                    }
                                    component={AddressInput}
                                    name="to"
                                    label={'Recipient'}
                                />{' '}
                            </div>
                            <ErrorMessage
                                className="mt-1 text-red-500 dark:text-red-400"
                                name="to"
                                component="div"
                            />
                            {BigInt(gasBalance) <
                                DEFAULT_NFT_TRANSFER_GAS_FEE && (
                                <div className="mt-1 text-red-500 dark:text-red-400">
                                    * Insufficient balance to cover transfer
                                    cost
                                </div>
                            )}
                            <div
                                className={
                                    'mt-1 text-red-500 dark:text-red-400' &&
                                    submitError
                                        ? ''
                                        : 'hidden'
                                }
                            >
                                {submitError ? submitError : ' '}
                            </div>
                            <Button
                                isInline
                                buttonStyle="primary"
                                onClick={setIsReviewTrue}
                                disabled={!isValid || isSubmitting}
                                className={'mt-[100px]'}
                            >
                                Continue
                            </Button>
                        </div>
                    ) : (
                        <div>
                            {nftobj && (
                                <div>
                                    <div
                                        className={'pb-8 px-6 pt-6 text-center'}
                                    >
                                        <AssetCard
                                            isNft={true}
                                            imgUrl={
                                                nftobj.data.fields.url
                                                    ? nftobj.data.fields.url
                                                    : ''
                                            }
                                            name={nftobj.data.fields.name}
                                        />
                                        <Body
                                            className={
                                                'text-ethos-light-text-medium'
                                            }
                                        >
                                            Sending
                                        </Body>
                                        <Header
                                            className={
                                                'font-weight-ethos-subheader'
                                            }
                                        >
                                            {nftobj.data.fields.name}
                                        </Header>
                                    </div>

                                    <div className={'text-left'}>
                                        <KeyValueList
                                            keyNamesAndValues={[
                                                {
                                                    keyName: 'From',
                                                    value: accountInfo?.name
                                                        ? accountInfo?.name
                                                        : truncateMiddle(
                                                              nftobj.owner
                                                                  .AddressOwner
                                                          ),
                                                },
                                                {
                                                    keyName: 'To',
                                                    value: truncateMiddle(to),
                                                },
                                                {
                                                    keyName: 'NFT',
                                                    value: nftobj.data.fields
                                                        .name,
                                                },
                                                {
                                                    keyName: 'Transaction Fee',
                                                    value:
                                                        DEFAULT_NFT_TRANSFER_GAS_FEE +
                                                        ' MIST',
                                                },
                                            ]}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className={'p-6'}>
                                <Button
                                    isInline
                                    buttonStyle="primary"
                                    type="submit"
                                >
                                    {isSubmitting ? (
                                        <LoadingIndicator />
                                    ) : (
                                        'Confirm & Send'
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </Form>
            </Content>
        </div>
    );
}

export default memo(TransferNFTForm);

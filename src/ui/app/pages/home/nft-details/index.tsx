// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { ArrowUpRightIcon } from '@heroicons/react/24/outline';
import { getObjectId, hasPublicTransfer } from '@mysten/sui.js';
import { useCallback, useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import ExplorerLink from '_components/explorer-link';
import { ExplorerLinkType } from '_components/explorer-link/ExplorerLinkType';
import Loading from '_components/loading';
import { useAppSelector, useNFTBasicData } from '_hooks';
import { accountNftsSelector } from '_redux/slices/account';
import { truncateMiddle } from '_src/ui/app/helpers/truncate-string-middle';
import Button from '_src/ui/app/shared/buttons/Button';
import KeyValueList from '_src/ui/app/shared/content/rows-and-lists/KeyValueList';
import { BlurredImage } from '_src/ui/app/shared/images/BlurredBgImage';
import BodyLarge from '_src/ui/app/shared/typography/BodyLarge';
import Title from '_src/ui/app/shared/typography/Title';

import type { SuiObjectData } from '@mysten/sui.js';
import type { ButtonHTMLAttributes } from 'react';

function NFTdetailsContent({
    nft,
    onClick,
}: {
    nft: SuiObjectData;
    onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
}) {
    const { filePath, nftObjectID, nftFields, fileExtentionType } =
        useNFTBasicData(nft);

    let address;
    if (
        nft.owner &&
        typeof nft.owner !== 'string' &&
        'AddressOwner' in nft.owner
    ) {
        address = nft.owner.AddressOwner;
    }

    let has_public_transfer: boolean | undefined;
    if (nft.content && 'has_public_transfer' in nft.content) {
        has_public_transfer = nft.content.has_public_transfer as boolean;
    }

    return (
        <>
            <div>
                <div className="text-center w-full mb-6">
                    <div className={'px-6 pt-6'}>
                        <BlurredImage
                            imgSrc={filePath || ''}
                            fileExt={fileExtentionType?.name || 'NFT'}
                        />
                    </div>
                    <div className="p-6">
                        <Title className={'text-left mb-2'}>
                            {nftFields?.name}
                        </Title>
                        <BodyLarge
                            className={
                                'text-left text-ethos-light-text-medium dark:text-ethos-dark-text-medium font-weight-normal mb-6'
                            }
                        >
                            {nftFields?.description}
                        </BodyLarge>

                        {hasPublicTransfer(nft) && (
                            <Button
                                isInline
                                buttonStyle="primary"
                                className={'inline-block mb-0'}
                                onClick={onClick}
                            >
                                Send
                            </Button>
                        )}
                    </div>

                    <div className={'w-full text-left'}>
                        {/** 
                                 * 
                                 * Replace when NFT events are determined
                                 * 
                                 * 
                                <BodyLarge isSemibold className={'mb-3'}>
                                    Activity
                                </BodyLarge>
                                <NFTTransactionRows />*/}
                        <KeyValueList
                            header="Creator"
                            keyNamesAndValues={[
                                {
                                    keyName: 'Wallet Address',
                                    shortValue: truncateMiddle(address || ''),
                                    value: address || '',
                                },
                            ]}
                        />
                        <KeyValueList
                            header={'Details'}
                            keyNamesAndValues={[
                                {
                                    keyName: 'Has public transfer',
                                    value: has_public_transfer ? 'Yes' : 'No',
                                },
                                {
                                    keyName: 'Object ID',
                                    value: nft.objectId,
                                    shortValue: truncateMiddle(nft.objectId),
                                },
                                {
                                    keyName: 'Digest',
                                    value: nft.digest,
                                    shortValue: truncateMiddle(nft.digest),
                                },
                            ]}
                        />
                    </div>
                    <div
                        className={
                            'border-t-1 border-t-solid border-ethos-light-text-medium pt-8 px-6'
                        }
                    >
                        <div className={'flex flex-row justify-between'}>
                            <BodyLarge>
                                <ExplorerLink
                                    type={ExplorerLinkType.object}
                                    objectID={nftObjectID}
                                    title="View on Sui Explorer"
                                    showIcon={true}
                                >
                                    View on Sui Explorer
                                </ExplorerLink>
                            </BodyLarge>
                            <div
                                className={
                                    'text-ethos-light-text-medium dark:text-ethos-dark-text-medium'
                                }
                            >
                                <ExplorerLink
                                    type={ExplorerLinkType.object}
                                    objectID={nftObjectID}
                                    title="View on Sui Explorer"
                                    showIcon={true}
                                >
                                    <ArrowUpRightIcon width={16} height={16} />
                                </ExplorerLink>
                            </div>
                        </div>
                        {/*
                                
                                Add these buttons in when fully integrated with Keepsake and Clutchy
                                Currently no way to determine that the NFTs are located on either. 
                                
                                <LinkListWithIcon
                                    textAndLinks={[
                                        {
                                            text: 'View on Keepsake',
                                            link: {
                                                type: LinkType.External,
                                                to: 'https://ethoswallet.xyz/dev',
                                                children: 'Learn how →',
                                            },
                                        },
                                        {
                                            text: 'View on Clutchy',
                                            link: {
                                                type: LinkType.External,
                                                to: 'https://ethoswallet.xyz/dev',
                                                children: 'Learn how →',
                                            },
                                        },
                                    ]}
                                />
                                */}
                    </div>
                </div>
            </div>
        </>
    );
}

function NFTDetailsPage() {
    const [searchParams] = useSearchParams();
    const [selectedNFT, setSelectedNFT] = useState<SuiObjectData | null>(null);
    const navigate = useNavigate();
    const objectId = useMemo(
        () => searchParams.get('objectId'),
        [searchParams]
    );

    const nftCollections = useAppSelector(accountNftsSelector);

    const activeNFT = useMemo(() => {
        const selectedNFT = nftCollections.filter(
            (nftItem) => getObjectId(nftItem) === objectId
        )[0];
        setSelectedNFT(selectedNFT);
        return selectedNFT;
    }, [nftCollections, objectId]);

    const loading = useAppSelector(
        ({ suiObjects }) => suiObjects.loading && !suiObjects.lastSync
    );

    const transferNft = useCallback(() => {
        if (objectId) {
            navigate(
                `/nfts/transfer/recipient?${new URLSearchParams({
                    objectId: objectId,
                }).toString()}`
            );
        }
    }, [navigate, objectId]);

    if (!objectId || (!loading && !selectedNFT)) {
        return <Navigate to="/nfts" replace={true} />;
    }

    return (
        <div className="">
            <Loading loading={loading} big={true}>
                <NFTdetailsContent nft={activeNFT} onClick={transferNft} />
            </Loading>
        </div>
    );
}

export default NFTDetailsPage;

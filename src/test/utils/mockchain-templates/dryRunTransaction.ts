import type { DryRunTransactionBlockResponse } from '@mysten/sui.js/src/types/transactions';

export const makeDryRunTransactionResponse =
    (): DryRunTransactionBlockResponse => {
        return {
            effects: {
                messageVersion: 'v1',
                status: {
                    status: 'success',
                },
                executedEpoch: '25',
                gasUsed: {
                    computationCost: '1000',
                    storageCost: '26',
                    storageRebate: '0',
                    nonRefundableStorageFee: '0',
                },
                transactionDigest:
                    '9TpW8wFiTEdNgv5H53FF3rmtkjY8sRhc2y3aKntvKiKp',
                created: [
                    {
                        owner: {
                            AddressOwner:
                                '0xff263a941b9650b51207a674d59728f6f34102d366f4df5a59514bc3668602de',
                        },
                        reference: {
                            objectId:
                                '0xafff18843f4289b7bf2b21968dda52fdb9b829f640b6ee285bcc039a7d64d4cb',
                            version: 3,
                            digest: 'WTcTAQyt1mk7BCmG7MT11gM94CkK2644YynaiM4ozDK',
                        },
                    },
                ],
                mutated: [
                    {
                        owner: {
                            AddressOwner:
                                '0xff263a941b9650b51207a674d59728f6f34102d366f4df5a59514bc3668602de',
                        },
                        reference: {
                            objectId:
                                '0xf51bfc7d98d86fbd75f19d16c37484b0f0f7382eb6c9bfcad2fe4a94be2c8822',
                            version: 3,
                            digest: 'EPfwDgzWr3aajJEbg2BCipTbTBu9XDDhMuC7NEG7qr24',
                        },
                    },
                ],
                gasObject: {
                    owner: {
                        AddressOwner:
                            '0xff263a941b9650b51207a674d59728f6f34102d366f4df5a59514bc3668602de',
                    },
                    reference: {
                        objectId:
                            '0xf51bfc7d98d86fbd75f19d16c37484b0f0f7382eb6c9bfcad2fe4a94be2c8822',
                        version: 3,
                        digest: 'EPfwDgzWr3aajJEbg2BCipTbTBu9XDDhMuC7NEG7qr24',
                    },
                },
                eventsDigest: '6HLU895rkxPErbvVFwwGKSoEtfbWDaxSSLyvTsrWzKaJ',
                dependencies: [
                    'AYWVC7CXcFeycD6K11soBSpK8tEfhQRP2Vffh78m5Az',
                    '9GhSba92VsoY3BDJGgfqAYFzk2MDGuBgVj9pygL9dNmi',
                ],
            },
            events: [
                {
                    id: {
                        txDigest:
                            '9TpW8wFiTEdNgv5H53FF3rmtkjY8sRhc2y3aKntvKiKp',
                        eventSeq: '0',
                    },
                    packageId:
                        '0x0000000000000000000000000000000000000000000000000000000000000002',
                    transactionModule: 'devnet_nft',
                    sender: '0xff263a941b9650b51207a674d59728f6f34102d366f4df5a59514bc3668602de',
                    type: '0x2::devnet_nft::MintNFTEvent',
                    parsedJson: {
                        creator:
                            '0xff263a941b9650b51207a674d59728f6f34102d366f4df5a59514bc3668602de',
                        name: 'Ethos Example NFT',
                        object_id:
                            '0xafff18843f4289b7bf2b21968dda52fdb9b829f640b6ee285bcc039a7d64d4cb',
                    },
                    bcs: 'eN1rL8sgpMJo3SCCrZXQ5ZGskzZoBd9yTEZVV6fGGGXndMtpBzecXbPJhbgREsRYYuHhtFstse38G8pkKuF52nLRQK15ffSrRkpbnDNPJE9hybGf',
                },
            ],
            objectChanges: [
                {
                    type: 'mutated',
                    sender: '0xb0e24ba1afc3d2f5e348b569e72e94cf20ec2cecf3cd27edea1c3ad628e5374c',
                    owner: {
                        AddressOwner:
                            '0xb0e24ba1afc3d2f5e348b569e72e94cf20ec2cecf3cd27edea1c3ad628e5374c',
                    },
                    objectType: '0x2::coin::Coin<0x2::sui::SUI>',
                    objectId:
                        '0x4bdf155f9636864fdb996a182a65b6796230b9f92bed0124f54ddf2e08428f8b',
                    version: '2',
                    previousVersion: '1',
                    digest: 'GiAXLZmhxEVjjJJcqVokAZzJQS8tQGyPwuwkPo63ELCH',
                },
                {
                    type: 'created',
                    sender: '0xb0e24ba1afc3d2f5e348b569e72e94cf20ec2cecf3cd27edea1c3ad628e5374c',
                    owner: {
                        AddressOwner:
                            '0xed6fbd3df8a47bba33c1d45f97dd790590750813af37840eae5c43649e35103c',
                    },
                    objectType: '0x2::coin::Coin<0x2::sui::SUI>',
                    objectId:
                        '0xf490fd14f639282d5b574ec0ecf378266c74a03844041463dbca85427d608b79',
                    version: '2',
                    digest: '2teqSWFHzWFakz1aNBfjo2FqmeZxKsvHxRuaugN98Pjg',
                },
            ],
            balanceChanges: [
                {
                    owner: {
                        AddressOwner:
                            '0xb0e24ba1afc3d2f5e348b569e72e94cf20ec2cecf3cd27edea1c3ad628e5374c',
                    },
                    coinType: '0x2::sui::SUI',
                    amount: '99999999998998974',
                },
                {
                    owner: {
                        AddressOwner:
                            '0xed6fbd3df8a47bba33c1d45f97dd790590750813af37840eae5c43649e35103c',
                    },
                    coinType: '0x2::sui::SUI',
                    amount: '1000000',
                },
            ],
        };
    };

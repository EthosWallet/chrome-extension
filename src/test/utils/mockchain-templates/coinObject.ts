import type { SuiObjectResponse } from '@mysten/sui.js/src/types/objects';

export const makeCoinObject = (
    balance: number,
    id: string
): SuiObjectResponse => {
    return {
        data: {
            objectId: id,
            version: '2',
            digest: 'D8TAUrjwXtpYi1iLvLH2gxPFcdPJ3QGCDgkd7n9bDAxe',
            type: '0x2::coin::Coin<0x2::sui::SUI>',
            owner: {
                AddressOwner:
                    '0xff263a941b9650b51207a674d59728f6f34102d366f4df5a59514bc3668602de',
            },
            content: {
                dataType: 'moveObject',
                type: '0x2::coin::Coin<0x2::sui::SUI>',
                hasPublicTransfer: true,
                fields: {
                    balance: balance,
                    id: {
                        id: id,
                    },
                },
            },
        },
    };
};

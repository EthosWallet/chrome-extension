import type { SuiAddress } from '@mysten/sui.js';

export interface AccountCustomization {
    address: SuiAddress;
    nickname: string;
    color: string;
    emoji: string;
    nftPfpId?: string;
    nftPfpUrl?: string;
    invalidPackages?: {
        invalidPackageAdditions: string[];
        invalidPackageSubtractions: string[];
    };
}

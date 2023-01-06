import type { SuiAddress } from '@mysten/sui.js';

export interface AccountCustomization {
    address: SuiAddress;
    nickname: string;
    color: string;
    emoji: string;
}

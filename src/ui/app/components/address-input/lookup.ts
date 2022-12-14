import { getObjectVersion, JsonRpcProvider, Network } from '@mysten/sui.js';
import Browser from 'webextension-polyfill';

import { growthbook } from '../../experimentation/feature-gating';
import { FEATURES } from '../../experimentation/features';

import type { SuiAddress, SuiMoveObject, SuiObject } from '@mysten/sui.js';

const CACHE_DELAY = 1000 * 30;

const lookup = async (nameOrAddress: string): Promise<SuiAddress | string> => {
    const provider = new JsonRpcProvider(Network.DEVNET);

    const namesObjectId = growthbook.getFeatureValue(
        FEATURES.SUINS_REGISTRY,
        ''
    );
    const { suins: recordsInfo } = await Browser.storage.local.get('suins');

    const { version, timestamp } = recordsInfo || {};
    let { suiNSRecords } = recordsInfo || {};

    if (suiNSRecords && Date.now() - timestamp > CACHE_DELAY) {
        const ref = await provider.getObjectRef(namesObjectId);
        if (ref) {
            if (version !== getObjectVersion(ref)) {
                suiNSRecords = null;
            }
        }
        recordsInfo.timestamp = Date.now();
        Browser.storage.local.set({
            suins: recordsInfo,
        });
    }

    if (!suiNSRecords) {
        const namesObject = await provider.getObject(namesObjectId);
        if (namesObject.status === 'Exists') {
            const suiNamesObject = namesObject.details as SuiObject;
            const moveNameObject = suiNamesObject.data as SuiMoveObject;
            const records = moveNameObject.fields.records.fields.contents;

            suiNSRecords = {};
            for (const record of records) {
                const { key, value } = record.fields;
                const { owner } = value.fields;
                suiNSRecords[key] = owner;
                if (key.indexOf('addr.reverse') === -1) {
                    suiNSRecords[owner] = key;
                }
            }
            const { version } = suiNamesObject.reference;
            const timestamp = Date.now();
            Browser.storage.local.set({
                suins: {
                    version,
                    timestamp,
                    suiNSRecords,
                },
            });
        }
    }

    if (!suiNSRecords) return nameOrAddress;

    return suiNSRecords[nameOrAddress] || nameOrAddress;
};

export default lookup;

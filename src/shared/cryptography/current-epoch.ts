// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import networkEnv, { type NetworkEnvType } from '_src/background/NetworkEnv';
// import { getActiveNetworkSuiClient } from '_src/shared/sui-client';
import { api } from '_src/ui/app/redux/store/thunk-extras';

type EpochCacheInfo = {
    epoch: number;
    epochEndTimestamp: number;
};

function epochCacheKey(network: NetworkEnvType) {
    return `epoch_cache_${network.env}-${network.customRpcUrl}`;
}

async function getCurrentEpochRequest(): Promise<EpochCacheInfo> {
    const client = api.instance.client;
    // const suiClient = await getActiveNetworkSuiClient();
    const { epoch, epochDurationMs, epochStartTimestampMs } =
        await client.getLatestSuiSystemState();
    return {
        epoch: Number(epoch),
        epochEndTimestamp:
            Number(epochStartTimestampMs) + Number(epochDurationMs),
    };
}

export async function getCurrentEpoch() {
    const activeNetwork = await networkEnv.getActiveNetwork();
    // ❗❗❗ TODO FOR ETHOS: implement this cache ❗❗❗
    // const cache = await getFromSessionStorage<EpochCacheInfo>(epochCacheKey(activeNetwork));
    // if (cache && Date.now() <= cache.epochEndTimestamp) {
    // 	return cache.epoch;
    // }
    const { epoch, epochEndTimestamp } = await getCurrentEpochRequest();
    // const newCache: EpochCacheInfo = {
    // 	epoch,
    // 	epochEndTimestamp:
    // 		// add some extra time to existing epochEndTimestamp to avoid making repeating requests while epoch is changing
    // 		cache?.epoch === epoch ? cache.epochEndTimestamp + 5 * 1000 : epochEndTimestamp,
    // };
    // await setToSessionStorage(epochCacheKey(activeNetwork), newCache);
    return epoch;
}

import {
    type EventId,
    type SuiEvent,
    VALIDATORS_EVENTS_QUERY,
} from '@mysten/sui.js';
import { useQuery } from '@tanstack/react-query';

import { api } from '../../redux/store/thunk-extras';

type GetValidatorsEvent = {
    limit: number | null;
    order: 'ascending' | 'descending';
};

// NOTE: This tracks a mysten backend query limit - beware, and keep in sync.
const QUERY_MAX_RESULT_LIMIT = 50;

export function useValidatorsEvents({ limit, order }: GetValidatorsEvent) {
    const provider = api.instance.fullNode;

    return useQuery(
        ['validatorEvents', limit, order],
        async () => {
            if (!limit) {
                throw new Error(
                    `Limit needs to always be defined and non-zero! Received ${limit} instead.`
                );
            }

            if (limit > QUERY_MAX_RESULT_LIMIT) {
                let hasNextPage = true;
                let currCursor: EventId | null | undefined;
                const results: SuiEvent[] = [];

                while (hasNextPage && results.length < limit) {
                    const validatorEventsResponse = await provider.queryEvents({
                        query: { MoveEventType: VALIDATORS_EVENTS_QUERY },
                        cursor: currCursor,
                        limit: Math.min(limit, QUERY_MAX_RESULT_LIMIT),
                        order,
                    });

                    hasNextPage = validatorEventsResponse.hasNextPage;
                    currCursor = validatorEventsResponse.nextCursor;
                    results.push(...validatorEventsResponse.data);
                }
                return results.slice(0, limit);
            }

            const validatorEventsResponse = await provider.queryEvents({
                query: { MoveEventType: VALIDATORS_EVENTS_QUERY },
                limit,
                order,
            });
            return validatorEventsResponse.data;
        },
        { enabled: !!limit }
    );
}

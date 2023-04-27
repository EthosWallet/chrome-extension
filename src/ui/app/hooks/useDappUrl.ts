import { useMemo } from 'react';

import useAppSelector from './useAppSelector';

export default function useDappUrl(
    dappUrls: Record<string, string> | undefined
): { dappUrl: string | undefined; isLocal: boolean } {
    const [selectedApiEnv] = useAppSelector(({ app }) => [
        app.apiEnv,
        app.customRPC,
    ]);

    const dappUrl = useMemo(() => {
        if (!dappUrls) {
            return undefined;
        }
        return dappUrls[selectedApiEnv];
    }, [dappUrls, selectedApiEnv]);

    const isLocal = useMemo(() => {
        if (!dappUrl) {
            return false;
        }
        return !dappUrl.startsWith('http');
    }, [dappUrl]);

    return { dappUrl, isLocal };
}
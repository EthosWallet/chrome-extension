import { API_BASE_URL, EXPLORER_BASE_URL } from '../../constants';

type FetchData = {
    method: string;
    headers: Record<string, string>;
    body?: string;
};

type ApiCallArgs = {
    relativePath: string;
    method?: string;
    accessToken: string;
    body?: Record<string, string | number | object>;
    baseUrl?: string;
};

const ethosPlatformApiCall = async ({
    relativePath,
    method = 'GET',
    accessToken,
    body,
    baseUrl = API_BASE_URL,
}: ApiCallArgs) => {
    const data: FetchData = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
    };

    if (body) {
        data.body = JSON.stringify(body);
    }

    const response = await fetch(`${baseUrl}/api/${relativePath}`, data);
    const { status } = response;

    if (status !== 200) return { status };

    const json = await response.json();
    return { json, status };
};

export const explorerApiCall = async (
    relativePath: string,
    method = 'GET',
    accessToken: string,
    body?: Record<string, string | number | object>
) => {
    return ethosPlatformApiCall({
        relativePath,
        method,
        accessToken,
        body,
        baseUrl: EXPLORER_BASE_URL,
    });
};

export const authApiCall = async (
    relativePath: string,
    method = 'GET',
    accessToken: string,
    body?: Record<string, string | number | object>
) => {
    return ethosPlatformApiCall({
        relativePath,
        method,
        accessToken,
        body,
        baseUrl: API_BASE_URL,
    });
};

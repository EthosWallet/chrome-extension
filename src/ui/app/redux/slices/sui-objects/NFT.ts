import get from 'lodash/get';

import ipfs from '_src/ui/app/helpers/ipfs';
import utils from '_src/ui/app/helpers/utils';
import { safeUrl } from '_src/ui/app/hooks/useMediaUrl';

import type {
    SuiObjectData,
    SuiObjectResponse,
    SuiClient,
    DynamicFieldInfo,
    SuiMoveObject,
} from '@mysten/sui.js/client';

export type BagNFT = {
    id: string;
    owner?: string;
    name?: string;
    description?: string;
    url?: string;
};

export class NFT {
    public static isNFT(data: SuiObjectData): boolean {
        if (this.isBagNFT(data)) return true;

        let url: string | undefined;
        if (
            data.display?.data &&
            typeof data.display.data === 'object' &&
            ('image_url' in data.display.data ||
                'img_url' in data.display.data ||
                'url' in data.display.data)
        ) {
            url =
                data.display.data.image_url ??
                data.display.data.img_url ??
                data.display.data.url;
        }

        if (
            !url &&
            !!data.content &&
            'fields' in data.content &&
            'url' in data.content.fields &&
            !('ticket_id' in data.content.fields)
        ) {
            url =
                data.content.fields.url &&
                typeof data.content.fields.url === 'string'
                    ? data.content.fields.url
                    : undefined;
        }

        if (url) {
            return safeUrl(ipfs(url));
        }

        return false;
    }

    public static isKiosk(data: SuiObjectData): boolean {
        return (
            !!data.type &&
            data.type.includes('kiosk') &&
            !!data.content &&
            'fields' in data.content &&
            ('kiosk' in data.content.fields ||
                'for' in data.content.fields ||
                'cap' in data.content.fields)
        );
    }

    public static async getKioskObjects(
        client: SuiClient,
        data: SuiObjectData
    ): Promise<SuiObjectResponse[]> {
        if (!this.isKiosk(data)) return [];
        let kiosk = get(data, 'content.fields.kiosk');
        if (!kiosk) kiosk = get(data, 'content.fields.for');
        if (!kiosk) kiosk = get(data, 'content.fields.cap.fields.for');
        if (!kiosk) return [];
        let allKioskObjects: DynamicFieldInfo[] = [];
        let cursor: string | undefined | null;
        while (cursor !== null) {
            const response = await client.getDynamicFields({
                parentId: kiosk,
                cursor,
            });
            if (!response.data) return [];
            allKioskObjects = [...(allKioskObjects || []), ...response.data];
            if (!response.hasNextPage || response.nextCursor === cursor) {
                cursor = null;
            } else {
                cursor = response.nextCursor;
            }
        }

        const relevantKioskObjects = allKioskObjects.filter(
            (kioskObject) =>
                kioskObject.name.type ===
                    '0x0000000000000000000000000000000000000000000000000000000000000002::kiosk::Item' ||
                kioskObject.name.type === '0x2::kiosk::Item'
        );
        const objectIds = relevantKioskObjects.map((item) => item.objectId);

        let objects: SuiObjectResponse[] = [];
        const groupSize = 30;
        for (let i = 0; i < objectIds.length; i += groupSize) {
            const group = objectIds.slice(i, i + groupSize);

            const groupObjects = await client.multiGetObjects({
                ids: group,
                options: {
                    showContent: true,
                    showType: true,
                    showDisplay: true,
                    showOwner: true,
                },
            });

            objects = [...objects, ...groupObjects];
        }

        return objects;
    }

    public static isBagNFT(data: SuiObjectData): boolean {
        return (
            !!data.content &&
            'fields' in data.content &&
            'logical_owner' in data.content.fields &&
            'bag' in data.content.fields
        );
    }

    public static async parseBagNFT(
        client: SuiClient,
        data: SuiObjectData
    ): Promise<SuiObjectData | BagNFT> {
        if (!this.isBagNFT(data)) return data;

        const id = get(data, 'objectId');
        const bagId = get(data, 'content.fields.bag.fields.id.id');
        const owner = get(data, 'content.fields.logical_owner');

        if (!bagId) return data;

        const { data: bagObjects } = await client.getDynamicFields({
            parentId: bagId,
        });
        const objectIds = bagObjects.map((bagObject) => bagObject.objectId);
        const objects = await client.multiGetObjects({
            ids: objectIds,
            options: {
                showContent: true,
                showType: true,
                showDisplay: true,
                showOwner: true,
            },
        });
        return {
            id,
            owner,
            ...parseDomains(objects),
        };
    }
}

export interface WithIds {
    objectIds: string[];
}

type FetchFnParser<RpcResponse, DataModel> = (
    typedData: RpcResponse,
    suiObject: SuiObjectData,
    rpcResponse: SuiObjectResponse
) => DataModel | undefined;

type SuiObjectParser<RpcResponse, DataModel> = {
    parser: FetchFnParser<RpcResponse, DataModel>;
    regex: RegExp;
};

type ID = {
    id: string;
};

type Bag = {
    type: string;
    fields: {
        id: ID;
        size: number;
    };
};

type NftRpcResponse = {
    logical_owner: string;
    bag: Bag;
};

type NftRaw = {
    id: string;
    logicalOwner: string;
    bagId: string;
};

type DomainRpcBase<T> = {
    id: ID;
    name: {
        type: string;
        fields: {
            dummy_field: boolean;
        };
    };
    value: {
        type: string;
        fields: T;
    };
};

type UrlDomainRpcResponse = DomainRpcBase<{
    url: string;
}>;

type DisplayDomainRpcResponse = DomainRpcBase<{
    description: string;
    name: string;
}>;

type NftDomains = {
    url: string;
    name: string;
    description: string;
};

export type Nft = {
    nft: NftRaw;
    fields?: Partial<NftDomains>;
};

const NftRegex =
    /(0x[a-f0-9]{39,40})::nft::Nft<0x[a-f0-9]{39,40}::([a-zA-Z]{1,})::([a-zA-Z]{1,})>/;
const UrlDomainRegex =
    /0x0000000000000000000000000000000000000000000000000000000000000002::dynamic_field::Field<(0x[a-f0-9]{39,40})::utils::Marker<(0x[a-f0-9]{39,40})::display::UrlDomain>, (0x[a-f0-9]{39,40})::display::UrlDomain>/;
const DisplayDomainRegex =
    /0x0000000000000000000000000000000000000000000000000000000000000002::dynamic_field::Field<(0x[a-f0-9]{39,40})::utils::Marker<(0x[a-f0-9]{39,40})::display::DisplayDomain>, (0x[a-f0-9]{39,40})::display::DisplayDomain>/;

export const NftParser: SuiObjectParser<NftRpcResponse, NftRaw> = {
    parser: (data, suiData, rpcResponse) => {
        if (
            rpcResponse.data &&
            typeof rpcResponse.data === 'object' &&
            'owner' in rpcResponse.data
        ) {
            const { owner } = rpcResponse.data;

            const matches = (suiData.content as SuiMoveObject).type.match(
                NftRegex
            );
            if (!matches) {
                return undefined;
            }
            const packageObjectId = matches[1];
            const packageModule = matches[2];
            const packageModuleClassName = matches[3];

            return {
                owner,
                type: suiData.content?.dataType,
                id: rpcResponse.data?.objectId,
                packageObjectId,
                packageModule,
                packageModuleClassName,
                rawResponse: rpcResponse,
                logicalOwner: data.logical_owner,
                bagId: data.bag.fields.id.id,
            };
        }
        return undefined;
    },
    regex: NftRegex,
};

const isTypeMatchRegex = (d: SuiObjectResponse, regex: RegExp) => {
    const { data } = d;
    if (data) {
        const { content } = data;
        if (content && 'type' in content) {
            return content.type.match(regex);
        }
    }
    return false;
};

export const parseDomains = (domains: SuiObjectResponse[]) => {
    const response: Partial<NftDomains> = {};
    const urlDomain = domains.find((d) => isTypeMatchRegex(d, UrlDomainRegex));
    const displayDomain = domains.find((d) =>
        isTypeMatchRegex(d, DisplayDomainRegex)
    );

    if (urlDomain && utils.getObjectFields(urlDomain)) {
        const url = (utils.getObjectFields(urlDomain) as UrlDomainRpcResponse)
            .value.fields.url;
        response.url = ipfs(url);
    }
    if (displayDomain && utils.getObjectFields(displayDomain)) {
        response.description = (
            utils.getObjectFields(displayDomain) as DisplayDomainRpcResponse
        ).value.fields.description;
        response.name = (
            utils.getObjectFields(displayDomain) as DisplayDomainRpcResponse
        ).value.fields.name;
    }

    return response;
};

export class NftClient {
    private client: SuiClient;

    constructor(client: SuiClient) {
        this.client = client;
    }

    parseObjects = async (objects: SuiObjectResponse[]): Promise<NftRaw[]> => {
        const parsedObjects = objects
            .map((object) => {
                // if (getObjectType(object)?.match(NftParser.regex)) {
                //     const data = getSuiObjectData(object);
                //     if (data) {
                //         return NftParser.parser(
                //             getObjectFields(object) as NftRpcResponse,
                //             data,
                //             object
                //         );
                //     }
                // }
                if (object.data) {
                    const data = object.data;
                    if (data) {
                        return NftParser.parser(
                            utils.getObjectFields(object) as NftRpcResponse,
                            data,
                            object
                        );
                    }
                }
                return undefined;
            })
            .filter((object): object is NftRaw => !!object);

        return parsedObjects;
    };

    fetchAndParseObjectsById = async (ids: string[]): Promise<NftRaw[]> => {
        if (ids.length === 0) {
            return new Array<NftRaw>();
        }
        const objects = await this.client.multiGetObjects({
            ids,
            options: {
                showContent: true,
                showType: true,
                showDisplay: true,
                showOwner: true,
            },
        });
        return this.parseObjects(objects);
    };

    getBagContent = async (bagId: string) => {
        const bagObjects = await this.client.getDynamicFields({
            parentId: bagId,
        });
        const objectIds = bagObjects.data.map(
            (bagObject) => bagObject.objectId
        );
        return this.client.multiGetObjects({
            ids: objectIds,
            options: {
                showContent: true,
                showType: true,
                showDisplay: true,
                showOwner: true,
            },
        });
    };

    getNftsById = async (params: WithIds): Promise<Nft[]> => {
        const nfts = await this.fetchAndParseObjectsById(params.objectIds);
        const bags = await Promise.all(
            nfts.map(async (nft) => {
                const content = await this.getBagContent(nft.bagId);
                return {
                    nftId: nft.id,
                    content: parseDomains(content),
                };
            })
        );
        const bagsByNftId = new Map(bags.map((b) => [b.nftId, b]));

        return nfts.map((nft) => {
            const fields = bagsByNftId.get(nft.id);
            return {
                nft,
                fields: fields?.content,
            };
        });
    };
}

// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { memo, useMemo } from 'react';

import { Explorer } from './Explorer';
import { ExplorerLinkType } from './ExplorerLinkType';
import Body from '../../shared/typography/Body';
import EthosLink from '../../shared/typography/EthosLink';
import { useAppSelector } from '_hooks';
import { activeAccountSelector } from '_redux/slices/account';
import { LinkType } from '_src/enums/LinkType';

import type { ReactNode } from 'react';

export type ExplorerLinkProps = (
    | {
          type: ExplorerLinkType.address;
          address: string;
          useActiveAddress?: false;
      }
    | {
          type: ExplorerLinkType.address;
          useActiveAddress: true;
      }
    | { type: ExplorerLinkType.object; objectID: string }
    | { type: ExplorerLinkType.transaction; transactionID: string }
) & {
    children?: ReactNode;
    className?: string;
    title?: string;
    showIcon?: boolean;
};

function useAddress(props: ExplorerLinkProps) {
    const { type } = props;
    const isAddress = type === ExplorerLinkType.address;
    const isProvidedAddress = isAddress && !props.useActiveAddress;
    const activeAddress = useAppSelector(activeAccountSelector);
    return isProvidedAddress ? props.address : activeAddress;
}

function ExplorerLink(props: ExplorerLinkProps) {
    const { type, children } = props;
    const address = useAddress(props);
    const selectedApiEnv = useAppSelector(({ app }) => app.apiEnv);
    const objectID = type === ExplorerLinkType.object ? props.objectID : null;
    const transactionID =
        type === ExplorerLinkType.transaction ? props.transactionID : null;
    const explorerHref = useMemo(() => {
        switch (type) {
            case ExplorerLinkType.address:
                return (
                    address && Explorer.getAddressUrl(address, selectedApiEnv)
                );
            case ExplorerLinkType.object:
                return (
                    objectID && Explorer.getObjectUrl(objectID, selectedApiEnv)
                );
            case ExplorerLinkType.transaction:
                return (
                    transactionID &&
                    Explorer.getTransactionUrl(transactionID, selectedApiEnv)
                );
        }
    }, [type, address, objectID, transactionID, selectedApiEnv]);
    if (!explorerHref) {
        return null;
    }

    return (
        <Body>
            <EthosLink type={LinkType.External} to={explorerHref}>
                {children}
            </EthosLink>
        </Body>
    );
}

export default memo(ExplorerLink);

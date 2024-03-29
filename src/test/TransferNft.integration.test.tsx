import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderTemplate } from './utils/json-templates';
import { MockJsonRpc } from '_src/test/utils/mock-json-rpc';
import { mockBlockchain } from '_src/test/utils/mockchain';
import { makeDryRunTransactionResponse } from '_src/test/utils/mockchain-templates/dryRunTransaction';
import { renderApp } from '_src/test/utils/react-rendering';
import { simulateMnemonicUser } from '_src/test/utils/storage';

describe('Creating and sending an NFT', () => {
    let mockJsonRpc: MockJsonRpc;
    beforeEach(async () => {
        mockJsonRpc = new MockJsonRpc();
        simulateMnemonicUser();
    });

    test('rendering an empty state for the nfts page', async () => {
        mockBlockchain(mockJsonRpc, {
            coinTransaction: 500000,
        });
        renderApp({ initialRoute: '/nfts' });
        await screen.findByText('NFTs');
    });

    test('rendering the nfts page with an nft populated', async () => {
        mockBlockchain(mockJsonRpc, {
            nftDetails: {
                name: 'nft-test',
            },
        });

        renderApp({ initialRoute: '/nfts' });
        await screen.findByText('NFTs');
        await screen.findByTestId('nft-test');
    });

    test('Transfer the NFT', async () => {
        const nftName = 'nft-test';

        mockBlockchain(mockJsonRpc, {
            coinTransaction: 500000,
            nftDetails: {
                name: 'nft-test',
            },
        });

        mockJsonRpc.mockJsonRpcCall(
            {
                method: 'suix_getCoins',
                params: [
                    '0xff263a941b9650b51207a674d59728f6f34102d366f4df5a59514bc3668602de',
                    '0x2::sui::SUI',
                    null,
                    null,
                ],
            },
            renderTemplate('getCoins', {}),
            true
        );

        mockJsonRpc.mockJsonRpcCall(
            { method: 'suix_getReferenceGasPrice', params: [] },
            '1',
            true
        );

        mockJsonRpc.mockJsonRpcCall(
            {
                method: 'sui_dryRunTransactionBlock',
                params: [
                    'AAACAQAAAAAAAAAAAAAAAAD9nP+f1r76Dn1kgdDurgIFayykbgIAAAAAAAAAILQ05FL3B9P9W9lDQSn+qxJ4xlecVIEEGW7AePU4yGwfACCMF1mug0FubdgPzMY2gCPz+LFf+0RZwF43JzIjuWUa1wEBAQEAAAEBAP8mOpQbllC1EgemdNWXKPbzQQLTZvTfWllRS8NmhgLeAP8mOpQbllC1EgemdNWXKPbzQQLTZvTfWllRS8NmhgLeAQAAAAAAAAAAdDukCwAAAAA=',
                ],
            },
            makeDryRunTransactionResponse(),
            true
        );

        mockJsonRpc.mockJsonRpcCall(
            {
                method: 'sui_dryRunTransactionBlock',
                params: [
                    'AAACAQAAAAAAAAAAAAAAAAD9nP+f1r76Dn1kgdDurgIFayykbgIAAAAAAAAAILQ05FL3B9P9W9lDQSn+qxJ4xlecVIEEGW7AePU4yGwfACCMF1mug0FubdgPzMY2gCPz+LFf+0RZwF43JzIjuWUa1wEBAQEAAAEBAP8mOpQbllC1EgemdNWXKPbzQQLTZvTfWllRS8NmhgLeAfUb/H2Y2G+9dfGdFsN0hLDw9zgutsm/ytL+SpS+LIgiAgAAAAAAAAAgtDTkUvcH0/1b2UNBKf6rEnjGV5xUgQQZbsB49TjIbB//JjqUG5ZQtRIHpnTVlyj280EC02b031pZUUvDZoYC3gEAAAAAAAAA6gcAAAAAAAAA',
                ],
            },
            makeDryRunTransactionResponse(),
            true
        );

        mockJsonRpc.mockJsonRpcCall(
            {
                method: 'sui_executeTransactionBlock',
                params: [
                    'AAACAQAAAAAAAAAAAAAAAAD9nP+f1r76Dn1kgdDurgIFayykbgIAAAAAAAAAILQ05FL3B9P9W9lDQSn+qxJ4xlecVIEEGW7AePU4yGwfACCMF1mug0FubdgPzMY2gCPz+LFf+0RZwF43JzIjuWUa1wEBAQEAAAEBAP8mOpQbllC1EgemdNWXKPbzQQLTZvTfWllRS8NmhgLeAfUb/H2Y2G+9dfGdFsN0hLDw9zgutsm/ytL+SpS+LIgiAgAAAAAAAAAgtDTkUvcH0/1b2UNBKf6rEnjGV5xUgQQZbsB49TjIbB//JjqUG5ZQtRIHpnTVlyj280EC02b031pZUUvDZoYC3gEAAAAAAAAA6gcAAAAAAAAA',
                    ['MOCK SIGNATURE'],
                    {
                        showEffects: true,
                        showEvents: true,
                        showInput: true,
                    },
                    null,
                ],
            },
            renderTemplate('executeTransaction', {})
        );

        renderApp({ initialRoute: '/nfts' });

        const nftItem = await screen.findByTestId(nftName);
        userEvent.click(nftItem);

        await screen.findByText('Wallet Address');
        await screen.findByText('Has public transfer');
        await screen.findByText('Object ID');
        await screen.findByText('Digest');

        const sendBtn = await screen.findByText('Send');
        userEvent.click(sendBtn);

        await screen.findByText('Recipient');

        const recipientInput = await screen.findByPlaceholderText(
            '0x... or SuiNS name'
        );

        fireEvent.change(recipientInput, {
            target: {
                value: '0x8c1759ae83416e6dd80fccc6368023f3f8b15ffb4459c05e37273223b9651ad7',
            },
        });

        const continueBtn = await screen.findByText('Continue');

        userEvent.click(continueBtn);

        await screen.findByText('NFT');
        await screen.findByText('Transaction Fee');

        const confirmBtn = await screen.findByText('Confirm & Send');
        userEvent.click(confirmBtn);

        await screen.findByText(
            'Submitting transaction...',
            {},
            { timeout: 5000 }
        );

        // Account for the delay in displaying the 'transaction successful alert'
        await new Promise((r) => setTimeout(r, 500));

        await screen.findByText('Transaction successful.');
    });
});

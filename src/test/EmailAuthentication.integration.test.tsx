import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import nock from 'nock';

import { mockBlockchain } from './utils/mockchain';
import { fakeAccessToken } from './utils/storage';
import { BASE_URL } from '_src/shared/constants';
import { setSession } from '_src/shared/storagex/store';
import { MockJsonRpc } from '_src/test/utils/mock-json-rpc';
import { renderApp } from '_src/test/utils/react-rendering';

describe('Email Authentication', () => {
    const address = '0x218d1ea2ce30efd16394f81569f69cf8531d05ea';

    let mockJsonRpc: MockJsonRpc;
    beforeEach(() => {
        mockJsonRpc = new MockJsonRpc();
    });

    test('User can enter email and is prompted to wait for the magic login link', async () => {
        nock(BASE_URL, {
            reqheaders: { 'x-supabase-access-token': fakeAccessToken },
        })
            .persist()
            .post('/api/wallet/accounts')
            .reply(200, {
                accounts: [
                    {
                        address,
                        index: 0,
                    },
                ],
            });

        renderApp();
        await screen.findByText(
            'A re-imagined wallet for discovering apps, games, and NFTs on Sui'
        );
        await userEvent.click(screen.getByText('Sign in with Email'));
        await userEvent.type(
            screen.getByRole('textbox', { name: 'Email address' }),
            'sam@example.com'
        );
        await userEvent.click(screen.getByTestId('submit'));

        // simulate the iframe sending a message back to the extension that the magic email link has been sent
        window.dispatchEvent(
            new MessageEvent('message', {
                source: window,
                origin: 'http://localhost:3000',
                data: { action: 'login' },
            })
        );

        await screen.findByText('We sent you an email!');
    });

    test('User can see tokens page after logged in via the iframe', async () => {
        const fakeAccessToken = '12345';
        await setSession({ accessToken: fakeAccessToken });
        mockBlockchain(mockJsonRpc, { address });
        nock(BASE_URL, {
            reqheaders: { 'x-supabase-access-token': fakeAccessToken },
        })
            .post('/api/wallet/accounts')
            .reply(200, {
                accounts: [
                    {
                        address,
                        index: 0,
                    },
                ],
            });

        renderApp({
            initialRoute: '/initialize/hosted/logging-in',
        });

        await screen.findByText('Get started with Sui');
    });
});

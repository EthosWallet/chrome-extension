import { act, screen } from '@testing-library/react';
import * as React from 'react';

import App from '_app/index';
import { setTransactionRequests } from '_redux/slices/transaction-requests';
import { simulateAuthenticatedUser } from '_src/test/utils/fake-local-storage';
import { mockCommonCalls } from '_src/test/utils/mockchain';
import { renderWithProviders } from '_src/test/utils/react-rendering';

import type { TransactionRequest } from '_payloads/transactions';

describe('The Transaction Approval popup', () => {
    beforeEach(async () => {
        simulateAuthenticatedUser();
    });

    test('it shows basic info about the transaction', async () => {
        mockCommonCalls();
        const view = renderWithProviders(<App />, {
            initialRoute: '/tx-approval/95ae4a0d-0b7b-478b-ab70-bc3fe291540e',
        });

        const txRequest: TransactionRequest = {
            id: '95ae4a0d-0b7b-478b-ab70-bc3fe291540e',
            approved: null,
            origin: 'https://ethoswallet.xyz',
            originFavIcon: 'https://ethoswallet.xyz/favicon.ico',
            createdDate: '2022-11-29T23:33:53.084Z',
            tx: {
                type: 'v2',
                data: {
                    kind: 'pay',
                    data: {
                        inputCoins: [
                            '0x19fe0d83a3e3cb15570b6edc1160a15cc894e690',
                        ],
                        recipients: [
                            '0x1ce5033e82ae9a48ea743b503d96b49b9c57fe0b',
                        ],
                        amounts: [1000000],
                        gasBudget: 1000,
                    },
                },
            },
        };

        act(() => {
            view.store.dispatch(setTransactionRequests([txRequest]));
        });
        await screen.findByText('Transfer Asset');
    });
});

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash';
import nock from 'nock';

import KeypairVault from '_app/KeypairVault';
import { BackgroundClient } from '_app/background-client';
import { setTransactionRequests } from '_redux/slices/transaction-requests';
import { simulateAuthenticatedUser } from '_src/test/utils/fake-local-storage';
import { renderTemplate } from '_src/test/utils/json-templates';
import { mockCommonCalls } from '_src/test/utils/mockchain';
import { renderApp } from '_src/test/utils/react-rendering';
import { createStore } from '_store';
import { thunkExtras } from '_store/thunk-extras';

import type { TransactionRequest } from '_payloads/transactions';
import type { AppStore } from '_store';

describe('The Transaction Approval popup', () => {
    let store: AppStore;
    beforeEach(async () => {
        mockCommonCalls();
        simulateAuthenticatedUser();
        store = createStore({});

        // TODO: consider moving this code to a common place. these objects hold state and every test should start
        //  with a clean slate
        thunkExtras.background = new BackgroundClient();
        thunkExtras.background.init(store.dispatch);
        thunkExtras.keypairVault = new KeypairVault();
    });

    test('shows the transaction and allows user to approve it', async () => {
        const { txRequestId } = simulateReduxStateWithTransaction();
        const { executeScope } = mockBlockchainTransactionExecution();

        const mockWindowCloser = jest.fn();
        renderApp({
            store: store,
            initialRoute: `/tx-approval/${txRequestId}`,
            dependencies: { closeWindow: mockWindowCloser },
        });

        await screen.findByText('1500000');
        const approveButton = await screen.findByText('Approve');

        await userEvent.click(approveButton);
        await waitFor(() => {
            expect(mockWindowCloser.mock.calls.length).toEqual(1);
        });

        expect(executeScope.isDone()).toBeTruthy();
    });

    test('the user can reject the transaction', async () => {
        const { txRequestId } = simulateReduxStateWithTransaction();
        const { executeScope } = mockBlockchainTransactionExecution();

        const mockWindowCloser = jest.fn();
        renderApp({
            store: store,
            initialRoute: `/tx-approval/${txRequestId}`,
            dependencies: { closeWindow: mockWindowCloser },
        });

        await screen.findByText('1500000');
        const rejectButton = await screen.findByText('Reject');

        await userEvent.click(rejectButton);
        await waitFor(() =>
            expect(mockWindowCloser.mock.calls.length).toEqual(1)
        );

        expect(executeScope.isDone()).toBeFalsy();
    });

    function simulateReduxStateWithTransaction() {
        const txRequestId = '95ae4a0d-0b7b-478b-ab70-bc3fe291540e';
        const txRequest: TransactionRequest = {
            id: txRequestId,
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
                        amounts: [1500000],
                        gasBudget: 1000,
                    },
                },
            },
        };

        store.dispatch(setTransactionRequests([txRequest]));
        return { txRequestId };
    }

    function mockBlockchainTransactionExecution() {
        const payScope = nock('http://testNet-fullnode.example.com')
            .persist() // this gets called twice in the case where the transaction is approved
            .post('/', /sui_pay/)
            .reply(200, {
                jsonrpc: '2.0',
                result: renderTemplate('pay', {
                    base64EncodedTxBytes: 'ZmFrZSBkYXRh',
                }),
                id: 'fbf9bf0c-a3c9-460a-a999-b7e87096dd1c',
            });

        // note: this is only expected to be called once
        const dryRunTransactionScope = nock(
            'http://testNet-fullnode.example.com'
        )
            .post(
                '/',
                _.matches({
                    method: 'sui_dryRunTransaction',
                    params: ['ZmFrZSBkYXRh'],
                })
            )
            .reply(200, {
                jsonrpc: '2.0',
                result: renderTemplate('dryRunTransaction', {}),
                id: 'd48d0fe2-688d-456c-91b1-45122ebb4812',
            });

        const getObjectForDryRunScope = nock(
            'http://testNet-fullnode.example.com'
        )
            .post(
                '/',
                _.matches({
                    method: 'sui_getObject',
                    params: ['0x19fe0d83a3e3cb15570b6edc1160a15cc894e690'],
                })
            )
            .reply(200, {
                jsonrpc: '2.0',
                result: renderTemplate('coinObject', {
                    balance: 40000000,
                    id: '0x395c50c614cc22156c9de8db24163f48e4ff66ae',
                }),
                id: 'fbf9bf0c-a3c9-460a-a999-b7e87096dd1c',
            });

        const getCoinsForDryRunScope = nock(
            'http://testNet-fullnode.example.com'
        )
            .post(
                '/',
                _.matches({
                    method: 'sui_getCoins',
                    params: [
                        '1ce5033e82ae9a48ea743b503d96b49b9c57fe0b',
                        '0x2::sui::SUI',
                        null,
                        null,
                    ],
                })
            )
            .reply(200, {
                jsonrpc: '2.0',
                result: renderTemplate('getCoins', {}),
                id: '2d26cac8-6480-4f65-b7d2-c83e71b5900a',
            });

        const getObjectForDryRunScope2 = nock(
            'http://testNet-fullnode.example.com'
        )
            .post(
                '/',
                _.matches([
                    {
                        method: 'sui_getObject',
                        jsonrpc: '2.0',
                        params: ['0x19fe0d83a3e3cb15570b6edc1160a15cc894e690'],
                    },
                ])
            )
            .reply(200, [
                {
                    jsonrpc: '2.0',
                    result: renderTemplate('coinObject', {
                        balance: 50000000,
                        id: '0x19fe0d83a3e3cb15570b6edc1160a15cc894e690',
                    }),
                    id: '74a3abb0-bd8a-48bb-a98a-861d8b37297a',
                },
            ]);

        const executeScope = nock('http://testNet-fullnode.example.com')
            .post(
                '/',
                _.matches({
                    method: 'sui_executeTransactionSerializedSig',
                    params: ['ZmFrZSBkYXRh'],
                })
            )
            .reply(200, {
                jsonrpc: '2.0',
                result: renderTemplate('executeTransaction', {}),
                id: 'fbf9bf0c-a3c9-460a-a999-b7e87096dd1c',
            });

        return {
            executeScope,
            dryRunTransactionScope,
            getObjectForDryRunScope,
            getCoinsForDryRunScope,
            getObjectForDryRunScope2,
            payScope,
        };
    }
});

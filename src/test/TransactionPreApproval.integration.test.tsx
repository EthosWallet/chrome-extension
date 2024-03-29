import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { faker } from './utils/faker';
import { rpcMocks } from './utils/mockchain';
import { renderApp } from './utils/react-rendering';
import { simulateMnemonicUser } from './utils/storage';
import { PREAPPROVAL_KEY } from '_shared/constants';
import { setEncrypted } from '_shared/storagex/store';
import { MockJsonRpc } from '_src/test/utils/mock-json-rpc';
import { makeTestDeps } from '_src/test/utils/test-dependencies';

describe('transaction pre-approval flow', () => {
    let mockJsonRpc: MockJsonRpc;
    const id = '46987523-cadf-47c1-906a-baa0ce5b62c5';

    beforeEach(async () => {
        mockJsonRpc = new MockJsonRpc();
        simulateMnemonicUser();
        rpcMocks(mockJsonRpc).sui_getNormalizedMoveFunction();

        await setEncrypted({
            key: PREAPPROVAL_KEY,
            value: JSON.stringify([faker.preapprovalRequest({ id })]),
            strong: false,
            session: true,
        });
    });

    test('can accept transaction pre-approvals', async () => {
        const testDeps = makeTestDeps();
        const mockWindowCloser = testDeps.closeWindow;

        renderApp({
            initialRoute: `/preapproval/${id}`,
            dependencies: testDeps,
        });

        await screen.findByText('Pre-Approve Transactions');
        const approveButton = await screen.findByRole('button', {
            name: 'Approve',
        });
        await userEvent.click(approveButton);
        await waitFor(() =>
            expect(mockWindowCloser.mock.calls.length).toEqual(1)
        );
    });

    test('can reject transaction pre-approvals', async () => {
        const testDeps = makeTestDeps();
        const mockWindowCloser = testDeps.closeWindow;

        renderApp({
            initialRoute: `/preapproval/${id}`,
            dependencies: testDeps,
        });

        await screen.findByText('Pre-Approve Transactions');
        const rejectButton = await screen.findByRole('button', {
            name: 'Reject',
        });
        await userEvent.click(rejectButton);
        await waitFor(() => {
            expect(mockWindowCloser.mock.calls.length).toEqual(1);
        });
    });
});

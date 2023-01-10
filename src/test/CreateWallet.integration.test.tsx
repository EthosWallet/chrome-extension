import { waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import App from '_app/index';
import { simulateAuthenticatedUser } from '_src/test/utils/fake-local-storage';
import { mockSuiObjects, mockCommonCalls } from '_src/test/utils/mockchain';
import { renderWithProviders } from '_src/test/utils/react-rendering';

describe('Rendering the Tokens page', () => {
    beforeEach(async () => {
        simulateAuthenticatedUser();
        mockCommonCalls();
    });

    test('rendering the Tokens page when wallet has no coins', async () => {
        mockSuiObjects();
        renderWithProviders(<App />);
        await screen.findByText('Get started with Sui');
        const wallet = await screen.findByText('Wallet');
        await userEvent.click(wallet);

        const createWallet = await screen.findByText('Create Wallet');
        await userEvent.click(createWallet);
        await waitFor(
            async () => (await screen.findAllByText('Wallet 2')).length > 0
        );

        const edit = screen.getByText('Edit');
        await userEvent.click(edit);
        await screen.findByText("Select the wallet you'd like to edit");

        const wallet2 = screen.getByTestId('wallet2');
        await userEvent.click(wallet2);
        await screen.findByText('Edit Wallet');

        await waitFor(
            async () => (await screen.findAllByText('Wallet 2')).length > 0
        );
        const input = screen.getByDisplayValue('Wallet 2');
        await userEvent.clear(input);
        await userEvent.type(input, 'Gaming');
        await waitFor(
            async () =>
                (await screen.findAllByDisplayValue('Gaming')).length > 0
        );

        // Can't get emoji picker to open
        // const emojiPicker = screen.getByTestId('emoji-picker')
        // userEvent.click(emojiPicker);
        // await screen.findByText('Pick an emoji...');
        // const scream = screen.getAllByText('😱')[0];
        // userEvent.click(scream);

        // await screen.findByText('Choose an Emoji');
        // await screen.findByText('😱');

        const colorPicker = screen.getByTestId('color-picker');
        await userEvent.click(colorPicker);
        const green = await screen.findByTestId('color-picker-#EB154C');
        await userEvent.click(green);

        const done = await screen.findByText('Done');
        await userEvent.click(done);
        await screen.findByText("Select the wallet you'd like to edit");

        await screen.findAllByText('Gaming');
        // await screen.findByText('😱');

        await screen.findAllByTestId('color-#EB154C');
    });
});

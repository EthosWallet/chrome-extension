import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import App from '_app/index';
import { mockCommonCalls } from '_src/test/utils/mockchain';
import { renderWithProviders } from '_src/test/utils/react-rendering';

describe('Authenticating by importing an account with a seed phrase', () => {
    test('Entire flow works', async () => {
        mockCommonCalls();
        const validSeedPhrase =
            'girl empower human spring circle ceiling wild pact stumble model wheel chuckle';
        const seedPhraseList = validSeedPhrase.split(' ');
        const walletAddressFromSeed =
            '0x1ce5033e82ae9a48ea743b503d96b49b9c57fe0b';
        renderWithProviders(<App />);

        await screen.findByText('Welcome to Ethos');
        await userEvent.click(screen.getByText('Import', { exact: false }));
        await screen.findByText('Paste Recovery Phrase');
        for (let i = 0; i < 12; i++) {
            const wordInput = await screen.findByTestId('word-' + i);
            await userEvent.type(wordInput, seedPhraseList[i]);
        }

        await userEvent.click(screen.getByTestId('submit'));

        await screen.findByText('Confirm Wallet Import');
        await screen.findByText(walletAddressFromSeed);

        await userEvent.click(screen.getByTestId('continue'));

        await userEvent.type(
            screen.getByTestId('password'),
            'This is a Password'
        );

        await userEvent.type(
            screen.getByTestId('confirmPassword'),
            'This is a Password'
        );
        await userEvent.click(screen.getByTestId('submit'));
        await screen.findByText('Wallet Set Up');
    });
});

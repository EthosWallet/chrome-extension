import {screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import nock from 'nock'
import * as React from 'react';
import {act} from "react-dom/test-utils";

import App from '_app/index';
import {initAppType} from "_redux/slices/app";
import {getFromLocationSearch} from "_redux/slices/app/AppType";
import {renderWithProviders} from '_src/test/utils/react-rendering';


afterEach(() => {
    nock.cleanAll();
})

function fakeOutLocalStorage(numGets: number, numSets: number) {
    const records: Record<string, unknown> = {}

    function fakeLocalStorageGet(dkeys?: null | string | string[] | Record<string, unknown>): Promise<Record<string, unknown>> {
        return new Promise<Record<string, unknown>>((resolve, reject) => {
            const returnVal: Record<string, unknown> = {}
            if (typeof dkeys === "string") {
                returnVal[dkeys] = records[dkeys]
            }

            resolve(returnVal)
        });
    }

    function fakeLocalStorageSet(items: Record<string, unknown>): Promise<void> {
        for (const property in items) {
            records[property] = items[property]
        }
        return new Promise<void>((resolve, reject) => {
            resolve()
        });
    }
    mockBrowser.storage.local.get.spy(fakeLocalStorageGet).times(numGets);
    mockBrowser.storage.local.set.spy(fakeLocalStorageSet).times(numSets);
}

test('Signing in by importing an account with a seed phrase', async () => {
    nock('http://dev-net-fullnode.example.com')
        .post('/', /sui_getObjectsOwnedByAddress/)
        .reply(200, {"jsonrpc":"2.0","result":[],"id":"fbf9bf0c-a3c9-460a-a999-b7e87096dd1c"})
        .post('/', /sui_getObject/)
        .reply(200, [{"jsonrpc":"2.0","result":{"status":"Exists","details":{"data":{"dataType":"moveObject","type":"0x2::sui_system::SuiSystemState","has_public_transfer":false,"fields":{"epoch":0,"id":{"id":"0x0000000000000000000000000000000000000005"},"parameters":{"type":"0x2::sui_system::SystemParameters","fields":{"max_validator_candidate_count":100,"min_validator_stake":100000000000000,"storage_gas_price":1}},"reference_gas_price":1,"storage_fund":100000000000000,"sui_supply":{"type":"0x2::balance::Supply<0x2::sui::SUI>","fields":{"value":100000000000004}},"validator_report_records":{"type":"0x2::vec_map::VecMap<address, 0x2::vec_set::VecSet<address>>","fields":{"contents":""}},"validators":{"type":"0x2::validator_set::ValidatorSet","fields":{"active_validators":[{"type":"0x2::validator::Validator","fields":{"delegation_staking_pool":{"type":"0x2::staking_pool::StakingPool","fields":{"delegation_token_supply":{"type":"0x2::balance::Supply<0x2::staking_pool::DelegationToken>","fields":{"value":0}},"epoch_starting_delegation_token_supply":0,"epoch_starting_sui_balance":0,"pending_delegations":"","rewards_pool":0,"starting_epoch":1,"sui_balance":0,"validator_address":"0xc7c452e0d91aadb2774609e44ddb9194885ca3a7"}},"gas_price":1,"metadata":{"type":"0x2::validator::ValidatorMetadata","fields":{"name":"dmFsaWRhdG9yLTM=","net_address":"NRl2YWxpZGF0b3ItMy5kZXZuZXQuc3VpLmlvBh+Q4AM=","network_pubkey_bytes":"c0txZVhKTUswd2Q3eFJuUkVBWDFVNjNiUjRLZERDUHkwNnpCV0oxK1M1cz0=","next_epoch_delegation":0,"next_epoch_gas_price":1,"next_epoch_stake":1,"proof_of_possession":"rjaG+aRtEDACBOJ7qPiq4rDsjqM7gFQ17PA+SNoSUW1g5fJkhZqsSOXX4rAgu8+0","pubkey_bytes":"iGwcpgxM2Cm7X1nyKnyBB7XFU1Cx/3upgByObbxVHYIrGQtYlSFK+68i6rmzrlsXDuFFFtL0jUX0QCHOhcYQ39Kt8f1bhFfckQOaSPpp4yuPlqrgVx+fxiZ92K9XxNbJ","sui_address":"0xc7c452e0d91aadb2774609e44ddb9194885ca3a7"}},"pending_stake":0,"pending_withdraw":0,"stake_amount":1}},{"type":"0x2::validator::Validator","fields":{"delegation_staking_pool":{"type":"0x2::staking_pool::StakingPool","fields":{"delegation_token_supply":{"type":"0x2::balance::Supply<0x2::staking_pool::DelegationToken>","fields":{"value":0}},"epoch_starting_delegation_token_supply":0,"epoch_starting_sui_balance":0,"pending_delegations":"","rewards_pool":0,"starting_epoch":1,"sui_balance":0,"validator_address":"0xb8014a436dbf8dd4cac8c5d1488228178fd42480"}},"gas_price":1,"metadata":{"type":"0x2::validator::ValidatorMetadata","fields":{"name":"dmFsaWRhdG9yLTA=","net_address":"NRl2YWxpZGF0b3ItMC5kZXZuZXQuc3VpLmlvBh+Q4AM=","network_pubkey_bytes":"ZE1oWFZPbjZkMitiVXRyTGRBYzJyK0FsSC90bzQyRzdnRkdReDRTTUkvWT0=","next_epoch_delegation":0,"next_epoch_gas_price":1,"next_epoch_stake":1,"proof_of_possession":"rsdL9yKt6BZ6bkvL4jnPvC0s44818FUYMW5TNr2B6BgwnMXQIH+8c5VBe6POJyhl","pubkey_bytes":"igPeklwssoIwTKvkhx/bybVCtusoNavqAJx/JGsJy0l2hQXxQvenoT4xVRxDIVhID0WDib6rvt+mjjRF0p4PQRff8UKB/mJUSeIerm7tnp5UHgbhxgN4PjmiwGAITkK+","sui_address":"0xb8014a436dbf8dd4cac8c5d1488228178fd42480"}},"pending_stake":0,"pending_withdraw":0,"stake_amount":1}},{"type":"0x2::validator::Validator","fields":{"delegation_staking_pool":{"type":"0x2::staking_pool::StakingPool","fields":{"delegation_token_supply":{"type":"0x2::balance::Supply<0x2::staking_pool::DelegationToken>","fields":{"value":0}},"epoch_starting_delegation_token_supply":0,"epoch_starting_sui_balance":0,"pending_delegations":"","rewards_pool":0,"starting_epoch":1,"sui_balance":0,"validator_address":"0xc720f2e8f59316af17665375bc4687f6fc78985e"}},"gas_price":1,"metadata":{"type":"0x2::validator::ValidatorMetadata","fields":{"name":"dmFsaWRhdG9yLTE=","net_address":"NRl2YWxpZGF0b3ItMS5kZXZuZXQuc3VpLmlvBh+Q4AM=","network_pubkey_bytes":"MU94Vy9LQkFQbmNhcUJoY1FTOWZqSUdDK1FVeERmaEx0eGFha1NqQ3RpZz0=","next_epoch_delegation":0,"next_epoch_gas_price":1,"next_epoch_stake":1,"proof_of_possession":"oWFyqbVocraNbiCQdNVIhENIQW3HCi361fadqiCmfsjByyNqE0xa1CR+qFzzQ3U7","pubkey_bytes":"qcFpXHtU4ChnBY+u7VGUeUt23KY0cVnaBbNcjdUY5XgNmOGo0bVEICyej1O4FG6LDPuwvSmpwd0YK5vjzQqgo6m7UPOkEP4hAaggTybvABZY9ToJsz6Ov4qRrWXryIsr","sui_address":"0xc720f2e8f59316af17665375bc4687f6fc78985e"}},"pending_stake":0,"pending_withdraw":0,"stake_amount":1}},{"type":"0x2::validator::Validator","fields":{"delegation_staking_pool":{"type":"0x2::staking_pool::StakingPool","fields":{"delegation_token_supply":{"type":"0x2::balance::Supply<0x2::staking_pool::DelegationToken>","fields":{"value":0}},"epoch_starting_delegation_token_supply":0,"epoch_starting_sui_balance":0,"pending_delegations":"","rewards_pool":0,"starting_epoch":1,"sui_balance":0,"validator_address":"0x3f4966a2e63f9058e0032eb6491fbed900f78aac"}},"gas_price":1,"metadata":{"type":"0x2::validator::ValidatorMetadata","fields":{"name":"dmFsaWRhdG9yLTI=","net_address":"NRl2YWxpZGF0b3ItMi5kZXZuZXQuc3VpLmlvBh+Q4AM=","network_pubkey_bytes":"TTFtWTJCY2UyVzU4Rm5kQjNuNkJ5VTB4V1ZReWNvM3RUSUh4UG9vbE8xaz0=","next_epoch_delegation":0,"next_epoch_gas_price":1,"next_epoch_stake":1,"proof_of_possession":"tMNuJdJcWexGbvSa/Dhlhpcf+ZVbm0qFCuTJau+5W574PeeOuRJyp7dPCCv/bRRf","pubkey_bytes":"uHA5fteIHxIyl7RzG3YqJFeI7hGbaDB4/adS+tAYMdr3aHRe6UnYZCXof1VeeWXfEPvaepsihKyQ2WL6xLJ5tKEvPmZxaGxMb2rpyNAraqqSFUIJmciDuTMs7J8WUpIc","sui_address":"0x3f4966a2e63f9058e0032eb6491fbed900f78aac"}},"pending_stake":0,"pending_withdraw":0,"stake_amount":1}}],"next_epoch_validators":[{"type":"0x2::validator::ValidatorMetadata","fields":{"name":"dmFsaWRhdG9yLTI=","net_address":"NRl2YWxpZGF0b3ItMi5kZXZuZXQuc3VpLmlvBh+Q4AM=","network_pubkey_bytes":"TTFtWTJCY2UyVzU4Rm5kQjNuNkJ5VTB4V1ZReWNvM3RUSUh4UG9vbE8xaz0=","next_epoch_delegation":0,"next_epoch_gas_price":1,"next_epoch_stake":1,"proof_of_possession":"tMNuJdJcWexGbvSa/Dhlhpcf+ZVbm0qFCuTJau+5W574PeeOuRJyp7dPCCv/bRRf","pubkey_bytes":"uHA5fteIHxIyl7RzG3YqJFeI7hGbaDB4/adS+tAYMdr3aHRe6UnYZCXof1VeeWXfEPvaepsihKyQ2WL6xLJ5tKEvPmZxaGxMb2rpyNAraqqSFUIJmciDuTMs7J8WUpIc","sui_address":"0x3f4966a2e63f9058e0032eb6491fbed900f78aac"}},{"type":"0x2::validator::ValidatorMetadata","fields":{"name":"dmFsaWRhdG9yLTE=","net_address":"NRl2YWxpZGF0b3ItMS5kZXZuZXQuc3VpLmlvBh+Q4AM=","network_pubkey_bytes":"MU94Vy9LQkFQbmNhcUJoY1FTOWZqSUdDK1FVeERmaEx0eGFha1NqQ3RpZz0=","next_epoch_delegation":0,"next_epoch_gas_price":1,"next_epoch_stake":1,"proof_of_possession":"oWFyqbVocraNbiCQdNVIhENIQW3HCi361fadqiCmfsjByyNqE0xa1CR+qFzzQ3U7","pubkey_bytes":"qcFpXHtU4ChnBY+u7VGUeUt23KY0cVnaBbNcjdUY5XgNmOGo0bVEICyej1O4FG6LDPuwvSmpwd0YK5vjzQqgo6m7UPOkEP4hAaggTybvABZY9ToJsz6Ov4qRrWXryIsr","sui_address":"0xc720f2e8f59316af17665375bc4687f6fc78985e"}},{"type":"0x2::validator::ValidatorMetadata","fields":{"name":"dmFsaWRhdG9yLTA=","net_address":"NRl2YWxpZGF0b3ItMC5kZXZuZXQuc3VpLmlvBh+Q4AM=","network_pubkey_bytes":"ZE1oWFZPbjZkMitiVXRyTGRBYzJyK0FsSC90bzQyRzdnRkdReDRTTUkvWT0=","next_epoch_delegation":0,"next_epoch_gas_price":1,"next_epoch_stake":1,"proof_of_possession":"rsdL9yKt6BZ6bkvL4jnPvC0s44818FUYMW5TNr2B6BgwnMXQIH+8c5VBe6POJyhl","pubkey_bytes":"igPeklwssoIwTKvkhx/bybVCtusoNavqAJx/JGsJy0l2hQXxQvenoT4xVRxDIVhID0WDib6rvt+mjjRF0p4PQRff8UKB/mJUSeIerm7tnp5UHgbhxgN4PjmiwGAITkK+","sui_address":"0xb8014a436dbf8dd4cac8c5d1488228178fd42480"}},{"type":"0x2::validator::ValidatorMetadata","fields":{"name":"dmFsaWRhdG9yLTM=","net_address":"NRl2YWxpZGF0b3ItMy5kZXZuZXQuc3VpLmlvBh+Q4AM=","network_pubkey_bytes":"c0txZVhKTUswd2Q3eFJuUkVBWDFVNjNiUjRLZERDUHkwNnpCV0oxK1M1cz0=","next_epoch_delegation":0,"next_epoch_gas_price":1,"next_epoch_stake":1,"proof_of_possession":"rjaG+aRtEDACBOJ7qPiq4rDsjqM7gFQ17PA+SNoSUW1g5fJkhZqsSOXX4rAgu8+0","pubkey_bytes":"iGwcpgxM2Cm7X1nyKnyBB7XFU1Cx/3upgByObbxVHYIrGQtYlSFK+68i6rmzrlsXDuFFFtL0jUX0QCHOhcYQ39Kt8f1bhFfckQOaSPpp4yuPlqrgVx+fxiZ92K9XxNbJ","sui_address":"0xc7c452e0d91aadb2774609e44ddb9194885ca3a7"}}],"pending_removals":"","pending_validators":"","quorum_stake_threshold":3,"total_delegation_stake":0,"total_validator_stake":4}}}},"owner":{"Shared":{"initial_shared_version":1}},"previousTransaction":"siAG2tKmJpax3nu0Qj3QZaTSeFCD8Th/GjZaLTRqrB8=","storageRebate":286,"reference":{"objectId":"0x0000000000000000000000000000000000000005","version":2,"digest":"aR0OO/jVigOD+heOiBAhgPY+feUrWA7LJTkBSjSR8AY="}}},"id":"83377201-1f22-46ac-b9e4-72cf445cc887"}])
    const validSeedPhrase =
        'girl empower human spring circle ceiling wild pact stumble model wheel chuckle';
    fakeOutLocalStorage(7, 3);
    const view = renderWithProviders(<App />);
    act(() => {
        // todo (mag): is this the right way to do this, or can we just set up the store with this state and avoid
        // the act/dispatch indirection
        view.store.dispatch(initAppType(getFromLocationSearch(window.location.search)))
    })

    await screen.findByText('The new web awaits');
    await userEvent.click(screen.getByText('Import', { exact: false }));
    await screen.findByText('Recovery phrase');
    await userEvent.type(
        screen.getByRole('textbox', { name: 'Recovery phrase' }),
        validSeedPhrase
    );
    await userEvent.click(screen.getByRole('button'));

    await screen.findByText('Please provide a password to ensure your wallet is secure.');

    await userEvent.type(screen.getByText("Password"), 'A Bad Password');

    await userEvent.type(screen.getByText("Confirm password"), 'A Bad Password');

    await userEvent.click(screen.getByText('Save'));

    await screen.findByText('Get started with Sui');
});

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import { API_ENV } from '../../ui/app/ApiProvider';
import KeypairVault from '_app/KeypairVault';
import { BackgroundClient } from '_app/background-client';
import App from '_app/index';
import { AppType } from '_redux/slices/app/AppType';
import { DependenciesContext } from '_shared/utils/dependenciesContext';
import { makeTestDeps } from '_src/test/utils/test-dependencies';
import { SuiLedgerClientProvider } from '_src/ui/app/components/ledger/SuiLedgerClientProvider';
import { queryConfig } from '_src/ui/app/helpers/queryConfig';
import { createStore } from '_store';
import { thunkExtras } from '_store/thunk-extras';

import type { PreloadedState } from '@reduxjs/toolkit';
import type { RenderOptions } from '@testing-library/react';
import type { RootState } from '_redux/RootReducer';
import type { Dependencies } from '_shared/utils/dependenciesContext';
import type { AppStore } from '_store';
import type { PropsWithChildren } from 'react';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
    preloadedState?: PreloadedState<RootState>;
    store?: AppStore;
    initialRoute?: string;
    dependencies?: Dependencies;
    locale?: string;
}

export async function renderApp({
    preloadedState = {},
    store,
    initialRoute,
    dependencies = makeTestDeps(),
    locale = 'en-US',
    ...renderOptions
}: ExtendedRenderOptions = {}) {
    const storeToUse: AppStore =
        store ||
        createStore({
            app: {
                appType: AppType.fullscreen,
                apiEnv: API_ENV.mainNet,
            },
            ...preloadedState,
        });
    thunkExtras.background = new BackgroundClient();
    await thunkExtras.background.init(storeToUse.dispatch);
    thunkExtras.keypairVault = new KeypairVault();

    function Wrapper({ children }: PropsWithChildren<unknown>): JSX.Element {
        return (
            <SuiLedgerClientProvider>
                <MemoryRouter
                    // we start at '/home' because if we use the index route of '/' it will navigate to '/home'
                    // at some point after the initial render, which causes havoc in tests.
                    initialEntries={initialRoute ? [initialRoute] : ['/home']}
                >
                    <Provider store={storeToUse}>
                        <IntlProvider locale={locale}>
                            <QueryClientProvider
                                client={new QueryClient(queryConfig)}
                            >
                                <DependenciesContext.Provider
                                    value={dependencies}
                                >
                                    {children}
                                </DependenciesContext.Provider>
                            </QueryClientProvider>
                        </IntlProvider>
                    </Provider>
                </MemoryRouter>
            </SuiLedgerClientProvider>
        );
    }

    const options = { wrapper: Wrapper, ...renderOptions };
    return { store, ...render(<App />, options) };
}

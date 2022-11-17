import { render } from '@testing-library/react';
import { Provider } from 'react-redux';

import { MemoryRouter } from 'react-router-dom';
import type { PreloadedState } from '@reduxjs/toolkit';
import type { RenderOptions } from '@testing-library/react';
import type { RootState } from '_redux/RootReducer';
import type { AppStore } from '_store';
import type React from 'react';
import type { PropsWithChildren } from 'react';

import { createStore } from '_store';
import {IntlProvider} from "react-intl";
import {queryClient} from "_app/helpers/queryClient";
import { QueryClientProvider } from '@tanstack/react-query';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
    preloadedState?: PreloadedState<RootState>;
    store?: AppStore;
}

export function renderWithProviders(
    ui: React.ReactElement,
    {
        preloadedState = {},
        // Automatically create a store instance if no store was passed in
        store = createStore(),
        ...renderOptions
    }: ExtendedRenderOptions = {}
) {
    function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
        return (
            <MemoryRouter>
                <Provider store={store}>
                    <IntlProvider locale={'pt'}>
                        <QueryClientProvider client={queryClient}>
                            {children}
                        </QueryClientProvider>
                    </IntlProvider>
                </Provider>
            </MemoryRouter>
        );
    }

    const options = { wrapper: Wrapper, ...renderOptions };
    return { store, ...render(ui, options) };
}

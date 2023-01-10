// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from 'react';
import { useLocation, useSearchParams, useParams } from 'react-router-dom';

const SETTINGS_PARAM = 'menu';
const SECURITY_PARAM = 'security';
export const WALLET_PICKER_PARAM = 'wallet-picker';
const WALLET_EDITOR_PARAM = 'edit';

export function useSettingsUrl() {
    const [searchParams] = useSearchParams();
    if (searchParams.has(SETTINGS_PARAM)) {
        return searchParams.get(SETTINGS_PARAM) || '/';
    }
    return false;
}

export function useSecurityUrl() {
    const [searchParams] = useSearchParams();
    if (searchParams.has(SECURITY_PARAM)) {
        return searchParams.get(SECURITY_PARAM) || '/';
    }
    return false;
}

export function useWalletPickerUrl() {
    const [searchParams] = useSearchParams();
    console.log('SEARCH PARAM', searchParams.get(WALLET_PICKER_PARAM));
    if (searchParams.has(WALLET_PICKER_PARAM)) {
        return searchParams.get(WALLET_PICKER_PARAM) || '/';
    }
    return false;
}

export function useSettingsIsOpen() {
    const [searchParams] = useSearchParams();
    return searchParams.has(SETTINGS_PARAM);
}

export function useSettingsIsOpenOnSubPage() {
    const [searchParams] = useSearchParams();
    const settingsParamValue = searchParams.get(SETTINGS_PARAM);
    return (
        settingsParamValue !== null &&
        // Just a slash means the home page is open
        settingsParamValue !== '/' &&
        settingsParamValue.length > 0
    );
}

export function useSecurityIsOpenOnSubPage() {
    const [searchParams] = useSearchParams();
    const settingsParamValue = searchParams.get(SECURITY_PARAM);
    return (
        settingsParamValue !== null &&
        // Just a slash means the home page is open
        settingsParamValue !== '/' &&
        settingsParamValue.length > 0
    );
}

export function useWalletPickerIsOpen() {
    const [searchParams] = useSearchParams();

    return searchParams.has(WALLET_PICKER_PARAM);
}

export function useWalletEditorIsOpen() {
    const [searchParams] = useSearchParams();

    return searchParams.get(WALLET_PICKER_PARAM) === '/' + WALLET_EDITOR_PARAM;
}

/**
 * Get the URL that contains the background page and the menu location
 *
 * @param isOpen Indicates if the menu will be open
 * @param nextMenuLocation The location within the menu
 */
export function useNextSettingsUrl(isOpen: boolean, nextMenuLocation = '/') {
    const [searchParams] = useSearchParams();
    const { pathname } = useLocation();
    return useMemo(() => {
        if (isOpen) {
            searchParams.set(SETTINGS_PARAM, nextMenuLocation);
        } else {
            searchParams.delete(SETTINGS_PARAM);
        }
        const search = searchParams.toString();
        return `${pathname}${search ? '?' : ''}${search}`;
    }, [isOpen, nextMenuLocation, searchParams, pathname]);
}

/**
 * Get the URL that contains the background page and the menu location
 *
 * @param isOpen Indicates if the menu will be open
 * @param nextMenuLocation The location within the menu
 */
export function useNextWalletPickerUrl(
    isOpen: boolean,
    nextMenuLocation = '/'
) {
    const [searchParams] = useSearchParams();
    const { pathname } = useLocation();
    return useMemo(() => {
        if (isOpen) {
            searchParams.set(WALLET_PICKER_PARAM, nextMenuLocation);
        } else {
            searchParams.delete(WALLET_PICKER_PARAM);
            searchParams.delete('index');
        }
        const search = searchParams.toString();
        return `${pathname}${search ? '?' : ''}${search}`;
    }, [isOpen, nextMenuLocation, searchParams, pathname]);
}

/**
 * Get the URL that contains the background page and the edit menu location
 *
 * @param walletIndex The wallet index to edit
 */
export function useEditWalletUrl(walletIndex: number) {
    const [searchParams] = useSearchParams();
    const params = useParams();
    return useMemo(() => {
        searchParams.set(WALLET_PICKER_PARAM, '/edit');
        searchParams.set('index', walletIndex.toString());
        const search = searchParams.toString();
        return `${params['*']}${search ? '?' : ''}${search}`;
    }, [searchParams, params, walletIndex]);
}

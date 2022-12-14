// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { memo } from 'react';

import darkGradientBackground from '../../assets/images/dark-gradient-background.jpg';
import lightGradientBackground from '../../assets/images/light-gradient-background.jpg';
import Loading from '_components/loading';
import { useFullscreenGuard } from '_hooks';

import type { ReactNode } from 'react';

export type PageLayoutProps = {
    forceFullscreen?: boolean;
    children: ReactNode | ReactNode[];
};

function PageLayout({ forceFullscreen = false, children }: PageLayoutProps) {
    const guardLoading = useFullscreenGuard(forceFullscreen);

    return (
        <Loading loading={guardLoading} big={true}>
            <div className="relative flex sm:min-h-screen sm:w-full flex-col justify-center overflow-hidden text-ethos-light-text-default bg-ethos-light-background-default dark:text-ethos-dark-text-default dark:bg-ethos-dark-background-default">
                {/* Show light gradient backdrop during light theme, and vice versa */}
                <img
                    src={lightGradientBackground}
                    alt=""
                    className="absolute h-full w-full hidden sm:block dark:sm:hidden"
                    width={1308}
                />
                <img
                    src={darkGradientBackground}
                    alt=""
                    className="absolute h-full w-full hidden dark:sm:block"
                    width={1308}
                />
                <div className="relative mx-auto sm:rounded-[20px]">
                    {children}
                </div>
            </div>
        </Loading>
    );
}

export default memo(PageLayout);

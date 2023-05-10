import {
    ComputerDesktopIcon,
    MoonIcon,
    SunIcon,
} from '@heroicons/react/24/solid';
import { useCallback } from 'react';

import { useTheme } from '_src/shared/utils/themeContext';
import SegmentedControl from '_src/ui/app/shared/inputs/SegmentedControl';
import BodyLarge from '_src/ui/app/shared/typography/BodyLarge';
import ContentBlock from '_src/ui/app/shared/typography/ContentBlock';
import Header from '_src/ui/app/shared/typography/Header';

import type { SegmentedControlItem } from '_src/ui/app/shared/inputs/SegmentedControl';

const ThemePage = () => {
    const { theme, setTheme } = useTheme();

    const setThemeToSystem = useCallback(() => {
        setTheme('system');
    }, [setTheme]);

    const setThemeToLight = useCallback(() => {
        setTheme('light');
    }, [setTheme]);

    const setThemeToDark = useCallback(() => {
        setTheme('dark');
    }, [setTheme]);

    const themeOptions: SegmentedControlItem[] = [
        {
            text: 'System',
            iconWithNoClasses: <ComputerDesktopIcon />,
            isActive: theme === 'system',
            onClick: setThemeToSystem,
        },
        {
            text: 'Light',
            iconWithNoClasses: <SunIcon />,
            isActive: theme === 'light',
            onClick: setThemeToLight,
        },
        {
            text: 'Dark',
            iconWithNoClasses: <MoonIcon />,
            isActive: theme === 'dark',
            onClick: setThemeToDark,
        },
    ];

    return (
        <div className="flex flex-col">
            <ContentBlock className="!py-6">
                <Header>Theme</Header>
                <BodyLarge isTextColorMedium>
                    Choose if you&apos;d like to have the lights on or off by
                    toggling your theme below.
                </BodyLarge>
            </ContentBlock>
            <SegmentedControl items={themeOptions} />
        </div>
    );
};

export default ThemePage;

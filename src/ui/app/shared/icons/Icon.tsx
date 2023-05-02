import React from 'react';

import { useTheme } from '_src/shared/utils/themeContext';

export const Icon = ({
    isRound,
    displayIcon,
}: {
    theme?: 'dark' | 'light';
    isRound?: boolean;
    hasBg?: boolean;
    bgColor?: string;
    iconColor?: string;
    displayIcon: JSX.Element;
}) => {
    const { resolvedTheme } = useTheme();

    const styles =
        resolvedTheme === 'light'
            ? {
                  backgroundColor: '#F1EAFC',
                  iconColor: '#6D28D9',
                  left: isRound ? '-10px' : '',
              }
            : {
                  backgroundColor: 'rgba(156, 120, 247, 0.2)',
                  iconColor: '#9C78F7',
                  left: isRound ? '-10px' : '',
              };

    const clonedIcon = React.cloneElement(displayIcon, {
        color: displayIcon.props.color || styles.iconColor,
        width: displayIcon.props.width || '26px',
        height: displayIcon.props.height || null,
    });

    return (
        <div
            className={`relative flex w-[56px] h-[56px] justify-center items-center bg-[#F1EAFC] ${
                isRound ? 'rounded-full mr-[-5px]' : 'rounded-2xl'
            }`}
            style={styles}
        >
            {clonedIcon}
        </div>
    );
};

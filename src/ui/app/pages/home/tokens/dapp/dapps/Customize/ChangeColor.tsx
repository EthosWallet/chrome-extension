import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { type AccountInfo } from '_src/ui/app/KeypairVault';
import getNextWalletColor from '_src/ui/app/helpers/getNextWalletColor';
import { useAppSelector } from '_src/ui/app/hooks';
import { useUpdateCurrentAccountInfo } from '_src/ui/app/hooks/useUpdateCurrentAccountInfo';
import Button from '_src/ui/app/shared/buttons/Button';
import ColorPickerMenu from '_src/ui/app/shared/inputs/colors/ColorPickerMenu';
import Title from '_src/ui/app/shared/typography/Title';

const ChangeColor: React.FC = () => {
    const [isColorPickerMenuOpen, setIsColorPickerMenuOpen] = useState(false);
    const { updateCurrentAccountInfo } = useUpdateCurrentAccountInfo();
    const navigate = useNavigate();

    const accountInfo = useAppSelector(
        ({ account: { accountInfos, activeAccountIndex } }) =>
            accountInfos.find(
                (accountInfo: AccountInfo) =>
                    (accountInfo.index || 0) === activeAccountIndex
            )
    );

    const [draftColor, setDraftColor] = useState<string>(
        accountInfo?.color || getNextWalletColor(0)
    );

    const openColorPickerMenu = useCallback(() => {
        setIsColorPickerMenuOpen(true);
    }, []);

    const closeColorPickerMenu = useCallback(() => {
        setIsColorPickerMenuOpen(false);
    }, []);

    const _handleColorChange = useCallback((color: string) => {
        setDraftColor(color);
        setIsColorPickerMenuOpen(false);
    }, []);

    const handleOnContinue = useCallback(() => {
        updateCurrentAccountInfo({ color: draftColor });
        navigate('/tokens/customize/completed');
    }, [draftColor, navigate, updateCurrentAccountInfo]);

    const goBack = useCallback(() => {
        navigate(-1);
    }, [navigate]);

    return (
        <div className="relative flex flex-col items-center pt-6 px-6">
            <Title className="pb-6">Choose a color for your wallet</Title>
            <div
                className="w-20 h-20 rounded-md cursor-pointer"
                style={{ backgroundColor: draftColor }}
                onClick={openColorPickerMenu}
            />
            <ColorPickerMenu
                isOpen={isColorPickerMenuOpen}
                selectedColor={draftColor}
                setSelectedColor={_handleColorChange}
                closeColorPickerMenu={closeColorPickerMenu}
                leftAbsoluteClassNames="left-[24px] top-[180px]"
            />
            <div className="flex mt-3 gap-3">
                <Button
                    removeContainerPadding
                    buttonStyle="secondary"
                    onClick={goBack}
                >
                    Back
                </Button>
                <Button removeContainerPadding onClick={handleOnContinue}>
                    Continue
                </Button>
            </div>
        </div>
    );
};

export default ChangeColor;

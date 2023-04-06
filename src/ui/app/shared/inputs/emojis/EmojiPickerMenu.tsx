import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

export type EmojiPickerResult = {
    shortcodes: string;
};

interface EmojiPickerMenuProps {
    isOpen: boolean;
    setSelectedEmoji: (emojiPickerResult: EmojiPickerResult) => void;
    closeEmojiPickerMenu: () => void;
    forceLightMode?: boolean;
}

const EmojiPickerMenu = ({
    isOpen,
    setSelectedEmoji,
    closeEmojiPickerMenu,
    forceLightMode,
}: EmojiPickerMenuProps) => {
    if (isOpen) {
        return (
            <>
                {/* Backdrop */}
                <div
                    data-testid="emoji-picker"
                    className="fixed top-0 left-0 w-screen h-screen bg-black/30"
                    onClick={closeEmojiPickerMenu}
                />

                <div className="absolute">
                    <Picker
                        data={data}
                        onEmojiSelect={setSelectedEmoji}
                        theme={forceLightMode ? 'light' : 'auto'}
                    />
                </div>
            </>
        );
    }
    return <></>;
};

export default EmojiPickerMenu;

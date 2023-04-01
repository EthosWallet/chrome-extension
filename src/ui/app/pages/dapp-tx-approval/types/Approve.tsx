import { useCallback } from 'react';

import InlineButtonGroup from '_src/ui/app/shared/buttons/InlineButtonGroup';

export type NextStepProps = {
    disabled?: boolean;
    onApprove: () => void;
    onCancel: () => void;
};

const Approve = ({ disabled, onApprove, onCancel }: NextStepProps) => {
    const approve = useCallback(() => {
        onApprove && onApprove();
    }, [onApprove]);

    const cancel = useCallback(() => {
        onCancel && onCancel();
    }, [onCancel]);

    return (
        <InlineButtonGroup
            onClickButtonPrimary={approve}
            buttonPrimaryTestId="approve"
            buttonPrimaryChildren={<>Approve</>}
            isButtonPrimaryDisabled={disabled}
            onClickButtonSecondary={cancel}
            buttonSecondaryTestId="reject"
            buttonSecondaryChildren={<>Cancel</>}
        />
    );
};

export default Approve;

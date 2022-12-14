import { Dialog, Transition } from '@headlessui/react';
import { TrashIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { Fragment, useCallback } from 'react';

import InlineButtonGroup from '_src/ui/app/shared/buttons/InlineButtonGroup';
import HeaderWithIcons from '_src/ui/app/shared/headers/page-headers/HeaderWithIcons';

interface ConfirmRevokeModalProps {
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    onCancel: () => void;
    onConfirm: () => void;
}

const ConfirmRevokeModal = ({
    isOpen,
    setIsOpen,
    onCancel,
    onConfirm,
}: ConfirmRevokeModalProps) => {
    const closeModal = useCallback(() => {
        setIsOpen(false);
    }, [setIsOpen]);

    return (
        <>
            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeModal}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-[328px] transform overflow-hidden rounded-[20px] text-center align-middle shadow-ethos-modal-box-shadow transition-all bg-ethos-light-background-default dark:bg-ethos-dark-background-default">
                                    <div className="flex place-content-end pt-6 px-6">
                                        <button onClick={closeModal}>
                                            <XMarkIcon className="h-5 w-5 text-ethos-light-text-medium dark:text-ethos-dark-text-medium" />
                                        </button>
                                    </div>

                                    <HeaderWithIcons
                                        firstIcon={
                                            <div className="relative flex w-[56px] h-[56px] rounded-2xl justify-center items-center bg-ethos-light-red/10 dark:bg-ethos-dark-red/10">
                                                <TrashIcon className="h-8 w-8 text-ethos-light-red dark:text-ethos-dark-red" />
                                            </div>
                                        }
                                        title="Are you sure you want to Revoke Access?"
                                        description="Revoking access will remove this dApp's permissions to sign transactions for you."
                                    />

                                    <InlineButtonGroup
                                        isDanger
                                        onClickButtonPrimary={onConfirm}
                                        buttonPrimaryChildren="Revoke"
                                        onClickButtonSecondary={onCancel}
                                        buttonSecondaryChildren="Cancel"
                                    />
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
};

export default ConfirmRevokeModal;

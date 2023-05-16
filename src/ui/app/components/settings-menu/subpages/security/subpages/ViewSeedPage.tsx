import { useCallback, useEffect, useState } from 'react';

import PasswordVerificationForm from './PasswordVerificationForm';
import Button from '../../../../../shared/buttons/Button';
import { secureApiCall } from '_src/shared/utils/simpleApiCall';
import { useAppSelector } from '_src/ui/app/hooks';
import Alert from '_src/ui/app/shared/feedback/Alert';

import type { ChangeEventHandler } from 'react';

export default function ViewSeedPage() {
    const [hasConfirmed, setHasConfirmed] = useState(false);
    const [showSeed, setShowSeed] = useState(false);
    const [hostedSeed, setHostedSeed] = useState('Loading...');
    const mnemonic = useAppSelector(
        ({ account }) => account.createdMnemonic || account.mnemonic
    );
    const { passphrase, authentication } = useAppSelector(
        ({ account }) => account
    );

    useEffect(() => {
        if (!hasConfirmed) return;

        const getHostedSeed = async () => {
            if (!authentication) return;

            const { json, status } = await secureApiCall(
                'users/recovery_phrase',
                'POST',
                authentication,
                { chain: 'sui' }
            );

            if (status !== 200) {
                throw new Error(`Error retrieving recovery phrase: ${status}`);
            }

            const { phrase } = json;
            setHostedSeed(phrase);
        };

        getHostedSeed();
    }, [authentication, hasConfirmed]);

    const onHandleConfirmed = useCallback<ChangeEventHandler<HTMLInputElement>>(
        (event) => {
            const checked = event.target.checked;
            setHasConfirmed(checked);
        },
        []
    );

    const viewSeed = useCallback(async () => {
        setShowSeed(true);
    }, []);

    if (showSeed) {
        return (
            <div className="p-6 flex flex-col gap-6">
                <textarea
                    rows={4}
                    value={mnemonic || hostedSeed || ''}
                    id="mnemonic"
                    className="max-w-sm mx-auto text-center shadow-sm block w-full resize-none text-sm rounded-md border-gray-300 focus:ring-purple-500 focus:border-purple-500 dark:focus:ring-violet-700 dark:focus:border-violet-700 dark:border-gray-500 dark:bg-gray-700"
                    name="mnemonic"
                    disabled={true}
                />
                <Button to="/" buttonStyle="secondary" isInline>
                    Done
                </Button>
            </div>
        );
    }

    if (!passphrase) {
        return (
            <>
                <div className="px-6 py-6">
                    <Alert
                        title="Be careful!"
                        subtitle="Do not share your recovery phrase. Anyone with it has full control over your wallet."
                    />
                </div>
                <div className="pb-4 px-6 w-full relative flex items-center">
                    <div className="flex px-3">
                        <div className="flex items-center h-5">
                            <input
                                id="view-phrase-check"
                                aria-describedby="view-phrase-check-description"
                                name="view-phrase-check"
                                type="checkbox"
                                onChange={onHandleConfirmed}
                                checked={hasConfirmed}
                                className="h-4 w-4 rounded text-purple-600 border-gray-300 focus:ring-purple-500 dark:text-violet-700 dark:focus:ring-violet-700 dark:border-gray-400 dark:bg-gray-700"
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label
                                htmlFor="view-phrase-check"
                                className="font-medium text-gray-700 dark:text-gray-400"
                                id="view-phrase-check-description"
                            >
                                I understand
                            </label>
                        </div>
                    </div>
                </div>
                <Button
                    buttonStyle="secondary"
                    onClick={viewSeed}
                    disabled={!hasConfirmed}
                >
                    View Recovery Phrase
                </Button>
            </>
        );
    }

    return (
        <>
            <div className="px-6 py-6">
                <Alert
                    title="Be careful!"
                    subtitle="Do not share your
                                recovery phrase. Anyone with it has full
                                control over your wallet."
                />
            </div>
            <PasswordVerificationForm
                onSubmit={viewSeed}
                submitButtonText="View Recovery Phrase"
            />
        </>
    );
}

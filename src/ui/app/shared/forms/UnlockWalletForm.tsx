import { Formik, Form, useField } from 'formik';
import { useCallback, useState } from 'react';
import * as Yup from 'yup';

import Button from '../buttons/Button';
import HideShowToggle from '../buttons/HideShowToggle';
import Input from '../inputs/Input';

import type { FormikValues } from 'formik';

type PassphraseFormProps = {
    onSubmit: (passphrase: string) => void;
    isPasswordIncorrect?: boolean;
};

const CustomFormikForm = ({
    isPasswordIncorrect = false,
}: {
    isPasswordIncorrect: boolean;
}) => {
    // useField() returns [formik.getFieldProps(), formik.getFieldMeta()]
    // which we can spread on <input> and alse replace ErrorMessage entirely.
    const [field, meta] = useField('password');
    const [passwordMode, setPasswordMode] = useState(true);

    const togglePasswordMode = useCallback(() => {
        setPasswordMode((prev) => !prev);
    }, []);

    return (
        <div className="flex flex-col h-full justify-between">
            <Input
                {...field}
                label="Password"
                id="password"
                data-testid="password"
                name="password"
                type={passwordMode ? 'password' : 'text'}
                required={true}
                autoFocus
                errorText={
                    isPasswordIncorrect
                        ? 'Password is incorrect'
                        : meta.touched && meta.error
                        ? meta.error
                        : undefined
                }
            />

            <div className={'mb-6'}>
                <HideShowToggle
                    name="Password"
                    hide={passwordMode}
                    onToggle={togglePasswordMode}
                />
            </div>

            <Button
                buttonStyle="primary"
                data-testid="submit"
                type="submit"
                disabled={!meta.value || !!meta.error}
            >
                Unlock Wallet
            </Button>
        </div>
    );
};

const UnlockWalletForm = ({
    onSubmit,
    isPasswordIncorrect = false,
}: PassphraseFormProps) => {
    const _onSubmit = useCallback(
        ({ password }: FormikValues) => {
            onSubmit(password);
        },
        [onSubmit]
    );
    return (
        <div className="h-full">
            <Formik
                initialValues={{
                    password: '',
                    confirmPassword: '',
                }}
                validationSchema={Yup.object({
                    password: Yup.string().required('Enter your password'),
                })}
                onSubmit={_onSubmit}
            >
                <Form className="h-full">
                    <CustomFormikForm
                        isPasswordIncorrect={isPasswordIncorrect}
                    />
                </Form>
            </Formik>
        </div>
    );
};

export default UnlockWalletForm;

// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getSuiAddress } from './nameservice';
import { SUI_ADDRESS_VALIDATION } from './validation';
import Input from '../../shared/inputs/Input';

import type { FieldProps } from 'formik';
import type { ChangeEventHandler } from 'react';

export interface AddressInputProps<Values> extends FieldProps<string, Values> {
    disabled?: boolean;
    placeholder?: string;
    className?: string;
    label?: string;
}

function AddressInput<FormValues>({
    disabled: forcedDisabled,
    placeholder = '0x... or SuiNS name',
    className,
    label,
    form: { isSubmitting, setFieldValue, isValid },
    field: { name, value },
}: AddressInputProps<FormValues>) {
    const [displayedValue, setDisplayedValue] = useState<string>(value);
    const [showAddress, setShowAddress] = useState<boolean>(false);
    const disabled =
        forcedDisabled !== undefined ? forcedDisabled : isSubmitting;
    const manualEntry = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!manualEntry.current) {
            setDisplayedValue(value);
        }
    }, [value, showAddress, displayedValue]);

    const handleOnChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
        (e) => {
            if (manualEntry.current) {
                clearTimeout(manualEntry.current);
            }

            manualEntry.current = setTimeout(() => {
                manualEntry.current = null;
            }, 200);

            const _value = e.currentTarget.value;
            setDisplayedValue(_value);
            if (_value === '') {
                setShowAddress(false);
                setFieldValue(name, '');
            } else if (!_value.startsWith('0x')) {
                getSuiAddress(_value).then((address: string | null) => {
                    if (address) {
                        setShowAddress(address !== _value);
                        setFieldValue(
                            name,
                            SUI_ADDRESS_VALIDATION.cast(address)
                        );
                    } else {
                        setShowAddress(true);
                        setFieldValue(
                            name,
                            SUI_ADDRESS_VALIDATION.cast(_value)
                        );
                    }
                });
            } else {
                setFieldValue(name, SUI_ADDRESS_VALIDATION.cast(_value));
            }
        },
        [setFieldValue, setDisplayedValue, name]
    );

    const formattedValue = useMemo(
        () => SUI_ADDRESS_VALIDATION.cast(value),
        [value]
    );

    return (
        <div className="flex flex-col gap-1 flex-1">
            <Input
                label={label}
                className={className}
                disabled={disabled}
                placeholder={placeholder}
                value={displayedValue}
                onChange={handleOnChange}
                spellCheck={false}
                name={name}
                autoFocus
            />
            <input
                type="hidden"
                {...{
                    disabled,
                    value: formattedValue,
                    name,
                }}
            />
            {isValid && showAddress && (
                <CheckCircleIcon
                    className={'absolute right-6 bottom-11'}
                    width={20}
                    height={20}
                    color={
                        'ethos-dark-fullscreen-backdrop dark:ethos-light-background-default'
                    }
                />
            )}
        </div>
    );
}

export default memo(AddressInput);

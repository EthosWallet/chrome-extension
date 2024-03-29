export const isErrorCausedByUserNotHavingEnoughSuiToPayForGas = (
    errorMessage: string
) => {
    return (
        (errorMessage.includes('Balance of gas object') &&
            errorMessage.includes('is lower than gas budget')) ||
        errorMessage.includes('Cannot find gas coin for signer address') ||
        errorMessage.includes(
            'Unable to find a coin to cover the gas budget'
        ) ||
        errorMessage.includes('GasBalanceTooLowToCoverGasBudget')
    );
};

export const isErrorCausedByIncorrectSigner = (errorMessage: string) => {
    return (
        errorMessage.includes('IncorrectSigner') &&
        errorMessage.includes('but signer address is')
    );
};

export const isErrorCausedByMissingObject = (errorMessage: string) => {
    return (
        errorMessage.includes(
            'Error: RPC Error: Could not find the referenced object'
        ) ||
        errorMessage.includes('Error checking transaction input objects') ||
        errorMessage.includes('Package object does not exist with ID')
    );
};

export const isErrorObjectVersionUnavailable = (errorMessage: string) => {
    return errorMessage.includes('ObjectVersionUnavailableForConsumption');
};

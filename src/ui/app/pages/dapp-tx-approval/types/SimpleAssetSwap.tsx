import { useMemo } from 'react';

import Approve from './Approve';
import Details from './Details';
import SwapTransactionCard from './SwapTransactionCard';

import type {
    AnalyzeChangesResult,
    BalanceAddition,
    BalanceReduction,
} from '../lib/analyzeChanges';
import type { WalletSigner } from '_src/shared/cryptography/WalletSigner';

export type StepInformation = {
    addition: BalanceAddition;
    reduction: BalanceAddition;
    analysis: AnalyzeChangesResult;
};

const SimpleAssetSwap = ({
    addition,
    reduction,
    analysis,
    onApprove,
    onCancel,
    signer,
}: {
    addition: BalanceAddition;
    reduction: BalanceReduction;
    analysis: AnalyzeChangesResult;
    onApprove: () => void;
    onCancel: () => void;
    signer: WalletSigner;
}) => {
    const stepInformation = useMemo(
        () => ({ addition, reduction, analysis }),
        [addition, reduction, analysis]
    );

    return (
        <div className="h-full flex flex-col w-full gap-3">
            <SwapTransactionCard stepInformation={stepInformation} />
            <Details analysis={analysis} signer={signer} />
            <Approve onApprove={onApprove} onCancel={onCancel} />
        </div>
    );
};

export default SimpleAssetSwap;

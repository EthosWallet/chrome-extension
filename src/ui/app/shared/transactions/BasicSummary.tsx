import truncateString from '../../helpers/truncate-string';
import Body from '../typography/Body';

import type { BasicTransactionInfo } from '../../helpers/transactions/basicTransactionAnalysis';

const translateCommand = (command: string) => {
    switch (command) {
        case 'TransferObjects':
            return 'Asset Transfer';
        case 'MoveCall':
            return 'Contract Call';
        default:
            return command;
    }
};

const translateKind = (kind: string) => {
    switch (kind) {
        case 'ProgrammableTransaction':
            return 'Sui Transaction';
        default:
            return kind;
    }
};

const BasicSummary = ({
    basicTransactionInfo,
    timeDisplay,
}: {
    basicTransactionInfo: BasicTransactionInfo;
    timeDisplay: string;
}) => {
    if (!basicTransactionInfo.commands) return <></>;

    const summary = truncateString(
        basicTransactionInfo.commands
            .map((c) => translateCommand(c))
            .join(', '),
        20
    );

    return (
        <div className="w-full flex justify-between items-center">
            <Body className="text-left">
                {summary || translateKind(basicTransactionInfo.type)}
            </Body>
            <Body isTextColorMedium className="text-right">
                {timeDisplay}
            </Body>
        </div>
    );
};

export default BasicSummary;

import truncateMiddle from '../../helpers/truncate-middle';
import CopyBody from '../../shared/typography/CopyBody';

export type NumberedDetail = {
    label: string;
    truncate?: boolean;
    count: number | string;
};

const NumberedValue = ({ label, truncate, count }: NumberedDetail) => {
    return (
        <div
            className={`flex flex-row items-center gap-1 ${
                count === 0 ? 'opacity-30' : ''
            }`}
        >
            <div>
                {truncate ? (
                    <CopyBody isSemibold txt={label}>
                        {truncateMiddle(label, 9)}
                    </CopyBody>
                ) : (
                    label
                )}
            </div>
            {count > 0 &&
                (count > 10 ? (
                    <div className="text-xs text-slate-500 ml-1 font-normal">
                        {count}
                    </div>
                ) : (
                    <div className="w-5 h-5 flex justify-center items-center font-normal bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-400 rounded-full">
                        {count}
                    </div>
                ))}
        </div>
    );
};

export default NumberedValue;

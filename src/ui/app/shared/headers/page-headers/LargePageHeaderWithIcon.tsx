import Subheader from '../../typography/Subheader';
import Title from '../../typography/Title';
import { TextColor } from '_src/enums/Typography';

type LargePageHeaderWIthIconProps = {
    iconSrc: string;
    iconAlt: string;
    header: string;
    description: string;
};

const LargePageHeaderWIthIcon = ({
    iconSrc,
    iconAlt,
    header,
    description,
}: LargePageHeaderWIthIconProps) => {
    return (
        <div className="pt-6 pb-10">
            <div className="w-full pb-6">
                <img
                    src={iconSrc}
                    className="h-[104px] mx-auto"
                    alt={iconAlt}
                />
            </div>
            <Title as="h1">{header}</Title>
            <Subheader textColor={TextColor.Medium}>{description}</Subheader>
        </div>
    );
};

export default LargePageHeaderWIthIcon;

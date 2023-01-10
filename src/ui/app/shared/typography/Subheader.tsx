import Typography, { type TypographyProps } from './Typography';

const Subheader = (props: TypographyProps) => {
    const subheaderClasses =
        'font-weight-ethos-subheader text-size-ethos-subheader leading-line-height-ethos-subheader tracking-letter-spacing-ethos-subheader';
    return (
        <Typography
            {...props}
            className={props.className + ' ' + subheaderClasses}
        >
            {props.children}
        </Typography>
    );
};

export default Subheader;

type BlurredImageProps = {
    imgSrc: string;
    fileExt: string;
};

export const BlurredImage = ({ imgSrc, fileExt }: BlurredImageProps) => (
    <div
        className={'relative w-full rounded-ethos-large-images p-8'}
        style={{ backgroundImage: `url(${imgSrc})` }}
    >
        <div
            className={
                'absolute top-0 right-0 left-0 bottom-0 rounded-ethos-large-images'
            }
            style={{ backdropFilter: 'blur(42px)' }}
        ></div>
        <div>
            <img
                className="mx-auto w-full rounded-2xl drop-shadow-ethos-lg-image"
                src={imgSrc || ''}
                alt={fileExt || 'NFT'}
            />
        </div>
    </div>
);

import groq from 'groq';

export const STYLE_SETTINGS = groq`
    styleSettings{
        padding,
        height,
        objectFit,
        objectFitMobile
    }
`;

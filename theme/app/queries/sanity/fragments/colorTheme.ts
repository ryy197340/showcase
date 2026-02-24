import groq from 'groq';

export const COLOR_THEME = groq`
  'background': select(
    defined(background.alpha) && background.alpha < 1 => background.hex + "/" + string(background.alpha),
    background.hex
  ),
  'text': text.hex,
`;

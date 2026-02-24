import groq from 'groq';

export const PURE_HTML = groq`
  _type == 'module.pureHTML' => {
    _key,
    _type,
    html,
  }
`;

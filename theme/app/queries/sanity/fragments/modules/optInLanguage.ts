import groq from 'groq';

import {PORTABLE_TEXT} from '../portableText/portableText';

export const OPT_IN_LANGUAGE = groq`
  {  
  "toggleText": accountOptInInputText,
  "disclaimer": accountOptInVerbiage.richTextBody[]{
    ${PORTABLE_TEXT}
  }
}`;

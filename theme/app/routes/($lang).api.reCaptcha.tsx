import {json, LoaderFunctionArgs} from '@shopify/remix-oxygen';

import {RecaptchaResponse} from '~/types/recaptcha';
import {validateReCaptcha} from '~/utils/reCAPTCHA';

export async function loader({request}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  try {
    if (!token) throw new Error('Missing token');

    const recaptchaData: RecaptchaResponse = await validateReCaptcha(token);
    const isSubmissionValid = recaptchaData.score > 0.5;
    return {token, isSubmissionValid};
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in loader function:', error);
  }
}

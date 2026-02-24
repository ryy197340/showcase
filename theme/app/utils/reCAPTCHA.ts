import {RecaptchaResponse} from '~/types/recaptcha';

export const validateReCaptcha = async (
  token: string,
): Promise<RecaptchaResponse> => {
  return new Promise((resolve, reject) => {
    fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: '6LdRkfIUAAAAAMjSkPF3UmaSuHWuf_kjsQh_vJJ7', // Replace with your secret key
        response: token,
        remoteip: '',
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        resolve(data);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

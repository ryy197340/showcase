import {Form, useLoaderData} from '@remix-run/react';
import {type LoaderFunctionArgs, redirect} from '@shopify/remix-oxygen';
import clsx from 'clsx';
import {useState} from 'react';

import FormCardWrapper from '~/components/account/FormCardWrapper';
import FormFieldText from '~/components/account/FormFieldText';
import Button, {blueButtonStyles} from '~/components/elements/Button';
import {useCustomLoadScript} from '~/hooks/useCustomLoadScript';
import {isProduction} from '~/utils/global';

export async function loader({context, params, request}: LoaderFunctionArgs) {
  const customerAccessToken = await context.session.get('customerAccessToken');
  const isAuthenticated = Boolean(customerAccessToken);
  const lang = params.lang;

  // if (isAuthenticated) {
  //   return redirect(lang ? `/${lang}/account` : '/account');
  // }

  const isProductionEnv = isProduction(request.url);

  return isProductionEnv;
}

export default function EmailPreference() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isProductionEnv = useLoaderData<typeof loader>();

  useCustomLoadScript(
    'https://www.google.com/recaptcha/api.js?render=6LdRkfIUAAAAAN8rY-h4jo1J3ZTAESOpuoeexkYq&onLoad=onLoadCallback', // Replace with your actual site key
    {
      onLoadCallback: () => {
        grecaptcha.ready(function () {
          grecaptcha.render('recaptcha-anchor', {
            sitekey: '6LdRkfIUAAAAAN8rY-h4jo1J3ZTAESOpuoeexkYq',
            badge: 'inline',
            size: 'invisible',
          });
        });
      },
    },
  );

  const submitForm = async () => {
    try {
      const response = await fetch('/api/ometriaFetchProfile', {
        method: 'POST',
        body: new URLSearchParams({email}),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.formError || 'An error occurred.');
      } else {
        setIframeUrl(data.iframeUrl || '');
      }
    } catch (error) {
      setFormError('Submission failed. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.includes('@')) {
      setEmailError('Invalid email address');
      return;
    }

    setIsLoading(true);
    setFormError(null);

    if (!isProductionEnv) {
      await submitForm();
      return;
    }

    grecaptcha.ready(function () {
      grecaptcha
        .execute('6LdRkfIUAAAAAN8rY-h4jo1J3ZTAESOpuoeexkYq', {action: 'submit'})
        .then(async function (token) {
          try {
            const verifyRes = await fetch(`/api/reCaptcha?token=${token}`);
            const result = await verifyRes.json();

            if (!verifyRes.ok || !result.isSubmissionValid) {
              throw new Error();
            }

            await submitForm();
          } catch (error) {
            setFormError('reCAPTCHA failed. Please try again later.');
            setIsLoading(false);
          }
        });
    });
  };

  return (
    <div className={clsx('my-6 px-4 md:px-8')}>
      <div className="flex justify-center">
        {!iframeUrl ? (
          <FormCardWrapper title="Email Preferences">
            <Form
              noValidate
              className="flex flex-col gap-5"
              onSubmit={handleSubmit}
            >
              {formError && (
                <div className="mb-6 border border-red p-4 text-sm text-red">
                  <p>{formError}</p>
                </div>
              )}
              <div className="text-center">
                {`Please enter the email address you'd like to update preferences for.`}
              </div>
              <FormFieldText
                id="email"
                name="email"
                type="email"
                required
                aria-label="Email address"
                label="Email address"
                error={emailError || ''}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={(e) =>
                  setEmailError(
                    e.target.validity.valid ? null : 'Invalid email address',
                  )
                }
              />
              <div
                className=""
                id="recaptcha-anchor"
                style={{marginBottom: '20px'}}
              />
              <Button
                className={blueButtonStyles}
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : 'Submit'}
              </Button>
            </Form>
          </FormCardWrapper>
        ) : (
          <iframe
            src={iframeUrl}
            title="Ometria Email Preferences"
            className="h-screen w-full"
          />
        )}
      </div>
    </div>
  );
}

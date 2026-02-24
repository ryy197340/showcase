import {useFetcher, useLoaderData, useSubmit} from '@remix-run/react';
import type {SeoHandleFunction} from '@shopify/hydrogen';
import type {CustomerAccessTokenCreatePayload} from '@shopify/hydrogen/storefront-api-types';
import {
  type ActionFunction,
  type AppLoadContext,
  json,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import clsx from 'clsx';
import {useState} from 'react';

import FormCardWrapper from '~/components/account/FormCardWrapper';
import FormFieldText from '~/components/account/FormFieldText';
import Button, {blueButtonStyles} from '~/components/elements/Button';
import {squareButtonStyles} from '~/components/elements/Button';
import {Link} from '~/components/Link';
import {useCustomLoadScript} from '~/hooks/useCustomLoadScript';
import {badRequest} from '~/lib/utils';
import {isProduction} from '~/utils/global';

const seo: SeoHandleFunction<typeof loader> = ({data}) => ({
  title: 'Login',
});

export const handle = {
  seo,
  isPublic: true,
};

export async function loader({context, request}: LoaderFunctionArgs) {
  const customerAccessToken = await context.session.get('customerAccessToken');
  const isProductionEnv = isProduction(request.url);

  return json({
    isLoggedIn: Boolean(customerAccessToken),
    isProduction: isProductionEnv,
  });
}

type ActionData = {
  formError?: string;
  formSuccess?: boolean;
};

export const action: ActionFunction = async ({request, context}) => {
  const formData = await request.formData();

  const email = formData.get('email');
  const password = formData.get('password');

  if (
    !email ||
    !password ||
    typeof email !== 'string' ||
    typeof password !== 'string'
  ) {
    return badRequest<ActionData>({
      formError: 'Please provide both an email and a password.',
    });
  }

  const {session, storefront, cart} = context;

  try {
    const customerAccessToken = await doLogin(context, {email, password});
    session.set('customerAccessToken', customerAccessToken);

    // Sync customerAccessToken with existing cart
    const result = await cart.updateBuyerIdentity({customerAccessToken});

    // Update cart id in cookie
    const headers = cart.setCartId(result.cart.id);

    headers.append('Set-Cookie', await session.commit());

    fetch(`/swym/api/wishlist/syncuser?email=${encodeURIComponent(email)}`);

    return json<ActionData>(
      {formSuccess: true},
      {
        headers: {
          'Set-Cookie': await session.commit(),
        },
      },
    );
  } catch (error: any) {
    console.error('Login error:', error);

    /**
     * The user did something wrong, but the raw error from the API is not super friendly.
     * Let's make one up.
     */
    return badRequest<ActionData>({
      formError:
        'Sorry. We did not recognize either your email or password. Please try to sign in again or create a new account.',
    });
  }
};
type Props = {
  isAuthModal?: boolean;
};

export default function Login({isAuthModal}: Props) {
  const isProductionEnv = useLoaderData<typeof loader>();
  const fetcher = useFetcher<ActionData>();

  const [nativeEmailError, setNativeEmailError] = useState<null | string>(null);
  const [nativePasswordError, setNativePasswordError] = useState<null | string>(
    null,
  );
  const [reCaptchaError, setReCaptchaError] = useState<null | string>(null);

  useCustomLoadScript(
    'https://www.google.com/recaptcha/api.js?render=6LdRkfIUAAAAAN8rY-h4jo1J3ZTAESOpuoeexkYq&onLoad=onLoadCallback', // Replace with your site key
    {
      onLoadCallback: () => {
        grecaptcha.ready(function () {
          grecaptcha.render('recaptcha-anchor', {
            sitekey: '6LdRkfIUAAAAAN8rY-h4jo1J3ZTAESOpuoeexkYq',
            badge: 'inline',
            size: 'invisible',
            callback: handleSubmit,
          });
        });
      },
    },
  );

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    const currentEvent = event.currentTarget;
    if (!isProductionEnv) fetcher.submit(currentEvent);

    grecaptcha.ready(() => {
      grecaptcha
        .execute('6LdRkfIUAAAAAN8rY-h4jo1J3ZTAESOpuoeexkYq', {action: 'submit'})
        .then(async (token) => {
          try {
            const response = await fetch(`/api/reCaptcha?token=${token}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const result: any = await response.json();
            if (result.isSubmissionValid) {
              fetcher.submit(currentEvent);
            } else {
              setReCaptchaError(
                'There was a problem logging in. Please try again or contact support.',
              );
            }
          } catch {
            setReCaptchaError(
              'There was a problem logging in. Please try again or contact support.',
            );
          }
        });
    });
  };

  if (fetcher.data?.formSuccess) {
    return (
      <div className="my-6 px-4 md:px-8">
        <div className="flex justify-center">
          <FormCardWrapper title="Sign Up" hideBreadcrumbs>
            <div className="bg-green-50 p-4 text-center font-hoefler">
              <h2 className="mb-2 text-center text-lg">You&apos;re all set!</h2>
              <p>Sign in successful, you&apos;re now logged in.</p>
              <p className={`${isAuthModal ? 'hidden' : 'mt-2 block'}`}>
                <Link to="/account" className="underline">
                  Go to your account
                </Link>
              </p>
            </div>
          </FormCardWrapper>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'px-4', //
        'md:px-8',
      )}
    >
      <div className="flex justify-center">
        <FormCardWrapper title="Sign In" hideBreadcrumbs={true}>
          <fetcher.Form
            method="post"
            action="/account/login"
            noValidate
            className="relative flex flex-col gap-5 after:block after:h-[2px] after:w-full after:bg-[#d3d3d3] after:content-['']"
          >
            {/* Form error */}
            {(fetcher.data?.formError || reCaptchaError) && (
              <div className="mb-6 flex items-center justify-center rounded-sm border border-red p-4 text-sm text-red">
                <p>{fetcher.data?.formError || reCaptchaError}</p>
              </div>
            )}

            <div className="flex flex-col justify-center gap-[15px]">
              <p className="text-center text-[14px]">
                Sign in so you can save items to your wishlists, track your
                orders, and check out faster!
              </p>
            </div>

            <div className="flex flex-col gap-5">
              {/* Email */}
              <FormFieldText
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                aria-label="Email address"
                error={nativeEmailError || ''}
                label="Email address"
                onBlur={(event) => {
                  setNativeEmailError(
                    event.currentTarget.value.length &&
                      !event.currentTarget.validity.valid
                      ? 'Invalid email address'
                      : null,
                  );
                }}
              />

              {/* Password */}
              <FormFieldText
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                aria-label="Password"
                minLength={8}
                required
                error={nativePasswordError || ''}
                label="Password"
                onBlur={(event) => {
                  if (
                    event.currentTarget.validity.valid ||
                    !event.currentTarget.value.length
                  ) {
                    setNativePasswordError(null);
                  } else {
                    setNativePasswordError(
                      event.currentTarget.validity.valueMissing
                        ? 'Please enter a password'
                        : 'Passwords must be at least 8 characters',
                    );
                  }
                }}
              />
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-5">
              <div className="flex justify-end">
                <p className="text-sm">
                  <Link
                    className="inline-block align-baseline text-[10px] font-semibold text-darkGray underline"
                    to="/account/recover"
                  >
                    Forgot password?
                  </Link>
                </p>
              </div>
              <div
                className=""
                id="recaptcha-anchor"
                style={{marginBottom: '20px'}}
              ></div>
              <Button
                className={blueButtonStyles}
                type="submit"
                disabled={
                  !!(
                    nativePasswordError ||
                    nativeEmailError ||
                    fetcher.state !== 'idle'
                  )
                }
                data-sitekey="6LdRkfIUAAAAAN8rY-h4jo1J3ZTAESOpuoeexkYq"
                onClick={handleSubmit}
              >
                {fetcher.state !== 'idle' ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </fetcher.Form>
          {!isAuthModal && (
            <div className="mt-4 flex flex-col gap-[10px] text-center text-sm">
              <h1 className="font-hoefler text-[34px]">Sign Up</h1>
              {`Welcome! It's quick and easy to set up an account`}
              <Link
                to="/account/register"
                className={clsx(
                  squareButtonStyles({mode: 'outline', tone: 'default'}),
                )}
              >
                CREATE AN ACCOUNT
              </Link>
            </div>
          )}
        </FormCardWrapper>
      </div>
    </div>
  );
}

const LOGIN_MUTATION = `#graphql
  mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
    customerAccessTokenCreate(input: $input) {
      customerUserErrors {
        code
        field
        message
      }
      customerAccessToken {
        accessToken
        expiresAt
      }
    }
  }
`;

export async function doLogin(
  {storefront}: AppLoadContext,
  {
    email,
    password,
  }: {
    email: string;
    password: string;
  },
) {
  const data = await storefront.mutate<{
    customerAccessTokenCreate: CustomerAccessTokenCreatePayload;
  }>(LOGIN_MUTATION, {
    variables: {
      input: {
        email,
        password,
      },
    },
  });

  if (data?.customerAccessTokenCreate?.customerAccessToken?.accessToken) {
    return data.customerAccessTokenCreate.customerAccessToken.accessToken;
  }

  /**
   * Something is wrong with the user's input.
   */
  throw new Error(
    data?.customerAccessTokenCreate?.customerUserErrors.join(', '),
  );
}

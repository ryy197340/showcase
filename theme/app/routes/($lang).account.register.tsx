import {Link, useActionData, useFetcher, useMatches} from '@remix-run/react';
import {PortableTextBlock} from '@sanity/types';
import type {SeoHandleFunction} from '@shopify/hydrogen';
import type {CustomerCreatePayload} from '@shopify/hydrogen/storefront-api-types';
import {
  type ActionFunction,
  json,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import clsx from 'clsx';
import {useState} from 'react';

import FormCardWrapper from '~/components/account/FormCardWrapper';
import FormFieldText from '~/components/account/FormFieldText';
import Button, {squareButtonStyles} from '~/components/elements/Button';
import PortableText from '~/components/portableText/PortableText';
import {
  badRequest,
  validateBirthdayMonth,
  validateEmail,
  validateProfileName,
} from '~/lib/utils';

import {doLogin} from './($lang).account.login';

const seo: SeoHandleFunction<typeof loader> = () => ({
  title: 'Register',
});

export const handle = {seo};

export async function loader({context}: LoaderFunctionArgs) {
  const customerAccessToken = await context.session.get('customerAccessToken');

  return json({
    isLoggedIn: Boolean(customerAccessToken),
  });
}

type OptInContent = {
  disclaimer: PortableTextBlock[] | null;
  toggleText: string | null;
} | null;

type ActionData = {
  formError?: string;
  formSuccess?: boolean;
};

export const action: ActionFunction = async ({request, context}) => {
  const {session, storefront} = context;
  const formData = await request.formData();

  const firstName = formData.get('firstName')?.toString();
  const lastName = formData.get('lastName')?.toString();
  const birthdayMonth = Number(formData.get('birthdayMonth'));
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();
  const confirmPassword = formData.get('confirmPassword')?.toString();
  const acceptsMarketing = formData.get('acceptsMarketing') === 'on';

  if (password !== confirmPassword) {
    return badRequest<ActionData>({formError: 'Passwords do not match.'});
  }

  if (
    !email ||
    !password ||
    !firstName ||
    !lastName ||
    typeof birthdayMonth !== 'number'
  ) {
    return badRequest<ActionData>({formError: 'Please fill out all fields.'});
  }

  const firstNameValidation = validateProfileName(firstName, 'First name');
  if (!firstNameValidation.isValid) {
    return badRequest<ActionData>({formError: firstNameValidation.error});
  }

  const lastNameValidation = validateProfileName(lastName, 'Last name');
  if (!lastNameValidation.isValid) {
    return badRequest<ActionData>({formError: lastNameValidation.error});
  }

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return badRequest<ActionData>({formError: emailValidation.error});
  }

  const birthdayMonthValidation = validateBirthdayMonth(birthdayMonth);
  if (!birthdayMonthValidation.isValid) {
    return badRequest<ActionData>({formError: birthdayMonthValidation.error});
  }

  try {
    const {adminApiClient} = context;
    if (!adminApiClient) {
      return new Response(
        JSON.stringify({error: 'Admin API client is not configured.'}),
        {status: 500, headers: {'Content-Type': 'application/json'}},
      );
    }

    const data = await storefront.mutate<{
      customerCreate: CustomerCreatePayload;
    }>(CUSTOMER_CREATE_MUTATION, {
      variables: {
        input: {
          email,
          password,
          firstName,
          lastName,
          acceptsMarketing,
        },
      },
    });

    const customerErrors = data?.customerCreate?.customerUserErrors || [];

    if (!data?.customerCreate?.customer?.id || customerErrors.length > 0) {
      throw new Error(customerErrors.map((e) => e.message).join(', '));
    }

    const customerId = data.customerCreate.customer.id;

    //Set metafield (birthday_month) with admin
    const mutation = `#graphql
      mutation customerUpdate($input: CustomerInput!) {
        customerUpdate(input: $input) {
          customer {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const {data: adminData} = await adminApiClient.request(mutation, {
      variables: {
        input: {
          id: customerId,
          metafields: [
            {
              namespace: 'custom',
              key: 'birthday_month',
              type: 'number_integer',
              value: String(birthdayMonth),
            },
          ],
        },
      },
    });

    if (adminData?.customerUpdate?.userErrors?.length) {
      console.error('Metafield update errors:');
      adminData.customerUpdate.userErrors.forEach(
        (error: any, index: number) => {
          console.error(
            `  ${index + 1}: Field - ${error.field?.join('.')}, Message - ${
              error.message
            }`,
          );
        },
      );
    }

    // Log in the new customer
    const customerAccessToken = await doLogin(context, {email, password});
    session.set('customerAccessToken', customerAccessToken);

    return json<ActionData>(
      {formSuccess: true},
      {
        headers: {
          'Set-Cookie': await session.commit(),
        },
      },
    );
  } catch (error: any) {
    console.error('Registration error:', error);

    return badRequest<ActionData>({
      formError: `We have sent an email to ${email}, please click the link included to verify your email address`,
    });
  }
};

type Props = {
  isAuthModal?: boolean;
};

export default function Register({isAuthModal}: Props) {
  const fetcher = useFetcher<ActionData>();
  const [root]: any = useMatches();
  const optIn: OptInContent = root?.data.layout?.optInLanguage;
  const actionData = useActionData<ActionData>();
  const [step, setStep] = useState(1);
  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    birthdayMonth: '',
  });
  const [errors, setErrors] = useState<{[key: string]: string | null}>({});

  const handleChange = (field: string, value: string) => {
    setFormValues((prev) => ({...prev, [field]: value}));
  };

  const validateStepOne = () => {
    const newErrors: {[key: string]: string | null} = {};
    if (!formValues.email || !/^\S+@\S+\.\S+$/.test(formValues.email)) {
      newErrors.email = 'Please enter a valid email.';
    }
    if (!formValues.password || formValues.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }
    if (formValues.password !== formValues.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStepOne()) {
      setStep(2);
    }
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
    <div className="my-6 px-4 md:px-8">
      <div className="flex justify-center">
        <FormCardWrapper title="Sign Up" hideBreadcrumbs>
          <p className="mb-5 text-center text-[14px]">
            Save items to your wishlist, track your orders and check out faster!
          </p>
          <fetcher.Form
            method="post"
            action="/account/register"
            noValidate
            className="relative flex flex-col gap-5 after:block after:h-[2px] after:w-full after:bg-[#d3d3d3] after:content-['']"
          >
            {actionData?.formError && (
              <div className="mb-4 rounded-sm border border-red p-4 text-sm text-red">
                <p>{actionData.formError}</p>
              </div>
            )}

            {step === 1 ? (
              <>
                <FormFieldText
                  id="email"
                  name="email"
                  type="email"
                  required
                  aria-label="Email address"
                  label="Email address"
                  autoComplete="email"
                  value={formValues.email}
                  onChange={(e) => handleChange('email', e.currentTarget.value)}
                  error={errors.email || ''}
                />
                <FormFieldText
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  aria-label="Password"
                  minLength={8}
                  required
                  label="Password"
                  value={formValues.password}
                  onChange={(e) =>
                    handleChange('password', e.currentTarget.value)
                  }
                  error={errors.password || ''}
                />
                <FormFieldText
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  aria-label="Confirm Password"
                  minLength={8}
                  required
                  label="Confirm Password"
                  value={formValues.confirmPassword}
                  onChange={(e) =>
                    handleChange('confirmPassword', e.currentTarget.value)
                  }
                  error={errors.confirmPassword || ''}
                />
                <Button onClick={handleNext}>NEXT</Button>
              </>
            ) : (
              <>
                <input type="hidden" name="email" value={formValues.email} />
                <input
                  type="hidden"
                  name="password"
                  value={formValues.password}
                />
                <input
                  type="hidden"
                  name="confirmPassword"
                  value={formValues.confirmPassword}
                />

                <FormFieldText
                  id="firstName"
                  name="firstName"
                  label="First Name"
                  aria-label="First Name"
                  value={formValues.firstName}
                  onChange={(e) =>
                    handleChange('firstName', e.currentTarget.value)
                  }
                />
                <FormFieldText
                  id="lastName"
                  name="lastName"
                  label="Last Name"
                  aria-label="Last Name"
                  value={formValues.lastName}
                  onChange={(e) =>
                    handleChange('lastName', e.currentTarget.value)
                  }
                />
                <div className="form-field">
                  <label
                    htmlFor="birthdayMonth"
                    className="text-gray-700 block text-sm font-medium"
                  >
                    Birthday Month
                  </label>
                  <select
                    id="birthdayMonth"
                    name="birthdayMonth"
                    value={formValues.birthdayMonth}
                    onChange={(e) =>
                      handleChange('birthdayMonth', e.currentTarget.value)
                    }
                    className="border-gray-300 shadow-sm mt-1 block w-full rounded-md focus:border-black focus:ring-black sm:text-sm"
                  >
                    <option value="">Select a month</option>
                    {[
                      'January',
                      'February',
                      'March',
                      'April',
                      'May',
                      'June',
                      'July',
                      'August',
                      'September',
                      'October',
                      'November',
                      'December',
                    ].map((month, index) => (
                      <option key={month} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>

                <Button type="submit">Sign Up</Button>

                <div className="mt-4 flex flex-col gap-3">
                  <label className="flex items-center">
                    <input
                      id="acceptsMarketing"
                      type="checkbox"
                      name="acceptsMarketing"
                      className="mr-2"
                    />
                    <span className="text-[12px]">
                      {optIn?.toggleText ||
                        'Email me with news and offers (Optional)'}
                    </span>
                  </label>
                  {optIn?.disclaimer && (
                    <PortableText
                      blocks={optIn.disclaimer}
                      className="text-[12px]"
                    />
                  )}
                </div>
              </>
            )}
          </fetcher.Form>
          {!isAuthModal && (
            <div className="mt-4 flex flex-col gap-[10px] text-center text-sm">
              Already have an account?{' '}
              <Link
                to="/account/login"
                className={clsx(
                  squareButtonStyles({mode: 'outline', tone: 'default'}),
                )}
              >
                Sign In
              </Link>
            </div>
          )}
        </FormCardWrapper>
      </div>
    </div>
  );
}

const CUSTOMER_CREATE_MUTATION = `#graphql
  mutation customerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        id
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

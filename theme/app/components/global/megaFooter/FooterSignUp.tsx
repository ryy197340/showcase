import {useCallback, useContext, useEffect, useRef, useState} from 'react';

import {GlobalContext} from '~/lib/utils';
//import { pushNewsletterSubscribe } from '~/utils/eventTracking';
import {pushNewsletterSubscribe} from '~/utils/gtmEvents'; //PEAK ACTIVITY ADDITION

import LocalizedA from '../LocalizedA';

export const BUTTON_STYLES =
  'md:w-1/3 text-xs min-h-[50px] placeholder-darkGray px-3 text-primary rounded-none w-full';

export const DUMMY_PLACEHOLDER_STYLES = 'md:w-1/3 text-xs px-3 w-full -mt-3';

export default function FooterSignUp() {
  const {storeDomain, OMETRIA_ACCOUNT} = useContext(GlobalContext);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [shopifySubmissionSuccess, setShopifySubmissionSuccess] =
    useState(false);
  const [shopifySubmissionErrorMessage, setShopifySubmissionErrorMessage] =
    useState('');

  const fullNameRef = useRef(null);

  const environment =
    OMETRIA_ACCOUNT === '0000d87c6912ad69' ? 'production' : 'staging';

  useEffect(() => {
    if (fullNameRef.current) {
      fullNameRef.current.value = `${firstName} ${lastName}`.trim();
    }
  }, [firstName, lastName]);

  const submitHandler = async (e) => {
    e.preventDefault();

    const response = await fetch('/api/createCustomer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        firstName,
        lastName,
      }),
    });

    const data: {error?: string} = await response.json();

    if (!response.ok && data.error) {
      setShopifySubmissionSuccess(false);
      setShopifySubmissionErrorMessage(data.error);
      return;
    }

    setShopifySubmissionSuccess(true);
    setShopifySubmissionErrorMessage('');
  };

  return (
    <div className="flex flex-col gap-5 bg-primary px-5 pb-10 pt-[30px] leading-[250%] text-white md:px-10">
      <div className="page-width flex w-full flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h3 className="font-gotham text-xs font-semibold tracking-[1.2px] text-white">
            STAY CONNECTED
          </h3>
          <span className="text-xs leading-[166%]">
            Sign up for emails and enjoy 15% off your next full-price purchase!
          </span>
        </div>
        <form
          id="CustomerInfo"
          className="flex flex-col gap-5 md:flex-row"
          action="https://api.ometria.com/forms/signup"
          method="post"
          onSubmit={submitHandler}
        >
          <input
            type="hidden"
            name="__form_id"
            value={`${
              environment === 'staging'
                ? '59e7502906b2a3f40be4bb5ea3bb0590'
                : '4028b66d328378b7bafa668269c84646'
            }`}
          />
          <input
            type="hidden"
            name="email"
            defaultValue=""
            autoComplete="off"
          />
          <div className="hidden">
            <input
              name="__email"
              type="email"
              defaultValue=""
              autoComplete="off"
            />
          </div>
          <input name="@account" type="hidden" value={OMETRIA_ACCOUNT} />
          <input name="@return_url" type="hidden" value="" />
          <input name="@subscription_status" type="hidden" value="SUBSCRIBED" />
          <input
            type="text"
            id="FullName"
            name="fullname"
            ref={fullNameRef}
            className="hidden"
            placeholder="Full Name"
          />
          <input
            type="text"
            id="Firstname"
            name="firstname"
            className={BUTTON_STYLES}
            placeholder="First Name"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
            }}
            required
          />
          <input
            type="text"
            id="Lastname"
            name="lastname"
            className={BUTTON_STYLES}
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
            }}
            required
          />
          <input
            id="Email"
            type="email"
            name="ue"
            className={BUTTON_STYLES}
            placeholder="Enter email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            required
          />
          <button
            id="submit"
            type="submit"
            onClick={() => {
              pushNewsletterSubscribe({
                email,
              });
            }}
            className={`bg-secondary text-white ${BUTTON_STYLES}`}
          >
            SUBMIT
          </button>
        </form>
        {shopifySubmissionSuccess && (
          <div className="flex">
            <div
              className={`hidden sm:invisible sm:block ${DUMMY_PLACEHOLDER_STYLES}`}
            ></div>
            <div
              className={`hidden sm:invisible sm:block ${DUMMY_PLACEHOLDER_STYLES}`}
            ></div>
            <div
              className={`hidden sm:invisible sm:block ${DUMMY_PLACEHOLDER_STYLES}`}
            ></div>
            <div
              className={`text-center text-signupSuccessMsg ${DUMMY_PLACEHOLDER_STYLES}`}
            >
              Thank you for signing up to our emails!
            </div>
          </div>
        )}
        {shopifySubmissionErrorMessage && (
          <div className="flex">
            <div
              className={`hidden sm:invisible sm:block ${DUMMY_PLACEHOLDER_STYLES}`}
            ></div>
            <div
              className={`hidden sm:invisible sm:block ${DUMMY_PLACEHOLDER_STYLES}`}
            ></div>
            <div
              className={`hidden sm:invisible sm:block ${DUMMY_PLACEHOLDER_STYLES}`}
            ></div>
            <div className={`text-center text-red ${DUMMY_PLACEHOLDER_STYLES}`}>
              {/* prioritize shopify submission error since it's more informative */}
              {shopifySubmissionErrorMessage}
            </div>
          </div>
        )}
        <span className="text-xs">
          *By subscribing you are agreeing to J McLaughlin&#39;s{' '}
          <LocalizedA
            href="/pages/terms-of-service"
            rel="noreferrer"
            target="_blank"
            className="underline"
          >
            Terms and Conditions
          </LocalizedA>{' '}
          and{' '}
          <LocalizedA
            href="/pages/privacy-policy"
            rel="noreferrer"
            target="_blank"
            className="underline"
          >
            Privacy Policy
          </LocalizedA>
          .
        </span>
      </div>
    </div>
  );
}

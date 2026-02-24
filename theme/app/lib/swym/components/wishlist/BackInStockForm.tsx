import React, {useContext, useEffect, useState} from 'react';

import {useSwymContext} from '~/lib/swym/context/SwymContext';
import {GlobalContext} from '~/lib/utils';

interface BackInStockFormProps {
  product: any;
  selectedVariant: any;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const BackInStockForm: React.FC<BackInStockFormProps> = ({
  product,
  selectedVariant,
  onSuccess,
  onError,
}) => {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isAlreadySubscribed, setIsAlreadySubscribed] = useState(false);
  const {
    fetchBackInStockSubscriptions,
    isSubscribedToBackInStock,
    backInStockSubscriptions,
    syncuserBIS,
  } = useSwymContext();
  const {customer, isAuthenticated} = useContext(GlobalContext);

  useEffect(() => {
    const savedConsent = localStorage.getItem('backInStockConsent');
    const savedEmail = localStorage.getItem('backInStockEmail');

    if (savedConsent === 'true') {
      setConsent(true);
    }

    if (isAuthenticated && customer?.email) {
      setEmail(customer.email);
    } else if (savedEmail) {
      setEmail(savedEmail);
    }
  }, [isAuthenticated, customer?.email]);

  // Check if product is already in subscription list
  const checkExistingSubscription = async () => {
    try {
      const currentProductId = Number(product.id.split('/').pop());
      const currentVariantId = Number(
        selectedVariant?.id.split('/').pop() ||
          product.selectedVariant?.id.split('/').pop() ||
          product.variants?.edges?.[0]?.node?.id.split('/').pop(),
      );

      const isSubscribed = isSubscribedToBackInStock(
        currentProductId,
        currentVariantId,
      );
      setIsAlreadySubscribed(isSubscribed);
    } catch (error) {
      // Silently handle error - don't show error for subscription check

      console.error('Error checking existing subscription:', error);
    }
  };

  useEffect(() => {
    setIsSuccess(false);
    setIsAlreadySubscribed(false);
    checkExistingSubscription();
  }, [product, selectedVariant]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isAuthenticated) {
      return;
    }

    const value = e.target.value;
    setEmail(value);

    // Clear error when user starts typing
    if (emailError) {
      setEmailError('');
    }
  };

  const handleConsentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConsent(e.target.checked);
    localStorage.setItem('backInStockConsent', e.target.checked.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      if (!email) {
        setEmailError('Email is required');
        return;
      }

      if (!validateEmail(email)) {
        setEmailError('Invalid Email');
        return;
      }
    }

    if (!consent) {
      onError?.('Please accept the terms and conditions');
      return;
    }

    setIsSubmitting(true);

    try {
      // Make API call to create back-in-stock subscription
      const formData = new FormData();
      formData.append('email', email);
      formData.append('productId', product.id.split('/').pop());
      formData.append(
        'variantId',
        selectedVariant?.id.split('/').pop() ||
          product.selectedVariant?.id.split('/').pop() ||
          product.variants?.edges?.[0]?.node?.id.split('/').pop(),
      );
      formData.append(
        'productUrl',
        `${window.location.origin}/products/${product.handle}`,
      );

      const response = await fetch('/swym/api/backinstock/create', {
        method: 'POST',
        body: formData,
      });

      const result = (await response.json()) as {
        success: boolean;
        error?: string;
      };

      if (!result.success) {
        throw new Error(result.error || 'Failed to create subscription');
      }

      setIsSuccess(true);
      onSuccess?.();

      await fetchBackInStockSubscriptions();

      const previousEmail = localStorage.getItem('backInStockEmail');
      localStorage.setItem('backInStockEmail', email);

      if (previousEmail !== email) {
        await syncuserBIS(email);
      }

      setEmailError('');
    } catch (error) {
      onError?.('Failed to submit notification request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success message component && show if product already in subscription
  if (isSuccess || isAlreadySubscribed) {
    return (
      <div className="rounded-sm bg-[#f8f6f3] p-4">
        {!product.isQuickView && (
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={() => {
                const similarItemsSection =
                  document.getElementById('recommendations');
                if (similarItemsSection) {
                  similarItemsSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'end',
                  });
                  similarItemsSection.focus();
                }
              }}
              className="cursor-pointer text-xs font-medium text-[#0a2148] underline hover:opacity-80"
            >
              SEE SIMILAR ITEMS
            </button>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="mt-3 flex items-center gap-2">
            <div>
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0a2148]">
                <svg
                  className="h-3 w-3 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <div className="gray-800 text-xs">
              {isAlreadySubscribed
                ? "You're already subscribed to notifications for this item."
                : "Thanks!  We'll notify you if this item becomes available."}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-sm bg-[#f8f6f3] p-4">
      <div className="mb-4">
        <h3 className="text-md text-[#13294E]">
          Be the first to know its here!
        </h3>

        {emailError && (
          <div className="mb-2 mt-6 text-[12px] font-medium text-red">
            {emailError}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="Email : abc@example.com"
            className={`h-[40px] w-full rounded-sm border px-3 py-2 text-sm ${
              emailError
                ? 'border-red bg-white focus:border-red'
                : isAuthenticated
                ? 'bg-gray-100 text-gray-600 border-gray'
                : 'border-gray bg-white focus:border-[#0a2148]'
            } focus:outline-none`}
            disabled={isSubmitting || isAuthenticated}
            readOnly={isAuthenticated}
          />
        </div>

        <div className="flex items-start space-x-2">
          <input
            type="checkbox"
            id="consent"
            hidden
            checked={consent}
            onChange={handleConsentChange}
            disabled={isSubmitting}
            className="border-gray-300 mt-1 h-4 w-4 rounded-full text-[#0a2148] focus:opacity-80 focus:ring-[#0a2148]"
          />
          <label
            htmlFor="consent"
            className="leading-relaxed flex cursor-pointer gap-3 text-xs text-black"
          >
            <div>
              <div
                className={`
                  mt-[2px] flex h-5 w-5 items-center 
                  justify-center rounded-full border transition-all duration-200
                  ${
                    consent
                      ? 'border-[#0c2340] bg-[#0c2340]'
                      : 'border-[#ccc] bg-white'
                  }
                `}
              >
                {consent && (
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
            </div>
            <span>
              By submitting this request, you are agreeing to receive
              personalized and promotional marketing messages and to{' '}
              <a
                href="/pages/terms-and-conditions"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#0a2148] underline hover:opacity-80"
              >
                Terms and Conditions
              </a>{' '}
              and{' '}
              <a
                href="/pages/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#0a2148] underline hover:opacity-80"
              >
                Privacy Policy
              </a>
              .
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || (!isAuthenticated && !email) || !consent}
          className={`h-[50px] w-full rounded-sm bg-[#0a2148] px-4 py-3 text-sm font-medium text-white transition-colors hover:opacity-80 ${
            isSubmitting || (!isAuthenticated && !email) || !consent
              ? 'cursor-not-allowed opacity-50'
              : ''
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Notify Me If Available'}
        </button>
      </form>
    </div>
  );
};

export default BackInStockForm;

import {
  AttributeInput,
  InputMaybe,
} from '@shopify/hydrogen/storefront-api-types';
import {useEffect, useState} from 'react';

export default function DigitalGiftCardForm({
  setLineAttributes,
  isValidEmail,
  setIsValidEmail,
}: {
  setLineAttributes: (
    lineAttributes: InputMaybe<Array<AttributeInput>>,
  ) => void;
  isValidEmail?: boolean;
  setIsValidEmail: () => void;
}) {
  const [formState, setFormState] = useState<{[key: string]: string}>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: string,
  ) => {
    setFormState({
      ...formState,
      [key]: e.target.value,
    });
  };

  const handleEmailBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const email = e.target.value;
    const regex =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[([0-9]{1,3}\.){3}[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const isValid = regex.test(email); // Basic email validation regex

    setIsValidEmail(isValid);
  };

  useEffect(() => {
    // reshape data for AddToCartButton
    const lineAttributes = [];

    for (const [key, value] of Object.entries(formState)) {
      lineAttributes.push({key, value});
    }

    setLineAttributes(lineAttributes);
  }, [formState, setLineAttributes]);

  return (
    <div className="relative pb-4">
      <form>
        <div className="mt-5">
          <label htmlFor="recipient-name">Recipient name</label>
          <input
            className="focus:shadow-outline w-full appearance-none border px-3 py-2 focus:outline-none"
            id="recipient-name"
            required={true}
            type="text"
            onChange={(e) => {
              handleChange(e, 'Recipient name');
            }}
            value={formState['Recipient name']}
          />
        </div>

        <div className="mt-5">
          <label htmlFor="recipient-email">Recipient email</label>
          <input
            className="focus:shadow-outline w-full appearance-none border px-3 py-2 focus:outline-none"
            id="recipient-email"
            required={true}
            type="email"
            onChange={(e) => {
              handleChange(e, 'Recipient email');
            }}
            onBlur={handleEmailBlur} // validate email on blur
            value={formState['Recipient email']}
          />
          {!isValidEmail && (
            <span className="text-red-500 text-sm text-red">
              * Invalid email
            </span>
          )}
        </div>

        <div className="mt-5">
          <label htmlFor="sender-name">Sender name</label>
          <input
            className="focus:shadow-outline w-full appearance-none border px-3 py-2 focus:outline-none"
            id="sender-name"
            required={true}
            type="text"
            onChange={(e) => {
              handleChange(e, 'Your name');
            }}
            value={formState['Your name']}
          />
        </div>

        <div className="mt-5">
          <label htmlFor="greeting">Greeting</label>
          <input
            className="focus:shadow-outline w-full appearance-none border px-3 py-2 focus:outline-none"
            id="greeting"
            type="text"
            onChange={(e) => {
              handleChange(e, 'Message');
            }}
            value={formState['Message']}
          />
        </div>

        <div className="mt-5">
          <label htmlFor="delivery-date">Delivery date</label>
          <input
            className="focus:shadow-outline w-full appearance-none border px-3 py-2 focus:outline-none"
            id="delivery-date"
            type="date"
            onChange={(e) => {
              handleChange(e, 'Delivery date');
            }}
            value={formState['Delivery date']}
          />
        </div>
      </form>
    </div>
  );
}

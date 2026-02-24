import {Cardigan} from 'cardigan-js';
import clsx from 'clsx';
import {useState} from 'react';

import {useCustomLoadScript} from '~/hooks/useCustomLoadScript';

type Message = {
  code: string;
  description: string;
};

type CardiganSuccess = {
  card: {
    currency: string;
    balance: string;
    balance_formatted: string;
    expires_at: string | null;
  };
};

type CardiganErrors = {
  errors: Message[];
};

export default function GiftCardBalanceChecker({
  storeDomain,
}: {
  storeDomain: string;
}) {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      code: 'welcome',
      description: 'Enter a gift card number',
    },
  ]);

  useCustomLoadScript(
    'https://www.google.com/recaptcha/api.js?render=6LdRkfIUAAAAAN8rY-h4jo1J3ZTAESOpuoeexkYq&onLoad=onLoadCallback',
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

  const storeUrl = new URL(storeDomain);
  const subdomain = storeUrl.hostname.replace('.myshopify.com', '');

  // initialise Cardigan instance with configuration options
  const cardigan =
    typeof document !== 'undefined'
      ? new Cardigan(document, window.Shopify, {
          endpoint: 'https://app.runcardigan.com/api/v1',
          subdomain,
        })
      : null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!cardigan) return;
    setMessages([
      {
        code: 'checking_balance',
        description: 'Checking balance...',
      },
    ]);

    grecaptcha.ready(function () {
      grecaptcha
        .execute('6LdRkfIUAAAAAN8rY-h4jo1J3ZTAESOpuoeexkYq', {action: 'submit'})
        .then(async function (token) {
          //make cardigan call
          cardigan.api.getCardBalance({
            options: {
              headers: {
                'X-Verification-Token': token,
              },
            },
            number: inputValue,
            onSuccess: (result: CardiganSuccess) => {
              setMessages([
                {
                  code: 'balance_found',
                  description: `Balance found: ${result.card.balance_formatted}`,
                },
              ]);
            },
            onError: (result: CardiganErrors) => {
              setMessages(result.errors);
            },
          });
        });
    });
  };

  return (
    <div className="flex w-full justify-center">
      <form
        onSubmit={handleSubmit}
        className="shadow-md mb-4 flex max-w-lg flex-col items-center rounded bg-white px-8 pb-8 pt-6 text-center"
      >
        {messages.length > 0 && (
          <div>
            <ul className="mb-4 w-full">
              {messages.map((message, index) => (
                <li key={message.code} className={clsx(index > 0 && 'text-xs')}>
                  {message.description}
                </li>
              ))}
            </ul>
          </div>
        )}
        <input
          type="text"
          className="mb-4 w-full max-w-[256px] appearance-none border px-3 py-2"
          id="code"
          placeholder="Gift Card Number"
          value={inputValue}
          required
          onChange={(e) => {
            setInputValue(e.target.value);
          }}
        />
        <div
          className=""
          id="recaptcha-anchor"
          style={{marginBottom: '20px'}}
        ></div>
        <button
          className="g-recaptcha bg-black px-4 py-2 text-white hover:bg-slate-600"
          data-sitekey="6LdRkfIUAAAAAN8rY-h4jo1J3ZTAESOpuoeexkYq"
          onClick={handleSubmit}
          type="submit"
        >
          Search
        </button>
      </form>
    </div>
  );
}

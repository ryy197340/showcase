import {useState} from 'react';

type Props = {
  currentlyAcceptsMarketing: boolean;
};

export function EmailSubscriptionToggle({currentlyAcceptsMarketing}: Props) {
  // Store the current email subscription status as a state
  const [isChecked, setIsChecked] = useState(currentlyAcceptsMarketing);

  async function handleToggle(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.checked;
    setIsChecked(newValue);

    const response = await fetch('/api/updateCustomerMarketing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({acceptsMarketing: newValue}),
    });

    // If the request fails, revert the state
    if (!response.ok) {
      // And show an error message
      setIsChecked(!newValue);
      alert('Failed to update email subscription status');
    }
  }

  return (
    <div className="space-y-1">
      <div className="text-[14px] font-semibold text-darkGray">
        Email Subscription Status
      </div>
      <div className="flex items-center gap-1">
        <input
          type="checkbox"
          name="accepts_email_marketing"
          id="accepts-email-marketing"
          aria-checked={isChecked}
          role="switch"
          checked={isChecked}
          onChange={handleToggle}
        />
        <label className="text-[14px]" htmlFor="accepts-email-marketing">
          {isChecked ? 'Subscribed' : 'Not subscribed'}
        </label>
      </div>
    </div>
  );
}

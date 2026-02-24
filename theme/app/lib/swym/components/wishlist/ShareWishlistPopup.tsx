import React, {useContext, useRef, useState} from 'react';

import {GlobalContext} from '~/lib/utils';

import {useSwymContext} from '../../context/SwymContext';

interface ShareWishlistPopupProps {
  isVisible: boolean;
  onClose: () => void;
  publicLid: string;
}

const ShareWishlistPopup: React.FC<ShareWishlistPopupProps> = ({
  isVisible,
  onClose,
  publicLid,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const {customer} = useContext(GlobalContext);
  const {setWishlistNotification, setShowWishlistNotification} =
    useSwymContext();
  const customerName =
    customer.firstName && customer.lastName
      ? customer.firstName + ' ' + customer.lastName
      : '';
  const [email, setEmail] = useState('');
  const [senderName, setSenderName] = useState(customerName);
  const [message, setMessage] = useState('Hey there! Check out my wishlist');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleShare = async () => {
    if (!email || !senderName) {
      setError('Recipient email and sender name are required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/swym/api/wishlist/share', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: new URLSearchParams({
          publicLid,
          senderName,
          emailValue: email,
          message,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof result === 'object' && result && 'error' in result
            ? String(result.error)
            : 'Failed to share wishlist',
        );
      }

      setSuccess(true);
      onClose();
      setWishlistNotification({
        title: '',
        info: `List shared successfully.`,
        image: '',
      });
      setShowWishlistNotification(true);
    } catch (err: any) {
      //setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const shareViaLink = () => {
    const link = `${window.location.origin}/swym/sharedwishlist/${publicLid}`;
    navigator.clipboard.writeText(link).then(
      () => {
        setWishlistNotification({
          title: '',
          info: `Link copied to clipboard.`,
          image: '',
        });
        setShowWishlistNotification(true);
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error('Could not copy text: ', err);
      },
    );
    // trigger device share on mobile and close popup
    if (window.innerWidth <= 768) {
      navigator.share({
        url: link,
      });
      onClose();
    }
  };

  const shareListOnPlatform = (platform: string) => {
    const shareUrl = encodeURIComponent(
      `${window.location.origin}/swym/sharedwishlist/${publicLid}`,
    );
    const note = encodeURIComponent(message);
    if (platform == 'facebook') {
      const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${note}`;
      window.open(facebookShareUrl, '_blank', 'width=600,height=400');
    } else if (platform == 'twitter') {
      const twitterShareUrl = `https://twitter.com/share?text=${note}&url=${shareUrl}`;
      window.open(twitterShareUrl, '_blank', 'width=600,height=400');
    }
  };

  if (!isVisible) {
    return null;
  }

  const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      className="fixed inset-0 z-50 flex cursor-default items-center justify-center border-0 bg-black/50"
      onClick={handleBackdropClick}
      onKeyDown={handleOverlayKeyDown}
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
      aria-labelledby="wishlist-share-title"
    >
      <div
        ref={modalRef}
        className="shadow-lg flex w-[90%] max-w-md flex-col gap-[14px] rounded-lg bg-white p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <div id="wishlist-share-title">Share Wishlist</div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M6 18L18 6M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <div className="justify-items-start rounded-md border border-gray p-2">
            <label
              htmlFor="recipient-email"
              className="text-gray-700 mb-1 block w-full text-left text-sm font-medium"
            >
              Recipient Email (Required)
            </label>
            <input
              id="recipient-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="abc@example.com"
              className="text-gray-800 placeholder-gray-400 flex w-full rounded-md text-sm outline-none"
            />
          </div>
          <div className="justify-items-start rounded-md border border-gray p-2">
            <label
              htmlFor="sender-name"
              className="text-gray-700 mb-1 block w-full text-left text-sm font-medium"
            >
              Sender Name (Required)
            </label>
            <input
              id="sender-name"
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder=""
              className="text-gray-800 placeholder-gray-400 flex w-full text-sm outline-none"
            />
          </div>
          <div className="w-full justify-items-start rounded-md border border-gray p-2 text-left">
            <label
              htmlFor="message"
              className="text-gray-700 mb-1 block text-sm font-medium"
            >
              Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hey there! Check out my wishlist"
              className="text-gray-800 placeholder-gray-400 block flex w-full rounded-md text-sm outline-none"
              rows={3}
              style={{width: '100%', boxSizing: 'border-box'}}
            />
          </div>
          {error && <p className="mb-4 text-sm text-red">{error}</p>}
        </div>
        <div className="flex justify-between gap-4">
          <button
            onClick={onClose}
            className="w-full cursor-pointer rounded-md border border-gray p-4 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            className="w-full cursor-pointer rounded-md bg-primary p-4 text-sm font-medium text-white"
          >
            Share List
          </button>
        </div>
        <div className="mb-2 mt-2 border border-gray"></div>
        <div className="flex justify-between text-xs md:text-[14px]">
          <button onClick={shareViaLink} className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="15"
              viewBox="0 0 24 24"
            >
              <path d="M13.723 18.654l-3.61 3.609c-2.316 2.315-6.063 2.315-8.378 0-1.12-1.118-1.735-2.606-1.735-4.188 0-1.582.615-3.07 1.734-4.189l4.866-4.865c2.355-2.355 6.114-2.262 8.377 0 .453.453.81.973 1.089 1.527l-1.593 1.592c-.18-.613-.5-1.189-.964-1.652-1.448-1.448-3.93-1.51-5.439-.001l-.001.002-4.867 4.865c-1.5 1.499-1.5 3.941 0 5.44 1.517 1.517 3.958 1.488 5.442 0l2.425-2.424c.993.284 1.791.335 2.654.284zm.161-16.918l-3.574 3.576c.847-.05 1.655 0 2.653.283l2.393-2.389c1.498-1.502 3.94-1.5 5.44-.001 1.517 1.518 1.486 3.959 0 5.442l-4.831 4.831-.003.002c-1.438 1.437-3.886 1.552-5.439-.002-.473-.474-.785-1.042-.956-1.643l-.084.068-1.517 1.515c.28.556.635 1.075 1.088 1.528 2.245 2.245 6.004 2.374 8.378 0l4.832-4.831c2.314-2.316 2.316-6.062-.001-8.377-2.317-2.321-6.067-2.313-8.379-.002z"></path>
            </svg>
            <span>Share via Link</span>
          </button>
          <button
            className="flex items-center gap-1"
            onClick={() => shareListOnPlatform('facebook')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="15"
              viewBox="0 0 24 24"
            >
              <path
                fill="#434655"
                d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"
              ></path>
            </svg>
            <span>Facebook</span>
          </button>
          <button
            className="flex items-center gap-1"
            onClick={() => shareListOnPlatform('twitter')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 50 50"
              height="15"
            >
              <path d="M 5.9199219 6 L 20.582031 27.375 L 6.2304688 44 L 9.4101562 44 L 21.986328 29.421875 L 31.986328 44 L 44 44 L 28.681641 21.669922 L 42.199219 6 L 39.029297 6 L 27.275391 19.617188 L 17.933594 6 L 5.9199219 6 z M 9.7167969 8 L 16.880859 8 L 40.203125 42 L 33.039062 42 L 9.7167969 8 z"></path>
            </svg>
            <span>Twitter</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareWishlistPopup;

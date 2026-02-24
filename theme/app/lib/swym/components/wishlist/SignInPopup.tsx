import React, {useContext, useEffect, useRef, useState} from 'react';

import AuthModal from '~/components/global/AuthModal';

interface SignInPopupProps {
  showLoginPopup: boolean;
  setShowLoginPopup: (value: boolean) => void;
  popupSource?: 'plp' | any;
}

const SignInPopup: React.FC<SignInPopupProps> = ({
  showLoginPopup,
  setShowLoginPopup,
  popupSource,
}) => {
  const loginPopupRef = useRef<HTMLDivElement | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (
        loginPopupRef.current &&
        !loginPopupRef.current.contains(event.target as Node)
      ) {
        setShowLoginPopup(false);
      }
    };

    if (showLoginPopup) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showLoginPopup]);

  const handleAuthModalClose = () => {
    setShowAuthModal(false);
    setShowLoginPopup(false); // Also close the signin popup when auth modal closes
  };

  const handleSignInClick = () => {
    setAuthView('login');
    setShowAuthModal(true);
    setShowLoginPopup(false); // Close the signin popup
  };

  const handleCreateAccountClick = () => {
    setAuthView('register');
    setShowAuthModal(true);
    setShowLoginPopup(false); // Close the signin popup
  };

  return (
    <>
      <div ref={loginPopupRef}>
        <div
          className={`${
            (popupSource === 'plp' || popupSource === 'recos') &&
            window.innerWidth > 768
              ? 'absolute bottom-0 left-0 z-10'
              : 'swym-h-login-popup-shadow fixed right-0 top-0 z-[300] ml-4 mr-4 mt-4 max-w-fit'
          } swym-h-login-popup flex w-full flex-col bg-white p-4 pb-4 pt-8 shadow duration-200 ease-in-out
            ${
              showLoginPopup
                ? `swym-h-login-popup-visible flex translate-x-0 opacity-100 md:translate-x-0 md:translate-y-0`
                : 'swym-h-login-popup-hidden translate-x-full opacity-0 md:bottom-0 md:translate-x-0 md:translate-y-full'
            }`}
        >
          <button
            onClick={() => setShowLoginPopup(false)}
            className="absolute right-0 top-0 p-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <mask
                id="mask0_126_234"
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="24"
                height="24"
              >
                <rect width="24" height="24" fill="#D9D9D9" />
              </mask>
              <g mask="url(#mask0_126_234)">
                <path
                  d="M8.05365 16.673L7.3269 15.9462L11.2729 12L7.3269 8.07874L8.05365 7.35199L11.9999 11.298L15.9212 7.35199L16.6479 8.07874L12.7019 12L16.6479 15.9462L15.9212 16.673L11.9999 12.727L8.05365 16.673Z"
                  fill="#13294E"
                />
              </g>
            </svg>
          </button>
          <div className="flex flex-col gap-[6px]">
            <div className="text-center font-bold">Save Your Wishlist</div>
            <div className="m-auto text-center text-[14px] leading-[130%]">
              Sign in or create an account to save your wishlist
            </div>
          </div>
          <div className="mt-[20px] flex flex-col gap-[8px]">
            <button
              onClick={handleSignInClick}
              className="w-full bg-primary p-3 text-center text-[14px] text-white"
            >
              SIGN IN
            </button>
            <button
              onClick={handleCreateAccountClick}
              className="w-full p-3 text-center text-[14px]"
            >
              CREATE ACCOUNT
            </button>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={handleAuthModalClose}
        initialView={authView}
      />
    </>
  );
};

export default SignInPopup;

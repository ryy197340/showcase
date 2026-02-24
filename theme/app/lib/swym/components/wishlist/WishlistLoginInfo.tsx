import React, {useContext, useState} from 'react';

import AuthModal from '~/components/global/AuthModal';
import {GlobalContext} from '~/lib/utils';

import {useSwymContext} from '../../context/SwymContext';
// Refactor this to use the AuthModal component and also specific for signup vs signin
const WishlistLoginInfo: React.FC = () => {
  const {locale, isAuthenticated} = useContext(GlobalContext);
  const {wishlist} = useSwymContext();
  const wishlistLength = wishlist?.cnt || 0;
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  return (
    <div className="align-center flex justify-center pb-6">
      {!isAuthenticated && (
        <p className="text-gray-600 mt-4 text-center leading-[130%]">
          {wishlistLength > 0 && (
            <>
              <i className="text-slate-500">Love it? Don&apos;t lose it.</i>
              <br />
            </>
          )}
          <button
            onClick={() => {
              setAuthView('login');
              setShowAuthModal(true);
            }}
            className="text-navy inline font-semibold underline"
          >
            Sign In
          </button>{' '}
          or{' '}
          <button
            onClick={() => {
              setAuthView('register');
              setShowAuthModal(true);
            }}
            className="text-navy inline font-semibold underline"
          >
            Create an Account
          </button>{' '}
          to save your wishlist!
        </p>
      )}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialView={authView}
      />
    </div>
  );
};

export default WishlistLoginInfo;

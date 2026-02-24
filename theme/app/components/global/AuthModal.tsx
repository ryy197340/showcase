import {Dialog} from '@headlessui/react';
import {useLocation} from '@remix-run/react';
import clsx from 'clsx';
import {useEffect, useState} from 'react';

import Login from '~/routes/($lang).account.login';
import Register from '~/routes/($lang).account.register';

import Button, {squareButtonStyles} from '../elements/Button';
import CloseIcon from '../icons/Close';

export default function AuthModal({
  isOpen,
  onClose,
  initialView = 'login',
}: {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'register';
}) {
  const [view, setView] = useState<'login' | 'register'>(initialView);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const isLoggedIn = params.get('loggedin') === 'true';
    const isRegistered = params.get('registered') === 'true';
    const onRecover = location.pathname === '/account/recover';
    const failedRegister =
      location.pathname === '/account/register' &&
      params.get('registered') !== 'true';
    if (isLoggedIn || isRegistered || onRecover || failedRegister) {
      onClose();
    }
  }, [location]);

  // Reset view when modal opens with new initialView
  useEffect(() => {
    if (isOpen) {
      setView(initialView);
    }
  }, [isOpen, initialView]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center overflow-scroll p-4">
        <Dialog.Panel className="shadow-lg relative w-full max-w-md rounded-xl bg-white p-6">
          <div className="absolute right-0 mb-4 flex items-start justify-between">
            <Button
              className="bg-white"
              aria-label="Close Modal"
              onClick={onClose}
            >
              <CloseIcon />
            </Button>
          </div>

          {view === 'login' ? (
            <>
              <Login isAuthModal={true} />
              <div className="mt-4 flex flex-col gap-[10px] px-4 text-center text-sm md:px-8">
                <h1 className="font-hoefler text-[34px]">Sign Up</h1>
                {`Welcome! It's quick and easy to set up an account`}
                <button
                  onClick={() => setView('register')}
                  className={clsx(
                    squareButtonStyles({mode: 'outline', tone: 'default'}),
                  )}
                >
                  CREATE AN ACCOUNT
                </button>
              </div>
            </>
          ) : (
            <>
              <Register isAuthModal={true} />
              <div className="mt-4 flex flex-col gap-[10px] px-4 text-center text-sm md:px-8">
                Already have an account?{' '}
                <button
                  onClick={() => setView('login')}
                  className={clsx(
                    squareButtonStyles({mode: 'outline', tone: 'default'}),
                  )}
                >
                  Sign in
                </button>
              </div>
            </>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

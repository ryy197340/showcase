import {useContext} from 'react';

import {GlobalContext} from '~/lib/utils';

import {CountrySelector} from './global/localizationSelector/CountrySelector';

export default function InitialLocaleConfirmation() {
  const {ipData, isLocaleConfirmed} = useContext(GlobalContext);
  if (ipData && ipData.country != 'US' && isLocaleConfirmed !== true) {
    return (
      <div>
        <div className="fixed inset-0 z-40 block h-full w-full overscroll-none bg-black bg-opacity-50"></div>
        <div className="fixed z-50 h-screen w-full overscroll-none">
          <div className="absolute left-1/2 top-1/3 flex h-[200px] w-[200px] -translate-x-1/2 transform flex-col items-center justify-center bg-white p-4">
            <span>
              Would you like to browse seeing prices local to{' '}
              {ipData.country ? ipData.country : ''}?
            </span>
            <CountrySelector />
          </div>
        </div>
      </div>
    );
  } else {
    return null;
  }
}

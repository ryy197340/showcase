import {useMatches} from '@remix-run/react';
import clsx from 'clsx';

import CloseIcon from '~/components/icons/Close';
import HeaderLogo from '~/components/icons/Logo';
import SanityImage from '~/components/media/SanityImage';

function MobileNavHeader({onClose}: {onClose: () => void}) {
  const [root] = useMatches();
  const layout = root.data?.layout;
  const sanityDataset = root.data?.sanityDataset;
  const sanityProjectID = root.data?.sanityProjectID;
  const {headerLogo} = layout || {};
  return (
    <header
      className={clsx(
        'sticky top-0 z-[15] flex items-center justify-between border-b border-lightGray bg-white',
      )}
    >
      <div className="pb-[6px] pt-[6px]">
        {!headerLogo && <HeaderLogo />}
        {headerLogo && (
          <SanityImage
            alt={headerLogo.altText}
            src={headerLogo.asset?._ref}
            dataset={sanityDataset}
            projectId={sanityProjectID}
            height={headerLogo.height}
            width={headerLogo.width}
            className="h-[58px]"
          />
        )}
      </div>
      <button type="button" onClick={onClose}>
        <CloseIcon />
      </button>
    </header>
  );
}

export default MobileNavHeader;

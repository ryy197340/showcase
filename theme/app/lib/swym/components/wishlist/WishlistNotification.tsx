import {Image} from '@shopify/hydrogen';
import React, {useEffect} from 'react';

type Props = {
  title: string;
  info: string;
  image: string;
  open: boolean;
  onClose: () => void;
};

const WishlistNotification = ({
  title = '',
  info = '',
  image = null,
  open = false,
  onClose = () => {},
}: Props) => {
  useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId = setTimeout(() => {
      onClose();
    }, 3000); // Default timeout to 3000ms if not set

    return () => {
      clearTimeout(timeoutId); // Cleanup timeout on unmount or when `open` changes
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="swym-hl-notification-container fixed right-0 top-0 z-[200] ml-4 mr-4 mt-4 flex items-center gap-4 bg-white p-2 text-[14px] shadow"
      style={{minWidth: '250px'}}
    >
      {image && (
        <span>
          <Image
            src={image}
            width={37}
            height={37}
            alt="Product Image"
            className="swym-hl-alert-img h-12 w-12 rounded object-cover"
          />
        </span>
      )}
      <div className="swym-hl-alert-info-container flex flex-col gap-[5px]">
        <p className="swym-hl-alert-title text-gray-600">{title}</p>
        <p className="swym-hl-alert-info text-gray-800 font-bold">{info}</p>
      </div>
    </div>
  );
};

export default WishlistNotification;

import {useEffect, useRef} from 'react';
import {createPortal} from 'react-dom';

import CloseIcon from '~/components/icons/Close';

export default function ModalCard({
  children,
  title,
  isModalOpen,
  closeModal,
}: {
  children: React.ReactNode;
  title?: string;
  isModalOpen: boolean;
  closeModal: () => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        isModalOpen &&
        modalRef.current &&
        !modalRef.current.contains(e.target as Node)
      ) {
        closeModal();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isModalOpen, closeModal]);

  if (!isModalOpen) return null;

  return createPortal(
    <div
      className="catalog-modal fixed inset-0 z-[100]"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      id="modal-bg"
    >
      <div className="fixed inset-0 bg-black bg-opacity-40 transition-opacity" />
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="relative flex justify-center p-4 sm:items-center sm:p-0 md:h-[680px] md:w-3/4 md:p-4 lg:w-11/12">
          <div
            ref={modalRef}
            className="shadow-xl relative w-full transform cursor-default overflow-hidden rounded bg-white p-4 transition-all md:h-[680px] md:max-w-[840px]"
            role="button"
            onClick={(e) => e.stopPropagation()}
            onKeyUp={(e) => e.stopPropagation()}
            tabIndex={0}
          >
            <div className="absolute right-[16px] top-[16px] z-10 mb-4 flex items-start justify-between">
              {title && <h3 className="text-xl font-bold">{title}</h3>}
              <button aria-label="Close Modal" onClick={closeModal}>
                <CloseIcon />
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

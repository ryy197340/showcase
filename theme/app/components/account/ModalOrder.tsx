import {useEffect, useRef} from 'react';

import Button from '~/components/elements/Button';
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
  const modalRef = useRef(null);
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        isModalOpen &&
        modalRef.current &&
        !(modalRef.current as any).contains(e.target as Node)
      ) {
        closeModal();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isModalOpen, closeModal]);
  return (
    <div
      className={`fixed inset-0 z-[110] ${isModalOpen ? 'block' : 'hidden'}`}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      id="modal-bg"
    >
      <div className="fixed inset-0 bg-black bg-opacity-40 transition-opacity"></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="relative flex h-full w-11/12 justify-center p-4 sm:items-center sm:p-0 md:h-[640px] md:w-3/4 md:p-4">
          <div
            ref={modalRef}
            className="shadow-xl shadow-xl relative h-full w-full transform cursor-default overflow-y-auto rounded bg-white p-4 transition-all "
            role="button"
            onClick={(e) => {
              e.stopPropagation();
            }}
            onKeyUp={(e) => {
              e.stopPropagation();
            }}
            tabIndex={0}
          >
            <div className="absolute right-1 mb-4 flex items-start justify-between">
              <h3 className="text-xl font-bold">{title}</h3>
              <Button
                className="bg-white"
                aria-label="Close Modal"
                onClick={closeModal}
                inlineStyles={{paddingTop: '0'}}
              >
                <CloseIcon />
              </Button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

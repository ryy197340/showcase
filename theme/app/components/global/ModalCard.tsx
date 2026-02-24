import {useEffect, useRef} from 'react';

import Button from '~/components/elements/Button';
import CloseIcon from '~/components/icons/Close';

export default function ModalCard({
  children,
  title,
  isModalOpen,
  closeModal,
  modalType,
}: {
  children: React.ReactNode;
  title?: string;
  isModalOpen: boolean;
  closeModal: () => void;
  modalType?: string;
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
      className={`modal-container fixed inset-0 z-[110] ${
        isModalOpen ? 'block' : 'hidden'
      }`}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      id="modal-bg"
    >
      <div className="fixed inset-0 bg-black bg-opacity-40 transition-opacity"></div>
      <div className="modal fixed inset-0 z-50 flex items-center justify-center">
        <div
          className={`modal-height tablet-height relative flex w-11/12 justify-center p-4 sm:items-center sm:p-0 md:w-11/12 md:p-0 ${
            modalType && modalType === 'size-chart'
              ? 'md:max-h-full'
              : 'md:h-[640px]'
          }`}
        >
          <div
            ref={modalRef}
            className="shadow-xl shadow-xl relative h-[100%] w-full transform cursor-default overflow-y-auto rounded bg-white p-4 transition-all md:max-w-[840px]"
            role="button"
            onClick={(e) => {
              e.stopPropagation();
            }}
            onKeyUp={(e) => {
              e.stopPropagation();
            }}
            tabIndex={0}
          >
            <div className="absolute right-0 mb-4 flex items-start justify-between">
              {title && <h3 className="text-xl font-bold">{title}</h3>}
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

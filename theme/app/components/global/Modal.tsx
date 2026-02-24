import {useEffect, useRef} from 'react';

import Button from '~/components/elements/Button';
import CloseIcon from '~/components/icons/Close';

interface ModalProps {
  children: React.ReactNode;
  title?: string;
  isModalOpen: boolean;
  closeModal: () => void;
  width?: string;
}

const Modal: React.FC<ModalProps> = ({
  children,
  title,
  isModalOpen,
  closeModal,
  width,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (isModalOpen) {
        const modalElement = modalRef.current;
        if (
          modalElement &&
          !modalElement.contains(e.target as Node) &&
          !(e.target as HTMLElement).closest('.modal-arrow')
        ) {
          closeModal();
        }
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isModalOpen, closeModal]);
  return (
    <div
      ref={modalRef}
      className={`fixed inset-0 z-50`}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      id="modal-bg"
    >
      <div className="fixed inset-0 bg-black bg-opacity-20 transition-opacity"></div>
      <div
        className={`fixed ${
          width
            ? width + ` md:top-[80px] md:translate-x-full md:translate-y-1/2`
            : 'inset-0'
        } z-50 flex items-center justify-center`}
      >
        <div className="relative flex justify-center p-4 sm:items-center sm:p-0 md:min-h-full">
          <div
            className="shadow-xl shadow-xl relative w-auto transform cursor-default overflow-hidden rounded bg-white p-4 transition-all lg:max-w-[1200px]"
            role="button"
            onClick={(e) => {
              e.stopPropagation();
            }}
            onKeyPress={(e) => {
              e.stopPropagation();
            }}
            tabIndex={0}
          >
            <div className="relative mb-4 flex items-start justify-between">
              {title && <h3 className="text-xl font-bold">{title}</h3>}
              <Button
                className="absolute right-0 top-0 z-[210] bg-white"
                aria-label="Close Modal"
                onClick={closeModal}
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
};

export default Modal;

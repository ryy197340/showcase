import {useLocation} from '@remix-run/react';
import {useEffect, useRef} from 'react';
const BvGallery = ({productId}: {productId: string}) => {
  const location = useLocation();
  useEffect(() => {
    const destroy = () => {
      if (
        window.crl8?.ready &&
        typeof window.crl8.destroyExperience === 'function'
      ) {
        window.crl8.ready(() => {
          try {
            window.crl8.destroyExperience('product');
          } catch (err) {
            //eslint-disable-next-line no-console
            console.warn('CRL8 destroyExperience error:', err);
          }
        });
      }
    };
    const create = () => {
      const target = document.querySelector(
        '[data-crl8-container-id="product"]',
      );
      if (!target) return;
      if (
        window.crl8?.ready &&
        typeof window.crl8.createExperience === 'function'
      ) {
        window.crl8.ready(() => {
          try {
            target.innerHTML = '';
            window.crl8.createExperience('product');
          } catch (err) {
            //eslint-disable-next-line no-console
            console.error('CRL8 createExperience error:', err);
          }
        });
      } else {
        setTimeout(create, 200);
      }
    };
    destroy();
    create();
    return () => {
      destroy();
    };
  }, [location.pathname]);
  return (
    <div
      data-crl8-container-id="product"
      data-crl8-auto-init="false"
      data-crl8-filter={`productId:${productId}`}
    />
  );
};
export default BvGallery;

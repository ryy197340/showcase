import {ShopifyAnalyticsPayload} from '@shopify/hydrogen';
import type {
  Product,
  ProductVariant,
} from '@shopify/hydrogen/storefront-api-types';
import clsx from 'clsx';
import {useEffect, useState} from 'react';

import Modal from '~/components/global/Modal';
import ProductGallery from '~/components/product/Gallery';
import ProductWidget from '~/components/product/Widget';
import type {PDPGlobalModules, SanityProductPage} from '~/lib/sanity';
import type {CollectionWithNodes, ProductWithNodes} from '~/types/shopify';
import {stripGlobalId} from '~/utils';

import AffirmIcon from '../icons/Affirm';
import CashIcon from '../icons/Cash';
import CreditCardIcon from '../icons/CreditCard';
import ShopPayIcon from '../icons/ShopPay';

type Props = {
  sanityProduct: SanityProductPage;
  storefrontProduct: Product;
  storefrontVariants: ProductVariant[];
  selectedVariant: ProductVariant;
  analytics: ShopifyAnalyticsPayload;
  completeTheLookData?: {
    shopifyData: ProductWithNodes[];
    constructorData: any; // TODO: fix this type
  };
  colorSwatches?: CollectionWithNodes;
  pdpGlobalModules: PDPGlobalModules[];
  cioFamilyTag?: string;
  strippedId?: string;
  bazaarVoiceUGC?: boolean;
  bazaarVoiceUGCPlacement?: string;
};

export default function ProductDetails({
  sanityProduct,
  storefrontProduct,
  storefrontVariants,
  selectedVariant,
  analytics,
  completeTheLookData,
  colorSwatches,
  pdpGlobalModules,
  cioFamilyTag,
  strippedId,
  bazaarVoiceUGC,
  bazaarVoiceUGCPlacement,
}: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const closeModal = () => {
    setIsModalOpen(false);
  };
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize(); // Ensure we check on the first render
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      className="page-width"
      data-cnstrc-product-detail
      data-cnstrc-item-id={stripGlobalId(storefrontProduct.id)}
      data-cnstrc-item-variation-id={stripGlobalId(
        storefrontProduct?.variants?.nodes?.[0]?.id,
      )}
      data-cnstrc-item-name={storefrontProduct?.title}
      data-cnstrc-item-price={
        storefrontProduct?.variants?.nodes?.[0]?.price?.amount
      }
      data-item={storefrontProduct?.id?.split('/').pop()} // used by useTrackElementInteractions
    >
      {/* Gallery */}
      <ProductGallery
        storefrontProduct={storefrontProduct}
        selectedVariant={selectedVariant}
        bazaarVoiceUGC={bazaarVoiceUGC}
        bazaarVoiceUGCPlacement={bazaarVoiceUGCPlacement}
        strippedId={strippedId}
      />
      <div
        className="reviews-container lg:hidden"
        data-bv-show="rating_summary"
        data-bv-product-id={stripGlobalId(storefrontProduct.id)}
      ></div>
      {/* Widget (mobile) */}
      {isMobile ? (
        <div className="lg:hidden">
          <ProductWidget
            sanityProduct={sanityProduct}
            storefrontProduct={storefrontProduct}
            storefrontVariants={storefrontVariants}
            selectedVariant={selectedVariant}
            analytics={analytics}
            pdpGlobalModules={pdpGlobalModules}
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
          />
        </div>
      ) : (
        <div
          className={clsx(
            'float-right hidden h-full md:w-2/5 ',
            'lg:inline-block',
          )}
        >
          <div className="">
            <div className="w-full pb-4 pl-4">
              <div
                className="reviews-container px-6 pb-4"
                data-bv-show="rating_summary"
                data-bv-product-id={stripGlobalId(storefrontProduct.id)}
              ></div>
              <ProductWidget
                sanityProduct={sanityProduct}
                storefrontProduct={storefrontProduct}
                storefrontVariants={storefrontVariants}
                selectedVariant={selectedVariant}
                analytics={analytics}
                pdpGlobalModules={pdpGlobalModules}
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
              />
            </div>
          </div>
        </div>
      )}
      {isModalOpen && (
        <div className="mx-auto w-full justify-center md:w-1/2 md:max-w-[400px]">
          <Modal
            isModalOpen={isModalOpen}
            closeModal={closeModal}
            width="w-full md:w-1/3"
          >
            <div className="flex flex-col gap-4 p-4">
              <h3 className="">Get it now, pay later</h3>
              <p>
                For orders over $50.00, select installments at checkout to split
                your purchase into 4 interest-free payments.
              </p>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-xs">
                  <div className="justify-center">
                    <CashIcon />
                  </div>
                  <p>No fees, ever.</p>
                </div>
                <div className="cc-icon flex items-center gap-2 text-xs">
                  <CreditCardIcon />
                  <p>No impact on your credit score.</p>
                </div>
              </div>
              <p className="text-2xs">
                Payment options are offered by Affirm and are subject to an
                eligibility check and might not be available in all states. CA
                Residents: Loans by Affirm Loan Services, LLC are made or
                arranged pursuant to a California Finance Lender license.
              </p>
              <div className="shoppay-icon flex justify-center">
                <ShopPayIcon />
              </div>
              <div className="flex justify-center text-xs">
                <p>Installments in partnership with</p>
                <AffirmIcon />
              </div>
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
}

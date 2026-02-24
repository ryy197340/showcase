import {
  type ShopifyAnalyticsPayload,
  type ShopifyAnalyticsProduct,
} from '@shopify/hydrogen';
import type {
  AttributeInput,
  InputMaybe,
  Product,
  ProductVariant,
} from '@shopify/hydrogen/storefront-api-types';
import React, {useContext, useEffect, useState} from 'react'; //PEAK added UseContext to retrieve Customer data
import invariant from 'tiny-invariant';

import WarningIcon from '~/components/icons/Warning';
import AddToCartButton from '~/components/product/buttons/AddToCartButtonSquare';
import DigitalGiftCardForm from '~/components/product/DigitalGiftCardForm';
import ProductOptions from '~/components/product/Options';
import ProductColorOptions from '~/components/product/OptionsColor';
import {useEnv} from '~/hooks/useEnv';
import type {PDPGlobalModules, SanityCustomProductOption} from '~/lib/sanity';
import AddToWishlistButton from '~/lib/swym/components/wishlist/AddToWishlistButton';
import BackInStockForm from '~/lib/swym/components/wishlist/BackInStockForm';
import {getInventoryStatus, hasMultipleProductOptions} from '~/lib/utils';
import {GlobalContext} from '~/lib/utils';
import {pushSelectItemNew} from '~/utils/gtmEvents'; //PEAK ACTIVITY ADDITIONS

import Button from '../elements/Button';
import Modal from '../global/Modal';
import AffirmIcon from '../icons/Affirm';
import CashIcon from '../icons/Cash';
import CreditCardIcon from '../icons/CreditCard';
import ShopPayIcon from '../icons/ShopPay';
import StockInfo from './StockInfo';

type ProductFormProduct = Product & {
  finalSale?: {value: string};
  preorderMessage?: {value: string};
  marketingText?: {value: string};
};

type ShopifyAnalyticsProductPlusMerch = ShopifyAnalyticsProduct &
  ProductVariant;

export default function ProductForm({
  product,
  variants,
  selectedVariant,
  analytics,
  customProductOptions,
  pdpGlobalModules,
  setCurrentProductHandle,
  setShouldFetch,
  isPDPYMALCard,
}: {
  product: ProductFormProduct;
  variants: ProductVariant[];
  selectedVariant: ProductVariant;
  analytics: ShopifyAnalyticsPayload;
  customProductOptions?: SanityCustomProductOption[];
  pdpGlobalModules?: PDPGlobalModules[];
  setCurrentProductHandle: (handle: string) => void;
  setShouldFetch?: () => void;
  isPDPYMALCard?: boolean;
}) {
  const {locale} = useContext(GlobalContext);
  const {APTOS_QTY_THRESHOLD} = useEnv();
  const threshold: number = parseFloat(APTOS_QTY_THRESHOLD);
  const [newSelectedVariant, setSelectedVariant] =
    useState<ProductVariant>(selectedVariant);
  const [dynamicProductAnalytics, setDynamicProductAnalytics] =
    useState<ShopifyAnalyticsProductPlusMerch | null>(null);
  //PEAK ACTIVITY ADDITIONS STARTS
  // PEAK: Retrieve customer data from GlobalContext
  const {eventTrackingData} = useContext(GlobalContext);
  const customer = eventTrackingData?.customer; // Access customer data

  // PEAK: Track "SEE DETAILS" click
  const [isSeeDetailsClicked, setSeeDetailsClicked] = useState(false);
  //PEAK ACTIVITY ADDITIONS ENDS
  useEffect(() => {
    const matchingVariantInNewProduct = variants.find((v) =>
      v.selectedOptions.every((opt) => {
        if (opt.name === 'Color') return true;
        return newSelectedVariant?.selectedOptions?.some(
          (oldOpt) => oldOpt.name === opt.name && oldOpt.value === opt.value,
        );
      }),
    );

    if (matchingVariantInNewProduct) {
      setSelectedVariant(matchingVariantInNewProduct);
      return;
    }

    if (selectedVariant && (selectedVariant as any).id) {
      setSelectedVariant(selectedVariant);
    } else {
      setSelectedVariant(product.variants.nodes[0]);
    }
  }, [product.id, variants]);

  const [, , isDigitalGiftCard] = getInventoryStatus(
    product,
    newSelectedVariant,
    threshold,
    true,
  );

  const actualInventory = isDigitalGiftCard
    ? Number.MAX_SAFE_INTEGER
    : typeof (newSelectedVariant as any)?.aptosQty === 'number'
    ? (newSelectedVariant as any).aptosQty
    : newSelectedVariant.quantityAvailable ?? 0;
  const isTruelyOutOfStock = isDigitalGiftCard ? false : actualInventory <= 0;

  const [isValidEmail, setIsValidEmail] = useState(true);
  const minQuantity = Math.min(10, Math.max(0, actualInventory));
  const multipleProductOptions = hasMultipleProductOptions(product.options);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1); // Step 1: Add a state variable for quantity

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const [pdpFinalSaleCopy, setPdpFinalSaleCopy] = useState({
    heading: '',
    bodyText: '',
  });

  const [lineAttributes, setLineAttributes] = useState<
    InputMaybe<Array<AttributeInput>>
  >([]);

  // Set final sale copy
  useEffect(() => {
    if (pdpGlobalModules && pdpGlobalModules[2]) {
      setPdpFinalSaleCopy(pdpGlobalModules[2]);
    }
  }, [pdpGlobalModules]);

  const handleQuantityChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setSelectedQuantity(parseInt(event.target.value));
  };

  // Wrap setSelectedVariant to also call onVariantChange
  const handleSetSelectedVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant);
  };

  let productAnalytics: ShopifyAnalyticsProduct | null = null;

  if (analytics) {
    invariant(
      analytics?.products?.[0],
      'Missing product analytics data for product page',
    );

    productAnalytics = {
      ...analytics.products[0],
      quantity: selectedQuantity,
    };
  }

  useEffect(() => {
    if (!productAnalytics) return;

    setDynamicProductAnalytics({
      ...productAnalytics,
      price: newSelectedVariant.price.amount,
      sku: newSelectedVariant.sku,
      variantGid: newSelectedVariant.id,
      variantName: newSelectedVariant.title,
      merchandise: {
        id: newSelectedVariant.id,
        sku: newSelectedVariant.sku,
        product: {
          title: newSelectedVariant.product.title,
          id: newSelectedVariant.sku,
          handle: newSelectedVariant.product.handle,
        },
        title: newSelectedVariant.title,
        price: {
          amount: newSelectedVariant.price.amount,
        },
        compareAtPrice: {
          amount: newSelectedVariant?.compareAtPrice?.amount,
        },
        image: {
          url: newSelectedVariant?.image?.url,
        },
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newSelectedVariant]);
  //PEAK ACTIVITY ADDITIONS STARTS Trigger dl_select_item when "SEE DETAILS" is clicked
  useEffect(() => {
    if (isSeeDetailsClicked) {
      pushSelectItemNew(product, customer); // Push event with customer data
      setSeeDetailsClicked(false);
    }
  }, [isSeeDetailsClicked, product, customer]);
  //PEAK ACTIVITY ADDITIONS ENDS

  const [isVisible, setIsVisible] = useState(false);

  const stickyATCVisibility = () => {
    if (window.scrollY > 1150) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', stickyATCVisibility);
    return () => {
      window.removeEventListener('scroll', stickyATCVisibility);
    };
  }, []);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <>
      {multipleProductOptions && (
        <>
          <ProductColorOptions
            product={product}
            options={product.options}
            selectedVariant={newSelectedVariant}
            setCurrentProductHandle={setCurrentProductHandle}
            setShouldFetch={setShouldFetch}
            isPDPYMALCard={isPDPYMALCard}
          />

          <ProductOptions
            product={product}
            variants={variants}
            options={product.options}
            selectedVariant={newSelectedVariant}
            customProductOptions={customProductOptions}
            setSelectedVariant={handleSetSelectedVariant}
            threshold={threshold}
          />
        </>
      )}
      {product.marketingText && !isMobile && (
        <p className="mt-[20px] bg-[#f0f8ff] p-2 text-left text-[14px] leading-[1.5rem] text-[#6495ED]">
          {product.marketingText.value}
        </p>
      )}
      {!isTruelyOutOfStock && (
        <div className="relative pb-4">
          <label htmlFor="quantity" className="block py-4 text-xs font-bold">
            Qty
          </label>
          <select
            className="h-[40px] w-[60px] appearance-none border border-gray py-2 pl-3 pr-1 text-xs"
            id="quantity"
            name="quantity"
            disabled={isTruelyOutOfStock}
            value={selectedQuantity}
            onChange={handleQuantityChange}
          >
            {Array.from({length: minQuantity}, (_, index) => (
              <option key={index} value={index + 1}>
                {index + 1}
              </option>
            ))}
          </select>
          <div
            className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2"
            style={{left: '32px', top: '35px'}}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 13 13"
              fill="none"
            >
              <path
                d="M1.76638 3.80378L1.23438 4.33378L6.45637 9.56878L11.7634 4.33478L11.2374 3.80078L6.46137 8.51078L1.76638 3.80378Z"
                fill="#191A1B"
              />
            </svg>
          </div>
          <div className="ml-2 inline-block">
            <StockInfo
              quantityAvailable={actualInventory}
              threshold={threshold || 0}
            />
          </div>
        </div>
      )}

      {isTruelyOutOfStock && (
        <div className="mb-4 mt-4 text-xs font-bold text-red">Out Of Stock</div>
      )}

      {/* Pre-order */}
      {product?.preorderMessage?.value && (
        <div className="mb-4 text-xs font-bold uppercase text-[#6495ed]">
          {product.preorderMessage.value}
        </div>
      )}

      {/* Sale */}
      {product?.finalSale?.value === 'true' && (
        <>
          <div className="mb-4 flex flex-row items-center text-xs uppercase text-red">
            <WarningIcon />
            Final Sale -
            <button
              className="ml-1 underline"
              onClick={() => {
                setIsModalOpen(true);
              }}
            >
              See Details
            </button>
          </div>
          {pdpFinalSaleCopy.heading &&
            pdpFinalSaleCopy.bodyText &&
            isModalOpen === true && (
              <Modal
                isModalOpen={isModalOpen}
                closeModal={() => {
                  setIsModalOpen(false);
                }}
              >
                <div className="max-w-md px-4 pb-8">
                  <h1 className="pb-5 text-xl">{pdpFinalSaleCopy.heading}</h1>
                  <p className="leading-loose text-sm">
                    {pdpFinalSaleCopy.bodyText}
                  </p>
                </div>
              </Modal>
            )}
        </>
      )}

      {isDigitalGiftCard && (
        <div className="relative pb-4">
          <DigitalGiftCardForm
            setLineAttributes={setLineAttributes}
            isValidEmail={isValidEmail}
            setIsValidEmail={setIsValidEmail}
          />
        </div>
      )}

      <div className="flex flex-col space-y-4">
        {!isTruelyOutOfStock && (
          <AddToCartButton
            lines={[
              {
                merchandiseId: newSelectedVariant.id,
                quantity: selectedQuantity,
                attributes: lineAttributes,
              },
            ]}
            disabled={isValidEmail ? isTruelyOutOfStock : 'disabled'}
            analytics={
              dynamicProductAnalytics
                ? {
                    products: [dynamicProductAnalytics],
                    totalValue: parseFloat(dynamicProductAnalytics.price),
                  }
                : null
            }
            product={product}
            selectedVariant={newSelectedVariant}
            buttonClassName="w-full h-[50px]"
            style={{letterSpacing: '1.2px'}}
          />
        )}

        {!isTruelyOutOfStock && locale.country === 'US' && (
          <div className="shoppay-container">
            <span className="text-xs text-[#5c34fc]">
              Buy now, save later - interest-free with <ShopPayIcon />{' '}
              <Button
                onClick={() => {
                  setIsModalOpen(true);
                }}
                className="inline h-4 bg-white p-0 text-xs text-otherGray underline"
              >
                Learn More
              </Button>
            </span>
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
                  For orders over $50.00, select installments at checkout to
                  split your purchase into 4 interest-free payments.
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

        {isTruelyOutOfStock && (
          <BackInStockForm
            product={product}
            selectedVariant={newSelectedVariant}
          />
        )}

        {!isTruelyOutOfStock && (
          <AddToWishlistButton
            product={product}
            selectedVariant={newSelectedVariant}
            buttonType="icon-text"
          />
        )}
      </div>
      {product.marketingText && isMobile && (
        <p className="mt-[20px] bg-[#f0f8ff] p-2 text-left text-[12px] leading-[1.5rem] text-[#6495ED]">
          {product.marketingText.value}
        </p>
      )}

      <div
        className={`sticky-product-form fixed bottom-0 z-40 ml-[-20px] h-[92px] w-full-vw bg-white md:hidden ${
          isVisible ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <div className="flex flex-col p-5">
          <AddToCartButton
            lines={[
              {
                merchandiseId: newSelectedVariant.id,
                quantity: selectedQuantity,
                attributes: lineAttributes,
              },
            ]}
            disabled={isTruelyOutOfStock}
            analytics={
              dynamicProductAnalytics
                ? {
                    products: [dynamicProductAnalytics],
                    totalValue: parseFloat(dynamicProductAnalytics.price),
                  }
                : null
            }
            buttonClassName="w-full h-[50px]"
          />
        </div>
      </div>
    </>
  );
}

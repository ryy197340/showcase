import type {ProductVariant} from '@shopify/hydrogen/storefront-api-types';
import clsx from 'clsx';
import {Dispatch, SetStateAction, useContext, useEffect, useState} from 'react';

import Modal from '~/components/global/ModalCard';
import {Link} from '~/components/Link';
import CioCardGallery from '~/components/product/CioCardGallery';
import ProductDetailsCard from '~/components/product/DetailsCardPLP';
import {
  CioResultLabels,
  Variation,
  VariationsMap,
} from '~/lib/constructor/types';
import {ExtendedProduct as BaseExtendedProduct} from '~/lib/shopify/types';
import AddToWishlistButton from '~/lib/swym/components/wishlist/AddToWishlistButton';
import {normalizeProductLink} from '~/lib/xgen/utils/normalizeProductLink';

interface ExtendedProduct extends BaseExtendedProduct {
  _fetchedLocale?: string;
}
import {RecommendProduct} from '@xgenai/sdk-core/dist/types/recommend';

import {GlobalContext} from '~/lib/utils';
import {ProductWithNodes} from '~/types/shopify';
import {
  convertFamilyOfProductsToVariationsMap,
  useFetchActiveSwatches,
} from '~/utils/productGrid';

import CioCardBadges from './CioCard/CioCardBadges';
import CioCardColorSwatches from './CioCard/CioCardColorSwatches';
import CioCardImageBadging from './CioCard/CioCardImageBadging';
import CioCardPreOrder from './CioCard/CioCardPreOrder';
import CioCardPrice from './CioCard/CioCardPrice';
import CioCardQuickView from './CioCard/CioCardQuickView';
import CioCardReviews from './CioCard/CioCardReviews';

type Props = {
  index: number;
  title: string;
  data: RecommendProduct;
  labels: CioResultLabels;
  products: ExtendedProduct[];
  setProducts: (products: ExtendedProduct[]) => void;
  imageAspectClassName?: string;
  loading: 'eager' | 'lazy';
  familySwatches?: any;
  onClick?: () => void;
  doubleSizeCard?: boolean;
};

const openModal = (setIsModalOpen: Dispatch<SetStateAction<boolean>>) => () => {
  setIsModalOpen(true);
};
const closeModal =
  (setIsModalOpen: Dispatch<SetStateAction<boolean>>) => () => {
    setIsModalOpen(false);
  };

const updateVariation =
  (
    setSelectedSwatch: Dispatch<SetStateAction<string | undefined>>,
    setCurrentImgUrl: Dispatch<SetStateAction<string>>,
    setCurrentProductUrl: Dispatch<SetStateAction<string>>,
    setCurrentPrice: Dispatch<SetStateAction<number | undefined>>,
    setCurrentProductHandle: Dispatch<SetStateAction<string>>,
    swatches: VariationsMap | undefined,
  ) =>
  (key: string, variant: Variation) => {
    if (swatches) {
      setSelectedSwatch(key);
    }
    if (variant.firstImage) {
      setCurrentImgUrl(variant.firstImage);
    }
    if (variant.url) {
      setCurrentProductUrl(variant.url);
    }
    if (variant.minPrice) {
      setCurrentPrice(variant.minPrice);
    }
    setCurrentProductHandle(variant.url.split('/products/')[1]);
  };

export default function CioProductCard({
  index,
  title,
  data,
  labels,
  products,
  setProducts,
  imageAspectClassName = 'aspect-[335/448]',
  loading,
  onClick = () => {},
  doubleSizeCard,
}: Props) {
  const [swatches, setSwatches] = useState<Record<string, Variation>[]>([]);
  const [selectedSwatch, setSelectedSwatch] = useState<string | undefined>(
    undefined,
  );
  //Peak ACTIVITY ADDITON STARTS
  const {eventTrackingData} = useContext(GlobalContext); //Ensure eventTrackingData is accessed
  const customer = eventTrackingData?.customer; //Access customer details
  const fetchActiveSwatches = useFetchActiveSwatches();
  //Peak ACTIVITY ADDITON ENDS
  useEffect(() => {
    const updateSwatches = async () => {
      if (!data.product_types[0]) return null;
      try {
        const resolvedSwatches = await fetchActiveSwatches(
          data.product_types?.find((item) => item.includes('Family')),
        );

        const normalizedSwatches = resolvedSwatches.reduce((acc, obj) => {
          const [key, value] = Object.entries(obj)[0]; // get the single key-value pair
          acc[key] = value;
          return acc;
        }, {} as Record<string, any>);
        setSwatches(resolvedSwatches);
        // Update selected swatch based on the default swatch or the first available swatch
        const defaultSwatch =
          data.colors[0] ||
          (resolvedSwatches.length > 0
            ? Object.keys(resolvedSwatches[0])[0]
            : undefined);
        setSelectedSwatch(defaultSwatch);
        // Update other state variables based on the selected swatch
        setCurrentImgUrl(
          normalizedSwatches[defaultSwatch]?.image_url || data.image_url,
        );
        setCurrentProductUrl(
          normalizedSwatches[defaultSwatch]?.url ||
            normalizeProductLink(data.product_url),
        );
        setCurrentPrice(normalizedSwatches[defaultSwatch]?.price || data.price);
        setCurrentProductHandle(
          (
            normalizedSwatches[defaultSwatch]?.url ||
            normalizeProductLink(data.product_url)
          ).split('/products/')[1],
        );
      } catch (error) {
        console.error('Error resolving familySwatches:', error);
      }
    };
    updateSwatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.prod_id]);

  const [currentImgUrl, setCurrentImgUrl] = useState(data.image_url);
  const [currentProductUrl, setCurrentProductUrl] = useState(() =>
    normalizeProductLink(data.product_url),
  );
  const [currentPrice, setCurrentPrice] = useState(data.price);
  const [currentProductHandle, setCurrentProductHandle] = useState(() => {
    const normalizedUrl = normalizeProductLink(data.product_url);
    return normalizedUrl?.split('/products/')[1];
  });
  const [updatedColorProduct, setUpdatedColorProduct] = useState<
    ProductWithNodes | undefined
  >(undefined);
  const [selectedVariant, setSelectedVariant] = useState<
    ProductVariant | undefined
  >(undefined);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const boundOpenModal = openModal(setIsModalOpen);
  const boundCloseModal = closeModal(setIsModalOpen);
  const boundUpdateVariation = updateVariation(
    setSelectedSwatch,
    setCurrentImgUrl,
    setCurrentProductUrl,
    setCurrentPrice,
    setCurrentProductHandle,
    swatches,
  );
  const {locale} = useContext(GlobalContext);

  useEffect(() => {
    const selectedProduct = products.find(
      (p) =>
        p.handle === currentProductHandle &&
        p._fetchedLocale === `${locale.country}-${locale.currency}`,
    );
    if (selectedProduct) {
      const updatedProduct = {
        ...selectedProduct,
        selectedVariant: selectedProduct.variants.nodes[0],
        isQuickView: true,
      };

      setSelectedVariant(updatedProduct.selectedVariant);
      setUpdatedColorProduct(updatedProduct);
      return;
    }
    // No matching product found for current locale, fetch it
    fetch(`${locale.pathPrefix}/api/products/${currentProductHandle}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data: any) => {
        if (!data.product) return;

        const fetchedProduct = {
          ...data.product,
          isQuickView: true,
          _fetchedLocale: `${locale.country}-${locale.currency}`,
        };
        setSelectedVariant(fetchedProduct.variants.nodes[0]);
        setUpdatedColorProduct(fetchedProduct);

        // Functional state update ensures fresh products list
        setProducts((prevProducts) => {
          const alreadyExists = prevProducts.some(
            (p) =>
              p.handle === fetchedProduct.handle &&
              p._fetchedLocale === fetchedProduct._fetchedLocale,
          );
          if (alreadyExists) return prevProducts;

          const filtered = prevProducts.filter(
            (p) => p.handle !== fetchedProduct.handle,
          );
          return [...filtered, fetchedProduct];
        });
      })
      .catch((error) => {
        console.error('Error fetching localized product:', error);
      });
  }, [
    currentProductHandle,
    locale.pathPrefix,
    locale.country,
    locale.currency,
    products,
    setProducts,
  ]);

  return (
    <div className="not-slot-item group relative col-span-1 w-full overflow-auto md:col-span-4 lg:col-span-3">
      <div
        className={clsx([
          imageAspectClassName,
          'cio-card-gallery relative flex items-center justify-center overflow-hidden bg-white object-cover',
        ])}
      >
        {data.image && (
          <CioCardGallery
            index={index}
            storefrontProduct={updatedColorProduct}
            selectedVariant={selectedVariant}
            currentProductUrl={currentProductUrl}
            loading={loading}
            resultsOnClick={onClick}
            doubleSizeCard={doubleSizeCard}
          />
        )}

        <button
          className={clsx(
            'hover:bg-gray-100 absolute bottom-0 left-0 m-2 cursor-pointer items-center justify-center rounded-full bg-white bg-opacity-50 p-2 text-xs shadow transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 md:hidden',
          )}
          onClick={boundOpenModal}
          aria-label={`Quick view`}
          aria-haspopup="dialog"
        >
          <svg
            width="8"
            height="8"
            viewBox="0 0 8 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M2.76695 7.30506V4.63106H0.0789532V3.07706H2.76695V0.417062H4.36295V3.07706H7.05095V4.63106H4.36295V7.30506H2.76695Z"
              fill="#13294E"
            ></path>
          </svg>
        </button>
        <div className="absolute bottom-0 hidden w-full md:block">
          <CioCardQuickView
            boundOpenModal={boundOpenModal} //Peak ACTIVITY ADDITON
            product={updatedColorProduct}
            variant={selectedVariant}
            currency={locale.currency} // Assuming `locale.currency` contains the currency code
            customer={customer}
            index={index}
            resultsOnClick={onClick}
          />
        </div>
        <CioCardImageBadging
          publishDate={data?.published_at}
          updatedColorProduct={updatedColorProduct}
          topRatedBadgeText={data?.metafields.merchandising.top_rated_badge}
        />
        <AddToWishlistButton
          product={updatedColorProduct}
          buttonSource="plp"
          iconHeight={12.75}
          iconWidth={12}
        />
      </div>
      <div className="mt-[10px] pb-2 text-center text-md">
        <CioCardPreOrder
          preorderMessage={data?.metafields.merchandising.preorder_message}
        />

        {labels && <CioCardBadges labels={labels} />}

        <div className="flex min-h-[100px] flex-col gap-y-[5px] space-y-1">
          {/* Title */}
          <Link
            className="item text-[11px] md:text-[14px]"
            to={currentProductUrl}
            prefetch="intent"
            onClick={onClick}
          >
            {selectedVariant?.product?.title || title}
          </Link>

          {/* Price */}
          <CioCardPrice selectedVariant={selectedVariant} />

          {/* Reviews */}
          <CioCardReviews updatedColorProduct={updatedColorProduct} />

          {swatches && Object.keys(swatches).length > 0 && (
            <CioCardColorSwatches
              swatches={swatches}
              boundUpdateVariation={boundUpdateVariation}
              selectedSwatch={selectedSwatch}
            />
          )}
        </div>

        {/* todo: refactor next */}
        {isModalOpen === true && (
          <Modal isModalOpen={isModalOpen} closeModal={boundCloseModal}>
            <ProductDetailsCard
              data={data}
              products={products}
              setProducts={setProducts}
              title={selectedVariant?.product?.title || title}
              variationsMap={swatches}
              currentProductUrl={currentProductUrl}
            />
          </Modal>
        )}
      </div>
    </div>
  );
}

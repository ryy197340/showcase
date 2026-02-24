import {Image} from '@shopify/hydrogen';
import clsx from 'clsx';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {v4 as uuidv4} from 'uuid';

import Modal from '~/components/global/ModalCardCatalog';
import CardCatalog from '~/components/product/CardCatalog';
import {CompleteTheLook as CompleteTheLookType} from '~/lib/sanity';
import {ExtendedProduct} from '~/lib/shopify/types';
import {hexToRgba} from '~/utils/styleHelpers';

import QuickviewPlus from '../icons/QuickviewPlus';

// Extracted outside to preserve component identity across re-renders
function ProductCard({
  product,
  onProductClick,
}: {
  product: any;
  onProductClick: (product: any) => void;
}) {
  const [fetchedProduct, setFetchedProduct] = useState<ExtendedProduct | null>(
    null,
  );

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const handle = product.store?.slug?.current;
        if (!handle) return;

        const response = await fetch(`/api/catalog/products/${handle}`);
        const data = (await response.json()) as {product: ExtendedProduct};
        setFetchedProduct(data.product);
      } catch (error) {
        console.error('Error fetching product details:', error);
      }
    };
    fetchProduct();
  }, [product]);

  const price = fetchedProduct?.variants?.nodes?.[0]?.price;

  return (
    <div className="group cursor-pointer">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onProductClick(product);
        }}
        className="w-full"
      >
        {/* Product Image */}
        <div className="bg-gray-100 relative mb-2 aspect-[335/448] w-full overflow-hidden">
          <Image
            src={product.store?.previewImageUrl}
            alt={product.store?.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(min-width: 768px) 25vw, 50vw"
          />
        </div>

        {/* Product Info */}
        <div className="space-y-1 px-2 text-center md:px-0 md:text-left">
          <h3 className="text-gray-900 line-clamp-2 text-sm font-medium leading-none">
            {product.store?.title}
          </h3>
          <p className="text-gray-700 min-h-[20px] text-sm">
            {price ? `$${parseFloat(price.amount).toFixed(2)}` : '\u00A0'}
          </p>
        </div>
      </button>
    </div>
  );
}

type Props = {
  module: CompleteTheLookType;
  parentColorTheme?: {background: string; text: string};
};

export default function CompleteTheLook({module, parentColorTheme}: Props) {
  const {products = [], title, variant, colorTheme} = module;
  const effectiveColorTheme = colorTheme || parentColorTheme;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<ExtendedProduct | null>(
    null,
  );
  const [primaryProduct, setPrimaryProduct] = useState<ExtendedProduct | null>(
    null,
  );
  const [relatedProducts, setRelatedProducts] = useState<ExtendedProduct[]>([]);
  const [relatedProductsHandles, setRelatedProductsHandles] = useState<
    string[] | null
  >(null);
  const firstLoad = useRef(true);

  // Scroll direction detection for sticky positioning
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    // Only attach scroll listener on desktop where sticky positioning is used
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    if (!mediaQuery.matches) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDifference = Math.abs(currentScrollY - lastScrollY.current);

      // Only update if scrolled more than 50px to prevent jitter
      if (scrollDifference > 50) {
        if (currentScrollY > lastScrollY.current && currentScrollY > 150) {
          // Scrolling down
          setIsScrollingUp(false);
        } else if (
          currentScrollY < lastScrollY.current &&
          currentScrollY > 150
        ) {
          // Scrolling up
          setIsScrollingUp(true);
        }
        lastScrollY.current = currentScrollY;
      }
    };

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const fetchProductInfo = async (
    handle: string,
    mode: 'activeProduct' | 'relatedProducts',
  ) => {
    try {
      const isNumeric = /^\d+$/.test(handle);
      const url = isNumeric
        ? `/api/style/products/${handle}`
        : `/api/catalog/products/${handle}`;
      const response = await fetch(url);
      const data = await response.json();

      if (mode === 'activeProduct') {
        const product = data.product;
        setActiveProduct(product);
        setIsModalOpen(true);

        // only update relatedProducts on the first active product click
        if (!primaryProduct) {
          setPrimaryProduct(product);

          const handles = products
            .filter((p) => p.store.slug.current !== product.store.slug.current)
            .map((p) => p.store.slug.current);

          setRelatedProductsHandles(handles);
          setRelatedProducts([]);
          firstLoad.current = true;
        }
      } else if (mode === 'relatedProducts') {
        const relatedProduct = isNumeric ? data[0] : data.product;
        setRelatedProducts((prev) => [...(prev || []), relatedProduct]);
      }
    } catch (error) {
      console.error(`Error fetching ${mode}:`, error);
    }
  };
  // Fetch active product details
  useEffect(() => {
    if (activeProduct?.handle) {
      fetchProductInfo(activeProduct.handle, 'activeProduct');
    }
  }, [activeProduct?.handle]);

  // Fetch related products from handles
  useEffect(() => {
    const loadRelated = async () => {
      if (relatedProductsHandles && firstLoad.current) {
        setRelatedProducts([]); // reset before refilling
        await Promise.all(
          relatedProductsHandles.map((handle) =>
            fetchProductInfo(handle, 'relatedProducts'),
          ),
        );
        firstLoad.current = false;
      }
    };
    loadRelated();
  }, [relatedProductsHandles]);

  const handleProductClick = async (product: ExtendedProduct) => {
    if (!primaryProduct) {
      setPrimaryProduct(product);

      const handles = products
        .filter((p) => p.store.slug.current !== product.store.slug.current)
        .map((p) => p.store.slug.current);
      setRelatedProducts([]);
      setRelatedProductsHandles(handles);
      firstLoad.current = true;
    }
    await fetchProductInfo(product.store.slug.current, 'activeProduct');
  };

  return (
    <div
      className={clsx(
        'complete-the-look-module page-width mx-auto flex flex-col overflow-visible md:w-full md:gap-1',
        variant === 'variant 2' && effectiveColorTheme && 'md:pt-4',
      )}
      style={
        effectiveColorTheme
          ? {
              backgroundColor: hexToRgba(effectiveColorTheme.background),
              color: effectiveColorTheme.text,
            }
          : undefined
      }
    >
      {/* Title for non-variant2 layouts */}
      {title && variant !== 'variant 2' && (
        <h2
          className="w-full text-center font-hoefler text-[24px]"
          style={
            effectiveColorTheme ? {color: effectiveColorTheme.text} : undefined
          }
        >
          {title}
        </h2>
      )}

      {variant === 'variant 2' ? (
        // Variant 2: 2-column grid layout with sticky left image
        <div className="flex h-auto w-full flex-col md:grid md:grid-cols-2 md:items-start md:gap-8">
          {/* Hero image with title - sticky on desktop only */}
          {(module.image?.url || products.length > 0) && (
            <div
              className={clsx(
                'self-center bg-inherit transition-[top] duration-500 ease-out md:self-start',
                'md:sticky',
                isScrollingUp ? 'md:top-[180px]' : 'md:top-[20px]',
              )}
            >
              {/* Title for variant 2 - left aligned above image */}
              {title && (
                <div className="mb-4 flex items-center justify-center gap-4 md:justify-between">
                  <h2
                    className="font-hoefler text-[24px]"
                    style={
                      effectiveColorTheme
                        ? {color: effectiveColorTheme.text}
                        : undefined
                    }
                  >
                    {title}
                  </h2>
                  {/* {products.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleProductClick(products[0]);
                      }}
                      className="text-sm underline hover:no-underline"
                      style={
                        effectiveColorTheme
                          ? {color: effectiveColorTheme.text}
                          : undefined
                      }
                    >
                      Shop The Look
                    </button>
                  )} */}
                </div>
              )}
              <Image
                src={
                  module.image?.url ||
                  (products[0] as any)?.store?.previewImageUrl
                }
                alt={
                  module.altText ||
                  (products[0] as any)?.store?.title ||
                  'Wear With'
                }
                className="h-auto w-full object-cover"
                sizes="(min-width: 768px) 50vw, 100vw"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleProductClick(products[0]);
                }}
              />
            </div>
          )}

          {/* 2-column product grid */}
          <div className="mt-4 grid auto-rows-max grid-cols-2 gap-4 md:mt-0">
            {(module.image?.url ? products : products.slice(1)).map(
              (product) => (
                <ProductCard
                  key={product.store?.slug?.current || uuidv4()}
                  product={product}
                  onProductClick={handleProductClick}
                />
              ),
            )}
          </div>
        </div>
      ) : (
        // Default layout
        <div className="grid h-auto w-full grid-cols-[4fr_1fr] gap-1">
          {/* Left: First product */}
          {products.length > 0 && (
            <div className="relative h-full w-full">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleProductClick(products[0]);
                }}
              >
                <Image
                  src={module.image?.url || products[0].store.previewImageUrl}
                  alt={module.altText || products[0].store.title}
                  className={clsx(
                    'product-image h-auto w-full',
                    module.image?.url
                      ? 'aspect-[1920/2560] object-cover'
                      : 'object-contain',
                  )}
                  sizes="100%"
                />
              </button>
              {/* <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleProductClick(products[0]);
                }}
                className="absolute bottom-3 left-3 rounded-full bg-white/50 p-2"
                aria-label="Quick View"
              >
                <div className="text-[12px] font-bold">Shop the Look</div>
              </button> */}
            </div>
          )}

          {/* Right: Remaining products */}
          <div className="grid h-full w-full grid-rows-4 gap-1 pr-2">
            {products.slice(1).map((product) => (
              <div key={uuidv4()} className="relative h-full w-full">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleProductClick(product);
                  }}
                >
                  <Image
                    src={product.store.previewImageUrl}
                    alt={product.store.title}
                    className="h-full w-full object-cover"
                    sizes={'100%'}
                  />
                  <div
                    className="absolute bottom-3 left-1"
                    aria-label="Quick View"
                  >
                    <QuickviewPlus height={19} width={19} />
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isModalOpen && activeProduct && (
        <Modal
          isModalOpen={isModalOpen}
          closeModal={() => setIsModalOpen(false)}
        >
          <CardCatalog
            data={activeProduct}
            products={[activeProduct]}
            relatedProducts={relatedProducts}
            title={activeProduct.title}
            currentProductUrl={`/products/${activeProduct.handle}`}
            setActiveProduct={setActiveProduct}
            primaryProduct={primaryProduct}
          />
        </Modal>
      )}
    </div>
  );
}

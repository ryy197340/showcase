import {useMatches} from '@remix-run/react';
import {stegaClean} from '@sanity/client/stega';
import clsx from 'clsx';
import useEmblaCarousel from 'embla-carousel-react';
import {useEffect, useRef, useState} from 'react';
import {v4 as uuidv4} from 'uuid';

import Modal from '~/components/global/ModalCardCatalog';
import SanityImage from '~/components/media/SanityImage';
import CardCatalog from '~/components/product/CardCatalog';
import ImageGridHotspot from '~/components/product/HotspotImageGrid';
import {
  CatalogImage,
  CatalogRowOfImages as CatalogRowOfImagesType,
  TextModule as TextModuleType,
} from '~/lib/sanity/types';
import {SanityColorTheme} from '~/lib/theme';
import {DEFAULT_COLOR_THEME} from '~/lib/utils';

import TextModule from './TextModule';

type Props = {
  module: CatalogRowOfImagesType;
  isSlottedContent?: boolean;
  content?: TextModuleType;
};

export default function CatalogRowOfImages({module, isSlottedContent}: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 769px)': {active: false},
    },
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [activeDotIndex, setActiveDotIndex] = useState(0);
  // the product that is active in the modal window
  const [activeProduct, setActiveProduct] = useState(null);
  // the primary product associated with the hotspot, it will also be the active product when the modal opens
  const [primaryProduct, setPrimaryProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState(null);
  const [relatedProductsHandles, setRelatedProductsHandles] = useState(null);
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [variationsMap, setVariationsMap] = useState(null); // sourced from Shopify

  const handleDotClick = (index: number) => {
    if (emblaApi) {
      setActiveDotIndex(index);
      setCurrentSlide(index);
      emblaApi.scrollTo(index, true);
    }
  };

  const fetchProductInfo = async (handle, activeOrRelated, index) => {
    if (activeOrRelated === 'activeProduct') {
      const response = await fetch(`/api/catalog/products/${handle}`);
      let data;
      try {
        const data = await response.json();
        setVariationsMap(data.product.colorSwatches);
        setIsModalOpen(true);
      } catch (error) {
        console.error(error);
      }
    } else if (activeOrRelated === 'relatedProducts') {
      let apiUrl;
      const isNumeric = /^\d+$/.test(handle);

      if (isNumeric) {
        // send the Ids for Grid Image - related products
        apiUrl = `/api/style/products/${handle}`;
      } else {
        // send the handle for image - related products
        apiUrl = `/api/catalog/products/${handle}`;
      }

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (isNumeric) {
        setRelatedProducts((prevRelatedProducts) => {
          const updatedRelatedProducts = [...(prevRelatedProducts || [])];
          updatedRelatedProducts[index] = data[0];
          return updatedRelatedProducts;
        });
      } else {
        setRelatedProducts((prevRelatedProducts) => {
          const updatedRelatedProducts = [...(prevRelatedProducts || [])];
          updatedRelatedProducts[index] = data.product;
          return updatedRelatedProducts;
        });
      }
    }
  };

  useEffect(() => {
    if (!emblaApi) return;

    const updateCurrentSlide = () => {
      setCurrentSlide(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('settle', updateCurrentSlide);
    return () => {
      if (!emblaApi) {
        return;
      }
      emblaApi.off('settle', updateCurrentSlide);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    const onScroll = () => {
      const thisSlide = emblaApi.selectedScrollSnap();
      setCurrentSlide(thisSlide);
    };

    const onSelect = () => {
      setActiveDotIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('scroll', onScroll);
    emblaApi.on('select', onSelect);

    if (activeDotIndex > 0) {
      emblaApi.scrollTo(activeDotIndex, true); // instantly scroll
      setCurrentSlide(activeDotIndex); // Set current slide index
    }

    return () => {
      if (!emblaApi) {
        return;
      }
      emblaApi.off('scroll', onScroll);
      emblaApi.off('select', onSelect);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emblaApi]);

  const firstLoad = useRef(true);
  useEffect(() => {
    if (activeProduct) {
      fetchProductInfo(activeProduct.handle, 'activeProduct');
    }
  }, [activeProduct]);

  useEffect(() => {
    const fetchData = async () => {
      if (relatedProductsHandles) {
        await Promise.all(
          relatedProductsHandles.map(async (el, index) => {
            const productInfo = await fetchProductInfo(
              el,
              'relatedProducts',
              index,
            );
          }),
        );
        firstLoad.current = false;
      } //else if
    };
    fetchData();
  }, [relatedProductsHandles]);

  useEffect(() => {}, [isModalOpen]);

  if (!module) {
    return null;
  }

  const colorTheme = module.colorTheme
    ? module.colorTheme
    : DEFAULT_COLOR_THEME;

  if (module.transparentBackground == true) {
    colorTheme.background = 'transparent';
  }
  return (
    <div className="catalog page-width w-full">
      <div
        className={clsx(
          `catalog-items-wrapper relative flex flex-row flex-wrap gap-10 lg:w-full`,
        )}
      >
        {module.textModule && (
          <div className={`catalogTextModule relative w-full pb-[10px]`}>
            <TextModule content={module.textModule} />
          </div>
        )}
        <div
          className={clsx(`catalog-item flex w-full flex-wrap`)}
          key={module._key}
        >
          <div
            className={`image-grid relative flex w-full flex-col flex-wrap overflow-hidden pb-[10px] lg:flex-row lg:px-0 lg:pb-0 `}
            ref={emblaRef}
          >
            <div
              className={`embla__container relative flex sm:min-h-[533px] ${
                module.images.length
              } lg:grid lg:w-full ${
                module.images.length > 1
                  ? module.images.length === 2
                    ? 'lg:grid-cols-2 lg:grid-rows-1 lg:gap-0.5'
                    : module.images.length > 2
                    ? 'lg:grid-cols-2 lg:grid-rows-2 lg:gap-0.5'
                    : 'lg:grid-cols-1 lg:grid-rows-1'
                  : ''
              }`}
            >
              {module.images?.map((gridItem) => {
                return (
                  <div
                    className={`image-grid-image relative flex h-full w-full flex-shrink-0 flex-grow-0 flex-col ${
                      isSlottedContent ? 'h-min' : 'lg:h-auto'
                    }`}
                    key={gridItem._key}
                  >
                    <ImageContent
                      module={gridItem}
                      isSlottedContent={isSlottedContent}
                    />

                    {/* Product hotspots */}
                    {gridItem.variant === 'productHotspots' && (
                      <>
                        {gridItem.hotspots?.map((hotspot) => {
                          if (hotspot.productWithVariant) {
                            if (hotspot.productWithVariant.product === null) {
                              return '';
                            } else {
                              //'gid://shopify/Product/' +
                              const id =
                                hotspot.productWithVariant.product?._ref.split(
                                  '-',
                                )[1];
                              const productGid =
                                'gid://shopify/Product/' +
                                hotspot.productWithVariant.product?._ref.split(
                                  '-',
                                )[1];

                              return (
                                <ImageGridHotspot
                                  key={hotspot._key}
                                  id={id}
                                  productGid={productGid}
                                  variantGid={hotspot?.product?.variantGid}
                                  x={hotspot.x}
                                  y={hotspot.y}
                                  relatedProducts={hotspot?.relatedProducts}
                                  setRelatedProducts={setRelatedProducts}
                                  setRelatedProductsHandles={
                                    setRelatedProductsHandles
                                  }
                                  isCatalogHotspot={true}
                                  isImageGridImage={true}
                                  setActiveHotspot={setActiveHotspot}
                                  hotspotKey={hotspot._key}
                                  setActiveProduct={setActiveProduct}
                                  setPrimaryProduct={setPrimaryProduct}
                                  setIsModalOpen={setIsModalOpen}
                                />
                              );
                            }
                          } else {
                            return '';
                          }
                        })}
                      </>
                    )}
                    {gridItem.image && gridItem.shopNowText && (
                      <ShopNowText
                        colorTheme={colorTheme}
                        gridItem={gridItem}
                        isSlottedContent={isSlottedContent}
                      />
                    )}
                    {gridItem.textModule && (
                      <div
                        className={`catalogTextModule relative z-[2] pb-[10px]`}
                      >
                        <TextModule content={gridItem.textModule} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Dots for slide navigation */}
            {module.images.length > 1 && (
              <div className="absolute bottom-[-10px] left-1/2 mb-4 flex -translate-x-1/2 transform justify-center gap-2 lg:hidden">
                {module.images.map((_, index) => (
                  <button
                    key={uuidv4()}
                    onClick={() => handleDotClick(index)}
                    className={clsx('test h-2 w-2 rounded-full', {
                      'bg-darkGray': index === activeDotIndex,
                      'bg-gray': index !== activeDotIndex,
                    })}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen === true && variationsMap && activeProduct && (
        <Modal
          isModalOpen={isModalOpen}
          closeModal={() => {
            setIsModalOpen(false);
          }}
        >
          <CardCatalog
            data={activeProduct}
            products={[activeProduct]}
            relatedProducts={relatedProducts}
            title={activeProduct.title}
            variationsMap={variationsMap}
            currentProductUrl={`/products/${activeProduct.handle}`}
            setActiveProduct={setActiveProduct}
            primaryProduct={primaryProduct}
          />
        </Modal>
      )}
    </div>
  );
}

interface ShopNowTextProps {
  colorTheme: SanityColorTheme;
  gridItem: CatalogImage;
  isSlottedContent: boolean;
}

const ShopNowText: React.FC<ShopNowTextProps> = ({
  colorTheme,
  gridItem,
  isSlottedContent,
}) => {
  const selectedColorTheme = gridItem?.colorTheme || colorTheme;
  const colorThemeObject = () => ({
    backgroundColor: gridItem.transparentBackground
      ? 'transparent'
      : selectedColorTheme
      ? selectedColorTheme.background
      : DEFAULT_COLOR_THEME.background,
    color: selectedColorTheme
      ? selectedColorTheme.text
      : DEFAULT_COLOR_THEME.text,
  });
  const uniqueId = uuidv4();

  return (
    <div
      className={`catalog-item-text-container p-5 pt-3 text-center ${
        isSlottedContent ? '!top-3/4 mb-[1.5rem]' : ''
      }`}
      style={colorThemeObject()}
    >
      {gridItem.shopNowText && (
        <>
          <style>
            {`
            .un-${uniqueId}::after {
              background-color: ${colorThemeObject().color};
              content: '';
            }`}
          </style>
          <span className={`un-${uniqueId} button-link-border-b font-gotham`}>
            {gridItem.shopNowText}
          </span>
        </>
      )}
    </div>
  );
};

const ImageContent = ({module, isSlottedContent}: Props) => {
  /* single images have module.image.image whereas gridItem images have module.image */
  const image = module.image.image ? module.image.image : module.image;
  const imageMobile = module.imageMobile;
  const altText = stegaClean(module.altText);
  const [root] = useMatches();
  const sanityDataset = root.data?.sanityDataset;
  const sanityProjectID = root.data?.sanityProjectID;
  const imageFit = stegaClean(module.imageFit) || 'cover';
  return (
    <div
      className={clsx(
        `image-content relative max-w-[1440px] overflow-hidden px-5 duration-500 ease-out md:px-0`,
      )}
    >
      <SanityImage
        crop={image?.crop}
        dataset={sanityDataset}
        hotspot={image?.hotspot}
        layout="responsive"
        projectId={sanityProjectID}
        sizes={['50vw, 100vw']}
        src={image?.asset?._ref}
        alttext={altText}
        className={`object-${imageFit} ${
          imageMobile ? 'hidden md:block' : 'block'
        } ${isSlottedContent ? 'object-top' : ''}`}
      />
      {imageMobile && (
        <SanityImage
          crop={imageMobile?.crop}
          dataset={sanityDataset}
          hotspot={imageMobile?.hotspot}
          layout="responsive"
          projectId={sanityProjectID}
          sizes={['50vw, 100vw']}
          src={imageMobile?.asset?._ref}
          alttext={altText}
          className={`object-${imageFit} block w-full md:hidden`}
        />
      )}
      {/* Adding ShopNowText below imageMobile
      {module.shopNowText && (
        <ShopNowText
          colorTheme={module.colorTheme}
          gridItem={module}
          isSlottedContent={isSlottedContent}
        />
      )} */}
    </div>
  );
};

import {useMatches} from '@remix-run/react';
import clsx from 'clsx';
import useEmblaCarousel from 'embla-carousel-react';
import {useEffect, useRef, useState} from 'react';
import {v4 as uuidv4} from 'uuid';

import Modal from '~/components/global/ModalCardCatalog';
import SanityImage from '~/components/media/SanityImage';
import CardCatalog from '~/components/product/CardCatalog';
import ProductHotspot from '~/components/product/Hotspot';
import {Catalog as CatalogType} from '~/lib/sanity/types';

type Props = {
  module: CatalogType;
};

export default function CatalogSlider({module}: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    slidesToScroll: 1,
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
  const [variationsMap, setVariationsMap] = useState(null); // fetched from Shopify

  const handleDotClick = (index: number) => {
    if (emblaApi) {
      emblaApi.scrollTo(index, true);
      setActiveDotIndex(index);
      setCurrentSlide(index);
    }
  };

  const fetchProductInfo = async (handle, activeOrRelated) => {
    if (activeOrRelated === 'activeProduct') {
      const response = await fetch(`/api/catalog/products/${handle}`);
      const data = await response.json();
      setVariationsMap(data.product.colorSwatches);
      setIsModalOpen(true);
    } else if (activeOrRelated === 'relatedProducts') {
      const response = await fetch(`/api/catalog/products/${handle}`);
      const data = await response.json();

      setRelatedProducts((prevRelatedProducts) => [
        ...(prevRelatedProducts || []),
        data.product,
      ]);
    }
  };

  useEffect(() => {
    if (!emblaApi) return;

    const updateCurrentSlide = () => {
      setCurrentSlide(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('settle', updateCurrentSlide);
    return () => {
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
      if (relatedProductsHandles && firstLoad.current === true) {
        await Promise.all(
          relatedProductsHandles.map(async (el) => {
            await fetchProductInfo(el, 'relatedProducts');
          }),
        );
        firstLoad.current = false;
      }
    };
    fetchData();
  }, [relatedProductsHandles]);

  useEffect(() => {}, [isModalOpen]);

  if (!module) {
    return null;
  }

  return (
    <div
      className="catalog__slider page-width relative w-full overflow-hidden"
      ref={emblaRef}
    >
      <div
        className={clsx(
          `embla__container relative flex sm:min-h-[533px] lg:w-full`,
        )}
      >
        {module.images.map((image: any) => (
          <div className={` embla__slide relative`} key={image._key}>
            <ImageContent module={image} />
            {/* Product hotspots */}
            {image.variant === 'productHotspots' && (
              <>
                {image.hotspots?.map((hotspot) => {
                  if (!hotspot?.product?.gid) {
                    return null;
                  }
                  return (
                    <ProductHotspot
                      key={hotspot._key}
                      productGid={hotspot?.product?.gid}
                      variantGid={hotspot?.product?.variantGid}
                      x={hotspot.x}
                      y={hotspot.y}
                      relatedProducts={hotspot?.relatedProducts}
                      setRelatedProducts={setRelatedProducts}
                      setRelatedProductsHandles={setRelatedProductsHandles}
                      isCatalogHotspot={true}
                      setActiveHotspot={setActiveHotspot}
                      hotspotKey={hotspot._key}
                      setActiveProduct={setActiveProduct}
                      setPrimaryProduct={setPrimaryProduct}
                      setIsModalOpen={setIsModalOpen}
                    />
                  );
                })}
              </>
            )}
          </div>
        ))}
      </div>
      {/* Dots for slide navigation */}
      {module.images.length > 1 && (
        <div className="absolute bottom-[20px] left-1/2 mb-4 flex -translate-x-1/2 transform justify-center gap-2 lg:bottom-[0px] lg:mt-5">
          {module.images.map((_, index) => (
            <button
              key={uuidv4()}
              onClick={() => handleDotClick(index)}
              className={clsx('h-2 w-2 rounded-full', {
                'bg-darkGray': index === activeDotIndex,
                'bg-gray': index !== activeDotIndex,
              })}
            />
          ))}
        </div>
      )}
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

const ImageContent = ({module}: Props) => {
  const image = module.image.image;
  const imageMobile = module.imageMobile?.image;
  const [root] = useMatches();
  const sanityDataset = root.data?.sanityDataset;
  const sanityProjectID = root.data?.sanityProjectID;

  return (
    <div
      className={clsx(
        'image-content page-width relative overflow-hidden rounded px-5 transition-[border-radius] duration-500 ease-out md:px-10',
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
        className={imageMobile ? 'hidden md:block' : 'block'}
        alttext={module.altText}
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
          className="block md:hidden"
          alttext={module.altText}
        />
      )}
    </div>
  );
};

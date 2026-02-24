import {MediaFile} from '@shopify/hydrogen';
import {
  MediaImage,
  ProductVariant,
} from '@shopify/hydrogen/storefront-api-types';
import clsx from 'clsx';
import useEmblaCarousel from 'embla-carousel-react';
import {useCallback, useContext, useEffect, useState} from 'react';
import {useInView} from 'react-intersection-observer';

import {Link} from '~/components/Link';
import {usePrevNextButtons} from '~/components/modules/EmblaCarouselArrowButtons';
import {GlobalContext} from '~/lib/utils';
import type {ProductWithNodes} from '~/types/shopify';
import {pushSelectItem} from '~/utils/eventTracking';
import {pushSelectItemNew} from '~/utils/gtmEvents'; //PEAK ACTIVITY ADDITIONS

import PrevNextButtons from './buttons/PrevNextButtons';
/**
 * A client component that defines a media gallery for hosting images, 3D models, and videos of products
 */

type Props = {
  index: number;
  storefrontProduct?: ProductWithNodes & {selectedVariant?: ProductVariant};
  selectedVariant?: ProductVariant;
  currentProductUrl?: string;
  loading: 'eager' | 'lazy';
  resultsOnClick: () => void;
  doubleSizeCard?: boolean;
};

export default function CioCardGallery({
  index,
  storefrontProduct,
  selectedVariant,
  currentProductUrl,
  loading,
  doubleSizeCard,
}: Props) {
  const typeNameMap = {
    MODEL_3D: 'Model3d',
    VIDEO: 'Video',
    IMAGE: 'MediaImage',
    EXTERNAL_VIDEO: 'ExternalVideo',
  };
  const media = storefrontProduct?.media?.nodes;
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: true,
    slidesToScroll: 1,
  });
  const {prevBtnDisabled, nextBtnDisabled} = usePrevNextButtons(emblaApi);
  const {eventTrackingData} = useContext(GlobalContext);
  // On visit, render only the first image for the first 8 tiles
  const [visibleSlides, setVisibleSlides] = useState<number[]>(() =>
    index <= 8 ? [0] : [],
  );
  const {ref: inViewRef, inView} = useInView({
    triggerOnce: true,
    threshold: 0,
    rootMargin: '422px 0px',
  });

  useEffect(() => {
    if (inView) {
      // When the tile is nearing the viewport, render the first image
      setVisibleSlides((prev) => [...new Set([...prev, 0])]);
    }
  }, [inView, index]);

  useEffect(() => {
    if (!selectedVariant) {
      return;
    }
    const variantImageUrl = selectedVariant?.image?.url?.split('?')[0];
    const galleryIndex =
      media?.findIndex((mediaItem) => {
        if (mediaItem.mediaContentType === 'IMAGE') {
          return (
            (mediaItem as MediaImage)?.image?.url.split('?')[0] ===
            variantImageUrl
          );
        }
        return false;
      }) ?? -1;

    if (emblaApi && galleryIndex >= 0) {
      emblaApi.scrollTo(galleryIndex, true); // instantly scroll
    }
  }, [emblaApi, media, selectedVariant]);

  useEffect(() => {
    if (!emblaApi) return;

    const handleSetVisibleSlides = () => {
      setVisibleSlides((prev) => [
        ...new Set([...prev, ...emblaApi.slidesInView()]),
      ]);
    };

    emblaApi.on('slidesInView', handleSetVisibleSlides);
    return () => {
      if (!emblaApi) {
        return;
      }

      emblaApi.off('slidesInView', handleSetVisibleSlides);
    };
  }, [emblaApi]);

  const onPrevButtonClick = useCallback(() => {
    // Add a condition to check if the current slide is the first slide
    if (emblaApi && emblaApi.scrollProgress() === 0) {
      // If it's the first slide, don't allow navigation
      return;
    }
    // If not the first slide, allow the user to navigate
    emblaApi && emblaApi.scrollPrev();
  }, [emblaApi]);

  const onNextButtonClick = useCallback(() => {
    // Add a condition to check if the current slide is the last slide
    if (emblaApi && emblaApi.scrollProgress() === 1) {
      // If it's the last slide, don't allow navigation
      return;
    }
    // If not the last slide, allow the user to navigate
    emblaApi && emblaApi.scrollNext();
  }, [emblaApi]);

  if (!media?.length) {
    return null;
  }
  return (
    <div
      ref={inViewRef}
      className={clsx(
        'group relative h-full w-full lg:w-full',
        'lg:inline-block',
      )}
      tabIndex={-1}
      data-item={storefrontProduct?.id?.split('/').pop()} // used by useTrackElementInteractions
    >
      {/* Slides */}
      <Link
        id={`cio-card-gallery-${storefrontProduct?.id?.split('/').pop()}`}
        className="block h-full w-full"
        to={currentProductUrl || '/'}
        prefetch="intent"
        onClick={(event) => {
          event.stopPropagation();
          if (!storefrontProduct || !selectedVariant) return;

          const product = storefrontProduct;
          product.selectedVariant = selectedVariant;

          pushSelectItem(
            product,
            eventTrackingData.customer,
            eventTrackingData.currency,
            index,
          );
          //PEAK ACTIVITY ADDITIONS STARTS
          pushSelectItemNew(
            product,
            eventTrackingData.customer,
            eventTrackingData.currency,
            index,
          );
          //PEAK ACTIVITY ADDITIONS ENDS
        }}
      >
        <div className="overflow-hidden lg:flex" ref={emblaRef}>
          <div
            className={clsx(
              `item embla__container relative flex sm:min-h-[332px] lg:w-full`,
            )}
          >
            {media.map((med, index) => {
              if (!med.mediaContentType) {
                return null;
              }

              let extraProps: Record<string, any> = {};

              if (med.mediaContentType === 'MODEL_3D') {
                extraProps = {
                  interactionPromptThreshold: '0',
                  ar: true,
                  loading: 'eager',
                  disableZoom: true,
                  style: {height: '100%', margin: '0 auto'},
                };
              }

              const data = {
                ...med,
                __typename:
                  typeNameMap[med.mediaContentType] || typeNameMap['IMAGE'],
                ...(med.mediaContentType === 'IMAGE' && (med as any).image
                  ? {
                      image: {
                        // @ts-ignore
                        ...(med as any).image,
                        altText: (med as any).image.altText || 'Product image',
                      },
                    }
                  : {}),
              } as MediaImage;

              return (
                <div
                  key={med.id}
                  className="group/image width-full relative w-full flex-shrink-0 flex-grow-0 select-none object-cover"
                >
                  <div className="relative">
                    <MediaFile
                      className={clsx(
                        'lg:embla__slide relative flex shrink-0 grow-0 select-none object-cover',
                        media.length > 1 ? 'w-full-40 md:w-1/4' : 'w-full',
                        !visibleSlides.includes(index) ? 'hidden' : '',
                      )}
                      data={data}
                      draggable={false}
                      key={med.id}
                      tabIndex={0}
                      mediaOptions={{
                        image: {
                          aspectRatio: '3/4',
                          crop: 'center',
                          sizes: '100%',
                          loading: index > 0 ? 'lazy' : loading,
                          width: (() => {
                            const baseWidth = screen.width > 1440 ? 472 : 332;
                            const scaleFactor = doubleSizeCard ? 2 : 1; // 2× image size for large cards
                            return baseWidth * scaleFactor;
                          })(),
                        },
                      }}
                      {...extraProps}
                      style={{
                        width: '100%',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Link>
      {/* Navigation & Arrows*/}
      {media.length > 1 && (
        <div
          className={clsx(
            'pointer-events-none absolute top-[40%] flex w-full items-center justify-between gap-[10px] md:top-[45%]',
            'opacity-100 lg:opacity-0 lg:transition-all lg:duration-300 lg:ease-in-out lg:group-hover:opacity-100',
          )}
        >
          <PrevNextButtons
            onPrevButtonClick={onPrevButtonClick}
            onNextButtonClick={onNextButtonClick}
            prevBtnDisabled={prevBtnDisabled}
            nextBtnDisabled={nextBtnDisabled}
          />
        </div>
      )}
    </div>
  );
}

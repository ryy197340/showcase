import {MediaFile} from '@shopify/hydrogen';
import {
  MediaImage,
  ProductVariant,
} from '@shopify/hydrogen/storefront-api-types';
import clsx from 'clsx';
import useEmblaCarousel from 'embla-carousel-react';
import {useEffect, useState} from 'react';
import {v4 as uuidv4} from 'uuid';

import Badge from '~/components/elements/Badge';
import Modal from '~/components/global/Modal';
import {usePrevNextButtons} from '~/components/modules/EmblaCarouselArrowButtons';
import type {ProductWithNodes} from '~/types/shopify';

import LocalizedA from '../global/LocalizedA';
import MediaItem from './MediaItem';
import NavigationArrows from './NavigationArrows';
import NavigationDot from './NavigationDot';
/**
 * A client component that defines a media gallery for hosting images, 3D models, and videos of products
 */

type Props = {
  storefrontProduct: ProductWithNodes;
  selectedVariant?: ProductVariant;
};

export default function ProductGallery({
  storefrontProduct,
  selectedVariant,
}: Props) {
  const media = storefrontProduct?.media?.nodes;
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    slidesToScroll: 1,
  });
  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);

  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [activeDotIndex, setActiveDotIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<MediaImage | null>(null);
  const openModal = (image: MediaImage) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleDotClick = (index: number) => {
    if (emblaApi) {
      emblaApi.scrollTo(index, true);
      setActiveDotIndex(index);
    }
  };

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
      setCurrentSlide(galleryIndex); // Set current slide index
    }
  }, [emblaApi, media, selectedVariant]);

  useEffect(() => {
    if (!emblaApi) return;

    const onScroll = () => {
      const thisSlide = emblaApi.selectedScrollSnap();
      setCurrentSlide(thisSlide);
    };

    const onSelect = () => {
      setActiveDotIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('scroll', onScroll);
    emblaApi.on('select', onSelect);

    return () => {
      if (!emblaApi) {
        return;
      }
      emblaApi.off('scroll', onScroll);
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  if (!media?.length) {
    return null;
  }
  return (
    <div
      className={clsx('relative md:w-full lg:w-1/2 lg:pb-8', 'lg:inline-block')}
      tabIndex={-1}
    >
      {/* Tags */}
      {storefrontProduct?.tags &&
        storefrontProduct.tags.map(function (el) {
          if (el === 'new') {
            return (
              <div className="uppercase lg:hidden" key={el}>
                <Badge mode="outline" label="New" small solid={true} />
              </div>
            );
          }
          return null;
        })}
      {/* Slides */}
      <div className="relative overflow-hidden lg:flex" ref={emblaRef}>
        <div
          className={clsx(
            `embla__container relative flex sm:min-h-[300px] lg:max-h-[680px] lg:w-full`,
          )}
        >
          {media.map((med, index) => (
            <MediaItem
              key={med.id}
              med={med}
              index={index}
              openModal={openModal}
              mediaLength={media.length}
            />
          ))}
        </div>
        {/* Navigation Arrows */}
        {media.length > 1 && (
          <NavigationArrows
            prevBtnDisabled={prevBtnDisabled}
            nextBtnDisabled={nextBtnDisabled}
            onPrevButtonClick={onPrevButtonClick}
            onNextButtonClick={onNextButtonClick}
          />
        )}
      </div>

      {/* Dots for slide navigation */}
      {media.length > 1 && (
        <div className="my-4 flex justify-center gap-2 lg:hidden">
          {media.map((_, index) => (
            <NavigationDot
              key={uuidv4()}
              activeDotIndex={activeDotIndex}
              handleDotClick={handleDotClick}
              index={index}
            />
          ))}
        </div>
      )}
      {storefrontProduct.isQuickView && (
        <LocalizedA
          href={`/products/${storefrontProduct.handle}`}
          rel="noreferrer"
        >
          <span className="mt-4 hidden w-full p-4 text-center text-xs capitalize text-primary underline md:block">
            See Details
          </span>
        </LocalizedA>
      )}
    </div>
  );
}

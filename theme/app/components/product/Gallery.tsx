import {useParams} from '@remix-run/react';
import {stegaClean} from '@sanity/client/stega';
import {MediaFile} from '@shopify/hydrogen';
import {
  MediaImage,
  ProductVariant,
} from '@shopify/hydrogen/storefront-api-types';
import clsx from 'clsx';
import useEmblaCarousel from 'embla-carousel-react';
import {useEffect, useRef, useState} from 'react';

import Badge from '~/components/elements/Badge';
import Modal from '~/components/global/Modal';
import MagnifyingGlass from '~/components/icons/Magnify';
import {useHydration} from '~/hooks/useHydration';
import type {ProductWithNodes} from '~/types/shopify';
import {stripGlobalId} from '~/utils';

import {ChevronDownIcon} from '../icons/ChevronDown';
import {NextButton, PrevButton} from '../modules/EmblaCarouselArrowButtons';
import BvGallery from './BazaarVoiceGallery';
/**
 * A client component that defines a media gallery for hosting images, 3D models, and videos of products
 */

type Props = {
  storefrontProduct: ProductWithNodes;
  selectedVariant?: ProductVariant;
  strippedId?: string;
  bazaarVoiceUGC?: boolean;
  bazaarVoiceUGCPlacement?: string;
};
const typeNameMap = {
  MODEL_3D: 'Model3d',
  VIDEO: 'Video',
  IMAGE: 'MediaImage',
  EXTERNAL_VIDEO: 'ExternalVideo',
};

function normalizeMedia(med: any): MediaImage | null {
  if (!med?.mediaContentType) return null;

  // IMAGE
  if (med.mediaContentType === 'IMAGE' && med.image) {
    return {
      ...med,
      image: {
        ...med.image,
        altText: med.image.altText || 'Product image',
      },
      __typename: 'MediaImage',
    };
  }

  // VIDEO
  if (med.mediaContentType === 'VIDEO') {
    return {
      ...med,
      __typename: 'Video',
    };
  }

  return null;
}

export default function ProductGallery({
  storefrontProduct,
  selectedVariant,
  bazaarVoiceUGC,
  strippedId,
  bazaarVoiceUGCPlacement,
}: Props) {
  const isHydrated = useHydration();
  const media = storefrontProduct?.media?.nodes;
  //disable loop on large displays
  const getEmblaOptions = () => {
    if (isHydrated && window.matchMedia('(min-width: 1024px)').matches) {
      return {align: 'start', loop: false, slidesToScroll: 1};
    }
    return {align: 'start', loop: true, slidesToScroll: 1};
  };
  const [emblaRef, emblaApi] = useEmblaCarousel(getEmblaOptions());

  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [showShopTheLook, setShowShopTheLook] = useState(false);
  const [activeDotIndex, setActiveDotIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<MediaImage | null>(null);
  const {handle} = useParams();
  const openModal = (image: MediaImage) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const isDesktop =
    isHydrated && window.matchMedia('(min-width: 1024px)').matches;
  const thumbsScrollRef = useRef<HTMLDivElement | null>(null);
  const [showScrollArrow, setShowScrollArrow] = useState(false);

  useEffect(() => {
    if (!isDesktop || !thumbsScrollRef.current) return;

    const el = thumbsScrollRef.current;

    const checkOverflow = () => {
      const canScroll =
        el.scrollHeight > el.clientHeight &&
        el.scrollTop + el.clientHeight < el.scrollHeight - 4;

      setShowScrollArrow(canScroll);
    };

    checkOverflow();
    el.addEventListener('scroll', checkOverflow);
    window.addEventListener('resize', checkOverflow);

    return () => {
      el.removeEventListener('scroll', checkOverflow);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [isDesktop, media]);

  const handleDotClick = (index: number) => {
    if (emblaApi) {
      emblaApi.scrollTo(index, true);
      setActiveDotIndex(index);
    }
  };

  useEffect(() => {
    const container = document.querySelector(
      '[data-crl8-container-id="product"]',
    );

    // Clean old UGC HTML before render
    if (container) {
      container.innerHTML = '';
    }
  }, [storefrontProduct?.id]);

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

  useEffect(() => {
    if (!handle) return;

    let observer: MutationObserver | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const checkAndSet = () => {
      const ctlCards = document.getElementById('ctl-cards');
      const ctlRow = document.getElementsByClassName(
        'complete-the-look-row',
      )[0];
      const hasShopTheLook = !!(ctlCards || ctlRow);
      setShowShopTheLook(hasShopTheLook);
    };

    // Run once immediately when handle or variant changes
    checkAndSet();

    // Keep observing for both additions and removals of target nodes
    observer = new MutationObserver(() => {
      // Debounce to avoid rapid-fire calls from multiple mutations
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(checkAndSet, 100);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Clean up on handle change or unmount
    return () => {
      if (observer) observer.disconnect();
      if (timeout) clearTimeout(timeout);
    };
  }, [handle, selectedVariant]);

  useEffect(() => {
    if (!media?.length) {
      setSelectedImage(null);
      return;
    }

    setSelectedImage(normalizeMedia(media[0]));
  }, [storefrontProduct.id, media]);

  useEffect(() => {
    if (!thumbsScrollRef.current) return;

    // Reset scroll position on product change
    thumbsScrollRef.current.scrollTop = 0;

    // Also reset arrow state so it recalculates correctly
    setShowScrollArrow(false);
  }, [storefrontProduct.id]);

  if (!media?.length) {
    return null;
  }
  return (
    <div
      className={clsx(
        'relative pb-10 md:w-full lg:w-3/5 lg:pb-8',
        'lg:inline-block',
        'transition-opacity duration-200',
        isHydrated ? 'opacity-100' : 'opacity-0',
      )}
      tabIndex={-1}
    >
      <div className="flex flex-row gap-4 lg:max-h-[54rem]">
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
        <div className="flex lg:flex-col">
          <div
            ref={(node) => {
              emblaRef(node);
              thumbsScrollRef.current = node;
            }}
            className="scrollbar-hide relative h-full overflow-hidden lg:max-h-[54rem] lg:overflow-y-scroll"
          >
            <div
              className={clsx(
                'embla__container flex items-start lg:flex-col lg:items-center',
                'lg:justify-start lg:gap-2',
              )}
              style={{width: '100%'}}
            >
              {media.map((med, index) => {
                const isSelected = med.id === selectedImage?.id;
                const data = normalizeMedia(med);
                if (!data) return null;

                return (
                  <div
                    key={med.id}
                    className={clsx(
                      'relative w-full flex-shrink-0 overflow-hidden',
                      // lock size from frame 0
                      'lg:w-[150px]',
                    )}
                  >
                    <MediaFile
                      data={data}
                      draggable={false}
                      tabIndex={0}
                      className={clsx(
                        isDesktop
                          ? 'h-full w-auto object-contain'
                          : 'h-full w-full object-cover',
                        'border-2 border-transparent transition',
                        isSelected && 'lg:border-[#13294e]',
                        med.mediaContentType === 'VIDEO' &&
                          'aspect-[1920/2560] lg:aspect-auto',
                      )}
                      mediaOptions={{
                        image: {
                          crop: 'center',
                          loading: index > 0 ? 'lazy' : 'eager',
                          sizes: '(min-width: 1024px) 150px, 100vw',
                          width: 260,
                        },
                        video: {autoPlay: true, loop: true, muted: true},
                      }}
                      onClick={() => setSelectedImage(data)}
                    />
                    {index === 0 && showShopTheLook && (
                      <div className="absolute left-[10px] top-0 mb-[8px] mt-5 block flex justify-center gap-[5px] rounded-md border border-black bg-white bg-opacity-50 p-2 text-xs font-regular text-black lg:hidden">
                        <button
                          onClick={() => {
                            const ctlCards =
                              document.getElementById('ctl-cards');
                            const ctlRow = document.getElementsByClassName(
                              'complete-the-look-row',
                            )[0];
                            const target = ctlCards ?? ctlRow;
                            if (target) {
                              const y =
                                target.getBoundingClientRect().top +
                                window.scrollY -
                                155;
                              window.scrollTo({top: y, behavior: 'smooth'});
                            }
                          }}
                          style={{cursor: 'pointer'}}
                        >
                          Shop The Look
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* BazaarVoice UGC slot */}
              {bazaarVoiceUGC &&
                stegaClean(bazaarVoiceUGCPlacement) !== 'full-width' && (
                  <div
                    className="relative"
                    style={
                      isDesktop
                        ? {height: '200px', flex: '1 1 auto', width: '200px'}
                        : undefined
                    }
                  >
                    <BvGallery
                      productId={stripGlobalId(storefrontProduct.id)}
                    />
                  </div>
                )}
            </div>
          </div>
          {isDesktop && showScrollArrow && (
            <button
              aria-label="Scroll thumbnails"
              className={clsx(
                'relative mx-auto',
                'z-10 rounded-full p-2 text-white',
                'transition ',
              )}
              onClick={() => {
                thumbsScrollRef.current?.scrollBy({
                  top: 220,
                  behavior: 'smooth',
                });
              }}
            >
              <ChevronDownIcon />
            </button>
          )}
        </div>
        {/* === MAIN IMAGE === */}
        {selectedImage && (
          <div className="group relative hidden h-auto items-center justify-center overflow-hidden pb-2 lg:mx-auto lg:flex lg:w-full">
            {/* Left Arrow */}
            {media.length > 1 && (
              <PrevButton
                className="modal-arrow absolute left-4 z-10 rounded-full bg-black/50 p-2 text-white
           opacity-0 transition-opacity duration-300 ease-in-out
           group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent modal from closing
                  const currentIndex = media.findIndex(
                    (item) => item.id === selectedImage?.id,
                  );
                  const prevIndex =
                    (currentIndex - 1 + media.length) % media.length;
                  const prevMedia = media[prevIndex];

                  setSelectedImage({
                    ...prevMedia,
                    __typename:
                      typeNameMap[prevMedia.mediaContentType] || 'MediaImage',
                  } as MediaImage);
                }}
              />
            )}
            <MediaFile
              data={{
                ...selectedImage,
                __typename:
                  typeNameMap[selectedImage?.mediaContentType] || 'MediaImage',
              }}
              className={clsx(
                'h-full w-full',
                selectedImage.mediaContentType === 'VIDEO'
                  ? 'object-contain'
                  : 'object-cover',
              )}
              mediaOptions={{
                image: {
                  crop: 'center',
                  sizes: `
      (min-width: 1280px) 660px,
      (min-width: 1024px) 600px,
      100vw
    `,
                  width: 900,
                  loading: 'eager',
                },
                video: {autoPlay: true, loop: true, muted: true},
              }}
              onClick={() => openModal(selectedImage)}
            />
            {/* Right Arrow */}
            {media.length > 1 && (
              <NextButton
                className="modal-arrow absolute right-4 z-10 rounded-full bg-black bg-opacity-50 p-2 text-white opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent modal from closing
                  const currentIndex = media.findIndex(
                    (item) => item.id === selectedImage?.id,
                  );
                  const nextIndex = (currentIndex + 1) % media.length;
                  const nextMedia = media[nextIndex];

                  setSelectedImage({
                    ...nextMedia,
                    __typename:
                      typeNameMap[nextMedia.mediaContentType] || 'MediaImage',
                  } as MediaImage);
                }}
              />
            )}
          </div>
        )}

        {/* Navigation */}
        {/* Dots for slide navigation */}
        {media.length > 1 && (
          <div className="absolute bottom-0 left-1/2 mb-4 flex -translate-x-1/2 transform justify-center gap-2 lg:hidden">
            {[
              ...media,
              ...(strippedId &&
              bazaarVoiceUGC &&
              bazaarVoiceUGCPlacement === 'gallery'
                ? [{}]
                : []),
            ].map((m, index) => (
              <button
                key={m?.id ?? index}
                onClick={() => handleDotClick(index)}
                className={clsx('h-2 w-2 rounded-full', {
                  'bg-darkGray': index === activeDotIndex,
                  'bg-gray': index !== activeDotIndex,
                })}
              />
            ))}
          </div>
        )}
        {/* Modal */}
        {isModalOpen && (
          <Modal isModalOpen={isModalOpen} closeModal={closeModal}>
            <div className="relative z-[200] flex h-full w-auto items-center justify-center">
              {/* Left Arrow */}
              {media.length > 1 && (
                <PrevButton
                  className="modal-arrow absolute left-4 z-50 rounded-full bg-black bg-opacity-50 p-2 text-white"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent modal from closing
                    const currentIndex = media.findIndex(
                      (item) => item.id === selectedImage?.id,
                    );
                    const prevIndex =
                      (currentIndex - 1 + media.length) % media.length;
                    const prevMedia = media[prevIndex];

                    setSelectedImage({
                      ...prevMedia,
                      __typename:
                        typeNameMap[prevMedia.mediaContentType] || 'MediaImage',
                    } as MediaImage);
                  }}
                />
              )}

              {/* Image */}
              <MediaFile
                className="relative flex h-full shrink-0 grow-0 select-none object-contain object-top"
                data={selectedImage}
                draggable={false}
                tabIndex={0}
                mediaOptions={{
                  image: {
                    crop: 'center',
                    sizes: '100vh',
                    width: 1400,
                    loading: 'eager',
                  },
                }}
                style={{maxHeight: 'calc(100vh - 80px)', width: 'auto'}}
              />

              {/* Right Arrow */}
              {media.length > 1 && (
                <NextButton
                  className="modal-arrow absolute right-4 z-50 rounded-full bg-black bg-opacity-50 p-2 text-white"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent modal from closing
                    const currentIndex = media.findIndex(
                      (item) => item.id === selectedImage?.id,
                    );
                    const nextIndex = (currentIndex + 1) % media.length;
                    const nextMedia = media[nextIndex];

                    setSelectedImage({
                      ...nextMedia,
                      __typename:
                        typeNameMap[nextMedia.mediaContentType] || 'MediaImage',
                    } as MediaImage);
                  }}
                />
              )}
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}

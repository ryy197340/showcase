import {useMatches} from '@remix-run/react';
import useEmblaCarousel from 'embla-carousel-react';
import {useCallback, useEffect, useState} from 'react';

import DropdownLinkedImage from './DropdownLinkedImage';

type ImageItem = {
  _key: string;
  image: any;
  altText?: string;
  link?: {slug?: string};
  title?: string;
  _type: string;
  hideTitle?: boolean;
  textOverlay?: string;
  font?: string;
  textAlign?: string;
  disableHoverZoom?: boolean;
};

type Props = {
  title?: string;
  rowContent: ImageItem[];
  isDrawerOpen: boolean;
  handleClose: () => void;
};

export default function DropdownMobileImageGrid({
  title,
  rowContent,
  isDrawerOpen,
  handleClose,
}: Props) {
  const [root] = useMatches();
  const sanityDataset = root.data?.sanityDataset;
  const sanityProjectID = root.data?.sanityProjectID;

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    slidesToScroll: 1,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      if (!emblaApi) {
        return;
      }
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="flex flex-col">
      {title && (
        <div className="linkTextNavigation topLevelNavText w-full py-4 pl-2 pr-3 underline">
          {title}
        </div>
      )}

      {/* Embla viewport */}
      <div className="overflow-hidden" ref={emblaRef}>
        {/* Embla container */}
        <div className="flex">
          {rowContent.map((singleImage) => (
            <div
              key={singleImage._key}
              className="relative flex-[0_0_45%] px-1 text-[12px]"
              onClick={handleClose}
              onKeyDown={(e) => e.key === 'Enter' && handleClose()}
              role="button"
              tabIndex={0}
            >
              <DropdownLinkedImage
                {...{
                  isDropdownOpen: isDrawerOpen,
                  image: singleImage.image,
                  altText: singleImage.altText ?? '',
                  slug: singleImage.link?.slug ? singleImage.link.slug : '',
                  title: singleImage.title ? singleImage.title : '',
                  type: singleImage._type,
                  imageLoading: 'lazy',
                  sanityDataset,
                  sanityProjectID,
                  hideTitle: singleImage.hideTitle,
                  textOverlay: !!singleImage?.textOverlay,
                  font: singleImage?.font,
                  textAlign: singleImage?.textAlign,
                  disableHoverZoom: singleImage?.disableHoverZoom,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

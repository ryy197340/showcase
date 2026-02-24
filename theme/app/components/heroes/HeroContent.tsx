import {useMemo} from 'react';

import ImageWithProductHotspots from '~/components/media/ImageWithProductHotspots';
import ProductHero from '~/components/product/ProductHero';
import type {
  BackToLink as BackToLinkType,
  Carousel,
  ImageWithText as ImageWithTextType,
  PodSlider as PodSliderType,
  SanityImageWithProductHotspots,
  SanityModuleImage,
  SanityProductWithVariant,
  SingleTestimonial as SingleTestimonialType,
  TableData as TableDataType,
  TextModule as TextModuleType,
} from '~/lib/sanity';

import BackToLink from '../modules/BackToLink';
import HeroCarousel from '../modules/Carousel/HeroCarousel';
import ImageModule from '../modules/Image';
import ImageWithText from '../modules/ImageWithText';
import PodSlider from '../modules/PodSlider';
import Table from '../modules/Table';
import TextModule from '../modules/TextModule';

type Props = {
  fullWidth?: boolean;
  content?:
    | PodSliderType
    | SanityImageWithProductHotspots
    | SanityProductWithVariant
    | Carousel
    | ImageWithTextType
    | SingleTestimonialType
    | TableDataType
    | TextModuleType
    | BackToLinkType
    | SanityModuleImage;
};

export default function HeroContent({content, fullWidth}: Props) {
  const width = `${fullWidth ? '' : 'page-width'} h-full w-full`;
  const heroContent = useMemo(() => {
    switch (content?._type) {
      case 'module.podSlider': {
        return (
          <div className={`relative ${width}`}>
            <PodSlider module={content} />
          </div>
        );
      }

      case 'heroCarousel': {
        return (
          <div className={`relative ${width}`}>
            <HeroCarousel content={content} />
          </div>
        );
      }

      case 'imageWithProductHotspots': {
        return (
          <div className={`relative ${width}`}>
            <ImageWithProductHotspots content={content} />
          </div>
        );
      }

      case 'moduleImage': {
        return (
          <div className={`relative ${width}`}>
            <ImageModule module={content} isHeroImage={true} />
          </div>
        );
      }

      case 'module.imageWithText': {
        return (
          <div className={`relative ${width}`}>
            <ImageWithText content={content} hero={true} />
          </div>
        );
      }

      case 'module.tableData': {
        return (
          <div className={`relative ${width}`}>
            <Table content={content} />
          </div>
        );
      }

      case 'module.textModule': {
        return (
          <div className={`relative ${width}`}>
            <TextModule content={content} hero={true} key={content._key} />
          </div>
        );
      }

      case 'module.backToLink': {
        return (
          <div className={`relative ${width} backToLink`}>
            <BackToLink content={content} hero={true} />
          </div>
        );
      }

      case 'productWithVariant': {
        if (!content?.gid || !content.variantGid) {
          return null;
        }

        return (
          <div className={`aspect-[1300/768] ${width}`}>
            <ProductHero gid={content?.gid} variantGid={content.variantGid} />
          </div>
        );
      }
    }
  }, [content]);

  return (
    <div
      className={`relative flex ${width} place-content-center overflow-hidden ${
        content?._type === 'module.podSlider' ? '' : 'pb-2'
      }`}
    >
      {heroContent}
    </div>
  );
}

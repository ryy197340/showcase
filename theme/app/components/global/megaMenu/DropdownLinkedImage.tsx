import {Link} from '~/components/Link';
import {SanityAssetImage} from '~/lib/sanity';

import DropdownSanityImage from './DropdownSanityImage';

type DropdownLinkedImageParams = {
  isDropdownOpen?: boolean;
  image: SanityAssetImage;
  altText: string;
  slug: string;
  title: string;
  type: string;
  imageLoading: string;
  sanityDataset: string;
  sanityProjectID: string;
  hideTitle?: boolean;
  textOverlay?: boolean;
  font?: string;
  textAlign?: string;
  disableHoverZoom?: boolean;
  imageAspectRatio?: string;
  largeText?: string;
  hideUnderline?: boolean;
};

const DropdownLinkedImage = ({
  isDropdownOpen,
  image,
  altText,
  slug,
  title,
  type,
  imageLoading,
  sanityDataset,
  sanityProjectID,
  hideTitle,
  textOverlay,
  font,
  textAlign,
  disableHoverZoom,
  imageAspectRatio,
  largeText,
  hideUnderline,
}: DropdownLinkedImageParams) => {
  const imageElement = (
    <DropdownSanityImage
      {...{
        isDropdownOpen,
        image,
        altText,
        imageLoading,
        sanityDataset,
        sanityProjectID,
        title,
        hideTitle,
        textOverlay,
        type,
        font,
        textAlign,
        disableHoverZoom,
        imageAspectRatio,
        largeText,
        hideUnderline,
      }}
    />
  );
  const shouldWrapWithLink =
    (type === '2xfeaturedImage' ||
      type === 'featuredImage' ||
      type === 'featuredImageType' ||
      type == 'actionGrid') &&
    slug;

  return shouldWrapWithLink ? (
    <Link
      prefetch="none"
      to={slug}
      className="flex flex-col gap-[2px] md:h-full"
    >
      {imageElement}
    </Link>
  ) : (
    <>{imageElement}</>
  );
};

export default DropdownLinkedImage;

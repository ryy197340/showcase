import type {
  Image,
  PortableTextBlock,
  PortableTextObject,
  PortableTextSpan,
} from '@sanity/types';

import type {SanityColorTheme} from '~/lib/theme';
import type {ProductWithNodes} from '~/types/shopify';

import {ExtendedProduct} from '../shopify/types';

export interface SanityAssetImage extends Image {
  _type: 'image';
  _key: string;
  altText?: string;
  asset?: Reference;
  blurDataURL: string;
  height: number;
  url: string;
  width: number;
}

export type SanityCollection = {
  _id: string;
  colorTheme: SanityColorTheme;
  gid: string;
  hero?: SanityHeroPage;
  slug?: string;
  title: string;
  vector?: string;
};

export type SanityCollectionPage = {
  _id: string;
  colorTheme: SanityColorTheme;
  hero?: SanityHeroCollection;
  altGridObject?: {
    altGrid?: boolean;
    altGridProducts?: ExtendedProduct[];
    every2rows?: boolean;
    alternatingHeroLayout?: {
      enabled?: boolean;
      content?: CatalogImageNew[];
    };
  };
  altGridIndexes?: number[];
  seo: SanitySeo;
  slug?: string;
  sortOrder: string;
  title: string;
  hideFilterBreadcrumbs: boolean | null;
  customPageTitle?: string;
  slottedContent?: (SlottedContentItem | CatalogRowOfImages | VideowiseHTML)[];
};

export type SanityCollectionPageModules = {
  modules: (SanityModule | SanityModuleImage | SanityModuleInstagram)[];
  lowerModules: (SanityModule | SanityModuleImage | SanityModuleInstagram)[];
};

export type Slug = {
  _type: 'slug';
  current: string;
};

export type SanityBlogCategoryPage = {
  _id: string;
  _type: string;
  category: string;
  title: string;
  slug: Slug;
};

export type SanityBlogPostPage = {
  _id: string;
  _type: string;
  title: string;
  category: string;
  _createdAt: string;
  seo: SanitySeo;
  slug: Slug;
};

export type SanityCollectionGroup = {
  _key: string;
  _type: 'collectionGroup';
  collectionLinks?: SanityCollection[];
  collectionProducts?: SanityCollection;
  title: string;
};

export type SanityCustomProductOption =
  | SanityCustomProductOptionColor
  | SanityCustomProductOptionSize;

interface SanityCustomProductOptionBase {
  _key: string;
  title: string;
}
export interface SanityCustomProductOptionColor
  extends SanityCustomProductOptionBase {
  _type: 'customProductOption.color';
  colors: {
    hex: string;
    title: string;
  }[];
}

export interface SanityCustomProductOptionSize
  extends SanityCustomProductOptionBase {
  _type: 'customProductOption.size';
  sizes: {
    height: number;
    title: string;
    width: number;
  }[];
}

export type SanityHero = SanityHeroCollection | SanityHeroHome | SanityHeroPage;

export type SanityHeroCollection = {
  content?:
    | SanityImageWithProductHotspots
    | SanityProductWithVariant
    | PodSlider;
  description?: string;
  title?: string;
  data?: ProductWithNodes[] | ProductWithNodes;
  image?: SanityAssetImage;
  imageMobile?: SanityAssetImage;
  altText?: string;
};

export type SanityHeroHome = {
  content?:
    | SanityImageWithProductHotspots
    | SanityProductWithVariant
    | SanityModuleImage
    | Carousel;
  link?: SanityLink;
  title?: string;
  data?: ProductWithNodes[] | ProductWithNodes;
};

export type SanityHeroPage = {
  content?: SanityImageWithProductHotspots | SanityProductWithVariant;
  title?: string;
  data?: ProductWithNodes[] | ProductWithNodes;
};

export type SanityHomePage = {
  fullWidth?: boolean;
  hero?: SanityHeroHome;
  modules: (SanityModuleImage | SanityModuleInstagram)[];
  seo: SanitySeo;
};

export type SanityImageWithProductHotspots = {
  _key?: string;
  _type: 'imageWithProductHotspots';
  image: SanityAssetImage;
  productHotspots: SanityProductHotspot[];
};

export type SanityLink = SanityLinkExternal | SanityLinkInternal;

export type SanityLinkExternal = {
  _key: string;
  _type: 'linkExternal';
  newWindow?: boolean;
  url: string;
  title: string;
  hideMobileLink?: boolean;
};

export type SanityLinkInternal = {
  _key: string;
  _type: 'linkInternal';
  documentType: string;
  slug?: string;
  title: string;
  hideMobileLink?: boolean;
  buttonStyle?: SanityColorTheme;
  hideUnderline?: boolean;
};

export type SanityMenuLink =
  | SanityCollectionGroup
  | SanityLinkExternal
  | SanityLinkInternal
  | LinkAndText;

export type SanityModule =
  | SanityModuleAccordion
  | SanityModuleCallout
  | SanityModuleCalloutButton
  | SanityModuleCallToAction
  | Catalog
  | Carousel
  | SanityModuleCollection
  | SanityModuleGrid
  | SanityModuleImage
  | SanityModuleInstagram
  | SanityModuleProduct
  | ModuleQuoteBanner
  | ModuleShopByCollection
  | FeaturedBlogPosts
  | FeaturedCollection
  | FeaturedFabric
  | ImageWithText
  | TableData
  | ThreeImagesModule
  | FourImagesModule
  | TextModule
  | ColumnsOfTextModule
  | FeaturedProducts
  | OneTrustGDPRDoNotSell
  | PromoProducts
  | SingleTestimonial
  | JotFormModule
  | ListColumns
  | LetsGetStyled
  | BackToLink
  | ColumnsOfStylistsModule
  | GuideProduct
  | RichText
  | FeaturedProductsGrid
  | FeaturedProductsGridHomepage
  | ImageGrid
  | PureHTMLModule
  | PodSlider
  | VideowiseHTML
  | CompleteTheLook;

export type SanityModuleAccordion = {
  _key?: string;
  _type: 'module.accordion';
  groups: {
    _key: string;
    _type: 'group';
    body: PortableTextBlock[];
    title: string;
  }[];
};

export type SanityModuleCallout = {
  _key?: string;
  _type: 'module.callout';
  link: SanityLink;
  text: string;
};

export type SanityModuleCallToAction = {
  _key?: string;
  _type: 'module.callToAction';
  body?: string;
  content?: SanityAssetImage | SanityProductWithVariant;
  layout: 'left' | 'right';
  link: SanityLink;
  title: string;
};

export type CallToActionImage = {
  _key?: string;
  _type: 'callToActionImage';
  callToActionImage: {
    desktopImage: SanityAssetImage;
    desktopAltText: string;
    mobileImage: SanityAssetImage;
    mobileAltText: string;
  };
};

export type SanityModuleCollection = {
  _key?: string;
  _type: 'module.collection';
  collection: SanityCollection;
  showBackground?: boolean;
};

export type SanityModuleImage =
  | SanityModuleImageCallToAction
  | SanityModuleImageCaption
  | SanityModuleImageProductHotspots
  | FeaturedBlogPosts
  | SanityModuleImageProductTags;

export type isBlogModule = boolean;
export type SanityModuleGrid = {
  _key?: string;
  _type: 'module.grid';
  items: {
    _key: string;
    _type: 'items';
    body: PortableTextBlock[];
    image: SanityAssetImage;
    title: string;
  }[];
};

export interface SimpleImage extends SanityModuleImageBase {
  variant: null;
}

export type SanityModuleImageBase = {
  _key?: string;
  _type: 'module.image';
  image: SanityAssetImage;
  imageMobile: SanityAssetImage;
  altText: string;
  imageTitle?: string;
  cssClass?: string;
};

export interface SanityModuleImageCallToAction extends SanityModuleImageBase {
  _key?: string;
  callToAction?: {
    link: SanityLink;
    title?: string;
    removeOverlayTint?: boolean;
  };
  variant: 'callToAction';
}

export interface SanityModuleImageCaption extends SanityModuleImageBase {
  _key?: string;
  caption?: string;
  variant: 'caption';
}
export interface SanityModuleImageProductHotspots
  extends SanityModuleImageBase {
  _key?: string;
  productHotspots?: SanityProductHotspot[];
  variant: 'productHotspots';
}

export interface SanityModuleImageProductTags extends SanityModuleImageBase {
  _key?: string;
  productTags?: SanityProductWithVariant[];
  variant: 'productTags';
}

export type SanityModuleImages = {
  _key?: string;
  _type: 'module.images';
  fullWidth?: boolean;
  modules: SanityModuleImage[];
  verticalAlign?: 'bottom' | 'center' | 'top';
};

export type SanityModuleInstagram = {
  _key?: string;
  _type: 'module.instagram';
  url: string;
};

export type SanityModuleProduct = {
  _key?: string;
  _type: 'module.product';
  productWithVariant: SanityProductWithVariant;
};

export type SanityModuleProducts = {
  _key?: string;
  _type: 'module.products';
  layout?: 'card' | 'pill';
  modules: SanityModuleProduct[];
};

export type SanityNotFoundPage = {
  body?: string;
  collectionGid?: string;
  colorTheme?: SanityColorTheme;
  title: string;
};

export type SanityPage = {
  body: PortableTextBlock[];
  colorTheme?: SanityColorTheme;
  hero?: SanityHeroPage;
  seo: SanitySeo;
  title: string;
  modules?: SanityModule | CustomModule;
  showBreadcrumbs?: boolean;
};

export type SanityProductHotspot = {
  _key?: string;
  product: SanityProductWithVariant;
  x: number;
  y: number;
};

export type SanityProductWithVariant = {
  _id: string;
  _key?: string;
  _type: 'productWithVariant';
  available: boolean;
  gid: string;
  slug?: string;
  variantGid: string;
  relatedProducts?: SanityProductWithVariant[];
};

export type SanityProductPage = {
  _id: string;
  available: boolean;
  body: PortableTextBlock[];
  colorTheme?: SanityColorTheme;
  customProductOptions?: SanityCustomProductOption[];
  gid: string;
  slug?: string;
  seo: SanitySeo;
  pdpMessageFromJMCL?: PDPAMessageFromJMcL;
  pdpRequestACatalog?: PDPRequestACatalog;
  pdpFinalSale?: PDPFinalSale;
  bazaarVoiceUGC?: boolean;
  bazaarVoiceUGCPlacement?: string;
};

export type SanitySeo = {
  description?: string;
  image?: SanityAssetImage;
  title: string;
};

// Custom Types
export type Catalog = {
  _key?: string;
  _type: 'module.catalog';
  images: Image[];
  title: string;
  style: string;
  imageText: string;
};

export type CatalogRowOfImages = {
  imageFit?: string;
  _key?: string;
  _type: 'module.catalogRowOfImages';
  index?: number;
  page?: number;
  hideMobile?: boolean;
  hideTablet?: boolean;
  hideDesktop?: boolean;
  widthRadio?: string;
  widthMobileRadio?: string;
  width?: string;
  colorTheme: SanityColorTheme;
  transparentBackground: boolean;
  textModule?: TextModule;
  images: CatalogImage[];
  title: string;
};

export type CatalogImage = {
  textModule?: TextModule;
  altText?: string;
  imageFit?: string;
  colorTheme?: SanityColorTheme;
  transparentBackground?: boolean;
  image: SanityAssetImage;
  imageMobile: SanityAssetImage;
  style?: string;
  textAlignment?: string;
  title: string;
  variant: string;
  _key?: string;
  imageText?: string;
  singleFieldSubtext: string;
  shopNowText?: string;
  linkTextAlignment: string;
  styleSettings?: StyleSettings;
};

export type StyleSettings = {
  padding?: string;
  height?: string;
  objectFit?: string;
  objectFitMobile?: string;
};

export type OneTrustGDPRDoNotSell = {
  _key?: string;
  _type: 'module.oneTrustGDPRDoNotSell';
  embedCode?: string;
  cssClass?: string;
};

export type SanityModuleCalloutButton = {
  _key?: string;
  _type: 'module.calloutButton';
  link: SanityLink;
  text?: string;
  colorTheme?: SanityColorTheme;
  cssClass?: string;
};

export type ThreeImagesModule = {
  _key?: string;
  _type: 'module.threeImagesModule';
  images?: SanityAssetImage[];
  imageLoading: string;
};

export type ImagesWithTextRow = {
  _key?: string;
  _type: 'module.imagesWithTextRow';
  images?: ImageWithText[];
  imageLoading: string;
};

export type FourImagesModule = {
  key?: string;
  _type: 'module.fourImagesModule';
  images?: fourImageGridItem[];
  imageLoading: string;
  title?: string;
  subheading?: string;
};

export type fourImageGridItem = {
  _key: string;
  _type: 'fourImageGridItem';
  image: SanityAssetImage;
  altText: string;
  link?: SanityLink;
  hideCta: boolean;
};

export type MegaMenuItem =
  | SubNavigationMenu
  | SingleNavigationItem
  | DropdownMobileImageGrid;

export type SubNavigationMenu = {
  _type: 'subNavigationMenu';
  _key: string;
  subNavTitle: string;
  navTitleLink?: SanityLinkInternal;
  subNavColumns: SubNavColumn[];
  linkList?: SanityLink[];
  dropdownColorTheme?: SanityColorTheme;
};

export type SubNavColumn =
  | SubNavMenuColumn
  | SubNavFeaturedImage
  | SubNavActionGrid
  | SingleColumnTwoLinkLists
  | SubNavVideowiseInsert
  | DropdownMobileImageGrid
  | FeaturedImageGrid;

export type DropdownMobileImageGrid = {
  _key: string;
  _type: 'dropdownMobileImageGrid';
  title?: string;
  rowContent?: SubNavFeaturedImage[];
};

export type SubNavVideowiseInsert = {
  _key: string;
  _type: 'singleColumnVideowise';
  html: string;
  columnWidth: number;
};

export type FeaturedImageGrid = {
  _key: string;
  _type: 'FeaturedImageGrid';
  gridDimensions: string;
  imageAspectRatio?: string;
  gridTitle?: string;
  gridTitleAlignment?: string;
  columnWidth: number;
  rowContent?: SubNavFeaturedImage[];
};

export type SingleColumnTwoLinkLists = {
  _type: 'singleColumnTwoLinkLists';
  _key: string;
  linkLists: TwoRowLinkList[];
  columnWidth: number;
  hideMobileLink: boolean;
  buttonStyle?: SanityColorTheme;
};

export type TwoRowLinkList = {
  _key: string;
  _type: 'column';
  title?: string;
  linkList: SanityLink[];
  hideMobileLink: boolean;
  buttonStyle?: SanityColorTheme;
};

export type SubNavMenuColumn = {
  _type: 'column';
  _key: string;
  title?: string;
  linkList?: SanityLink[];
  columnWidth: number;
  hideMobileLink: boolean;
  buttonStyle?: SanityColorTheme;
};

export type SubNavActionGrid = {
  _type: 'actionGrid';
  _key: string;
  columnWidth: number;
  imageColumn?: SubNavActionImageColumn[];
  actionGridFeaturedImage: SanityAssetImage;
  altText: string;
  actionGridFeaturedImageLink: SanityLinkInternal;
};

export type SubNavActionImageColumn = {
  _key: string;
  altText: string;
  actionGridColumnImage: SanityAssetImage;
  actionGridColumnImageLink: SanityLinkInternal;
};

export type SubNavFeaturedImage = {
  _type: 'featuredImage' | '2xfeaturedImage';
  _key: string;
  title?: string;
  link?: SanityLinkInternal;
  image: SanityAssetImage;
  hideTitle?: boolean;
  font?: string;
  textAlign?: string;
  altText: string;
  disableHoverZoom?: boolean;
  columnWidth: number;
  largeText?: string;
  textOverlay?: boolean;
};

export type NavImage = {
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
    _weak?: boolean;
  };
};

export type FeaturedImageLink = {
  _type: 'linkInternal';
  title: string;
  reference: Reference;
};

export type LinkList = {
  _type: 'singleNavigationItem';
  title?: string;
  _key: string;
  reference: Reference;
};

export type Reference = {
  _type: 'reference';
  _ref: string;
  _weak: boolean;
};

export type SingleNavigationItem = {
  linkList: SanityLink[];
  _type: 'singleNavigationItem';
  _key: string;
};

export type Announcements = {
  announcementLink?: LinkList[];
  announcementText: string;
  _key: string;
  _type: 'singelAnnouncement';
};

export type Color = {
  alpha: number;
  hex: string;
  rgb: {
    a: number;
    b: number;
    g: number;
    r: number;
    _type: 'rgbaColor';
  };
  _type: 'color';
  _key: string;
};

export type AnnouncementSettings = {
  singleAnnouncements?: SingleAnnouncement[];
  backgroundColor?: Color;
  interval?: number;
};

export type SingleAnnouncement = {
  announcementLink?: SanityLink[];
  announcementText: string;
  _key: string;
  _type: 'singleAnnouncement';
};

export type LinkAndText = {
  _key: string;
  _type: 'linkAndText';
  linkAndText: SingleItem[];
};

export type SingleItem = {
  _type: 'singleItem';
  _key: string;
  linkAndTextText: string;
  linkAndTextLink: SanityLink[];
};

export type FooterUtilites = {
  emailUsAddress: string;
  callUsNumber: string;
  link: SanityLink;
};

export type PolicyNav = SanityLink[];

export type HelpNav = SanityLink[];

export type FooterSection = {
  _type: 'footerSection';
  _key: string;
  footerSectionTitle: string;
  footerSectionLinklist: SanityLink[];
};

export type MegaFooter = {
  footerNavigation: FooterSection[];
};

export type SocialLinks = {
  _type: 'socialLinks';
  instagramUrl: string;
  facebookUrl: string;
  pinterestUrl: string;
  youtubeUrl: string;
  twitterUrl: string;
};

export type Carousel = {
  _type: 'heroCarousel' | 'carousel';
  interval: number;
  carouselHeight: string | '830px';
  slides: Slide[] | VideowiseHTML;
};

export type Slide = {
  _key: string;
  _type: string;
  images?: SlideImage[];
  link?: SanityLinkInternal;
  heading?: SlideText[];
  subHeading?: string;
  additionalText?: SlideText[];
  textColor?: Color;
  verticalOrientation?: VerticalOrientation;
  contentSlide?: number;
  html?: string;
  hideTitle?: boolean;
};

export type VerticalOrientation = 'top' | 'middle' | 'bottom';

export type SlideImage = ImageAndMobile | Color;

export type ImageAndMobile = {
  slideImages?: {
    image: SanityAssetImage;
    mobileImage: SanityAssetImage;
    altText: string;
  };
  image?: SanityAssetImage;
  mobileImage?: SanityAssetImage;
  _key: string;
  _type: 'slideImage';
};

export type SlideText = {
  _type: string;
  _key: string;
  children: PortableTextSpan[];
  markDefs?: PortableTextObject[];
  listItem?: string;
  style?: string;
  level?: number;
};

export type CustomModule =
  | ModuleQuoteBanner
  | ModuleShopByCollection
  | FeaturedBlogPosts
  | FeaturedCollection
  | FeaturedFabric
  | FeaturedProducts
  | ImageWithText
  | ThreeImagesModule
  | FourImagesModule
  | SingleTestimonial
  | TableData
  | TextModule
  | ColumnsOfTextModule
  | ListColumns
  | OneTrustGDPRDoNotSell
  | JotFormModule
  | LetsGetStyled
  | BackToLink
  | SanityModuleCalloutButton
  | Catalog
  | ColumnsOfStylistsModule
  | ColumnsOfProducts
  | GuideProduct
  | RichText
  | FeaturedProductsGrid
  | FeaturedProductsGridHomepage
  | ImageGrid
  | CompleteTheLook;

// quote banner module
export type ModuleQuoteBanner = {
  _type: 'module.quoteBanner';
  _key: string;
  richText: {
    children: RichtTextChild[];
    _type: 'block';
    _key: string;
    style?: string;
    markDefs?: PortableTextObject[];
  };
  quoteLink?: SanityLinkInternal;
};

export type RichtTextChild = {
  _key: string;
  _type: 'span';
  text: string;
  marks?: string[];
};

export type TableData = {
  _key?: string;
  _type: 'module.tableData';
  table_name?: string;
  columns: string[];
  rows: TableRow[];
  hero?: boolean;
};

export type TableRow = {
  cells: string[];
};

export type RichText = {
  children: RichtTextChild[];
  _type: 'block';
  _key: string;
  style?: string;
  markDefs?: PortableTextObject[];
};
// blogPost
export type FeaturedBlogPosts = {
  _type: 'module.featuredBlogPosts'; // Adjust the type name if needed
  _key: string;
  image?: SanityAssetImage;
  imageMobile?: SanityAssetImage;
  cssClass?: string;
  altText?: string;
  imageTitle?: string;
  variant?: string;
  callToAction?: {
    link: SanityLink;
    title?: string;
  };
  caption?: string;
  productTags?: SanityProductWithVariant[];
  productHotspots?: SanityProductHotspot[];
  // Add other properties specific to the featured blog posts module
  blogPosts: FeaturedBlogPostItem[];
};

export type SmallImage = {
  altText: string;
  asset: {
    _ref: string;
    _type: string;
    blurDataURL: string;
    height: number;
    url: string;
    width: number;
  };
  url: string;
};

export type FeaturedBlogPostItem = {
  _key: string;
  category: string;
  featuredImage: SmallImage;
  featuredImageMobile: SmallImage;
  includeInRecent: boolean;
  tags: string[];
  shortDescription: string;
  slug: {
    current: string;
    _type: string;
  };
  title: string;
  author: string;
  _createdAt: string;
  _id: string;
  _type: string;
};
export type BlogPost = {
  category: string;
  featuredImage?: {
    altText: string;
    asset: {
      _ref: string;
      _type: string;
      blurDataURL: string;
      height: number;
      url: string;
      width: number;
    };
  };
  altText?: string;
  includeInRecent?: boolean;
  tags?: string[];
  shortDescription?: string;
  slug: {
    current: string;
    _type: string;
  };
  title: string;
  author?: string;
  modules?: SanityModule[];
  _createdAt: string;
  _id: string;
  _type: string;
};

// shop by collection module
export type ModuleShopByCollection = {
  _type: 'module.shopByCollection';
  _key: string;
  moduleHeading: string;
  moduleSubHeading: string;
  collections: ShopByCollectionCollection[];
};

export type ShopByCollectionCollection = {
  _type: 'collection';
  _key: string;
  panelHeading: string;
  panelButtonText: string;
  panelTextPlacement?: string;
  panelImage: SanityAssetImage;
  panelImageMobile: SanityAssetImage;
  panelImageAltText: string;
  panelCollectionReference: SanityCollection;
  panelInternalLink: SanityLinkInternal;
};

// featured collection module
export type FeaturedCollection = {
  _type: 'module.featuredCollection';
  _key: string;
  linkText: 'string';
  moduleDescription: 'string';
  moduleHeading: 'string';
  collection: SanityCollection;
};

// complete the look module
export type CompleteTheLook = {
  _type: 'module.completeTheLook';
  _key: string;
  title?: string;
  image?: SanityAssetImage;
  altText?: string;
  product?: ExtendedProduct[];
  products?: ExtendedProduct[];
  variant?: 'default' | 'variant 2';
  colorTheme?: SanityColorTheme;
};

export type CompleteTheLookRow = {
  _type: 'module.completeTheLookRow';
  _key: string;
  groupTitle?: string;
  content?: CompleteTheLook[];
  colorTheme?: SanityColorTheme;
};

// featured products module
export type FeaturedProducts = {
  _type: 'module.featuredProducts';
  _key: string;
  heading: string;
  subheading: string;
  productColumns: FeaturedProductColumns[];
};

export type FeaturedProductColumns =
  | FeaturedProductSingleProductColumn
  | FeaturedProductTwoProductColumn;

export type FeaturedProductSingleProductColumn = {
  _type: 'singleProductColumn';
  _key: string;
  heading: string;
  link: SanityLinkInternal;
  image: SanityAssetImage;
  imageMobile: SanityAssetImage;
  altText: string;
};

export type FeaturedProductTwoProductColumn = {
  _type: 'twoProductColumn';
  _key: string;
  twoProductColumns: {
    _type: 'product';
    _key: string;
    heading?: string;
    link: SanityLinkInternal;
    image: SanityAssetImage;
    imageMobile: SanityAssetImage;
    altText: string;
  }[];
};

export type GorgiasChatButton = {
  _type: 'module.gorgiasChatButton';
  _key: string;
  chatLink: string;
};

export type PDPGlobalModules =
  | PDPAMessageFromJMcL
  | PDPRequestACatalog
  | PDPFinalSale;

export type PDPAMessageFromJMcL = {
  _type: 'pdpMessageFromJMCL';
  key: string;
  show?: boolean;
  heading?: string;
  MFJMCL_richText?: RichText[];
  image?: {
    asset: object;
    url: string;
  };
};

export type PDPRequestACatalog = {
  _type: 'pdpRequestACatalog';
  key: string;
  show?: boolean;
  RAC_richText?: RichText[];
  heading?: string;
  bodyText?: string;
  image?: {
    url?: string;
  };
  requestACatalog?: {
    slug: string;
    title: string;
  };
  virtualCatalogLink?: {
    title: string;
    url?: string;
    slug?: string;
  };
};

export type PDPFinalSale = {
  _type: 'pdpFinalSale';
  key: string;
  heading: string;
  bodyText: string;
};

export type ColumnsOfStylistsModule = {
  _type: 'module.columnsOfStylistsModule';
  _key: string;
  columns: ColumnWImage[];
};

export type ColumnWImage = {
  _key: string;
  _type: 'object';
  textContent: {
    colorTheme?: SanityColorTheme;
    textFields?: Stylist_Image_TextFields[];
  };
  imageContent: {
    image?: SanityAssetImage;
    imageMobile?: SanityAssetImage;
    altText?: string;
    imageLoading: string;
  };
};
export type Stylist_Image_TextFields =
  | StylistHeading
  | StylistBio
  | SanityLinkInternal;

export type StylistHeading = {
  _key: string;
  _type: 'headingObject';
  name: string;
};

export type StylistBio = {
  _key: string;
  _type: 'descriptionObject';
  description: string;
};

export type LetsGetStyled = {
  _key: string;
  _type: 'module.letsGetStyled';
  descriptionText?: string;
  iframeUrl?: string;
  colorTheme?: SanityColorTheme;
};

export type ImageGrid = {
  _key: string;
  _type: 'module.imageGrid';
  sidebar: {
    sidebarEnable?: boolean;
    sidebarHeading?: string;
    sidebarDescription?: string;
    sidebarLinkText?: SanityLinkInternal;
  };
  images: ImageGridItem[];
};

export type ImageGridItem = {
  _key: string;
  _type: 'gridItem';
  image: SanityAssetImage;
  imageMobile: SanityAssetImage;
  altText: string;
  link?: SanityLinkInternal;
  hideCta?: boolean;
};

export type TextContent = {
  productImage: SanityAssetImage;
  productImageMobile: SanityAssetImage;
  altText: string;
  mobileSlideWidth?: string;
  link: SanityLinkInternal;
  hoverZoom?: boolean;
  borderRadius?: boolean;
  textAlign?: string;
  textOverlay?: boolean;
  textOverlayAlignment?: string;
};

export type ProductColumn = {
  _key: string;
  _type: string;
  textContent: TextContent;
};

export type ColumnsOfProducts = {
  _type: 'module.columnsOfProducts';
  _key: string;
  columns: ProductColumn[];
};

export type JotFormModule = {
  _key: string;
  _type: 'module.jotForm';
  iframeUrl?: string;
  colorTheme?: SanityColorTheme;
};

export type BackToLink = {
  _type: 'module.backToLink';
  internalLinks: SanityLinkInternal;
  image: SanityAssetImage;
};

export type ImageWithText = {
  _type: 'module.imageWithText';
  _key: string;
  imageContent: {
    desktopImage: SanityAssetImage;
    mobileImage: SanityAssetImage;
    altText: string;
    imageWidth: string;
    imageLeftOrRight: 'left' | 'right';
  };
  textContent: {
    colorTheme: SanityColorTheme;
    textFields: ImageWithText_TextFields[];
    textLeftOrCenter?: 'left' | 'center';
    textOverlay?: {
      textOverlayBoolean: boolean;
      hideOverlayMobile: boolean;
      textOverlayPosition: 'start' | 'center' | 'end';
      backgroundTransparency: string;
    };
  };
  hotspots?: any[];
  cssClass?: string;
};

export type CatalogImageNew = {
  _type: 'module.catalogImageNew';
  _key: string;
  image?: SanityAssetImage;
  imageMobile?: SanityAssetImage;
  altText: string;
  textAbove?: TextModule;
  textOverlay?: TextModule;
  textBelow?: TextModule;
  overlayPositionDesktop?: {
    x?: number;
    y?: number;
  };
  overlayPositionMobile?: {
    x?: number;
    y?: number;
  };
  overlayAlignment?: 'left' | 'center' | 'right';
  overlaySnap?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'center-left'
    | 'center-center'
    | 'center-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
  variant?: string;
  hotspots?: any[];
  internalLink?: SanityLinkInternal;
  styleDesktop?: {
    padding?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    margin?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    objectFit?: string;
  };
  styleMobile?: {
    padding?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    margin?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    objectFit?: string;
  };
};

export type TextModule = {
  _type: 'module.textModule';
  _key: string;
  textContent: {
    colorTheme: SanityColorTheme;
    textFields: ImageWithText_TextFields[];
    styles?: string[];
  };
};

export type ColumnsOfTextModule = {
  _type: 'module.columnsOfTextModule';
  _key: string;
  columns: Column[];
};

export type Column = {
  _key: string;
  _type: 'object';
  textContent: {
    colorTheme: SanityColorTheme;
    textFields: ImageWithText_TextFields[];
  };
};

export type ImageWithText_TextFields =
  | Heading
  | SubHeading
  | Description
  | StringArrayObject
  | SanityLinkInternal
  | iRichTextModule;

export type Heading = {
  _key: string;
  _type: 'headingObject';
  heading: string;
  headerLevel?: string;
  colorTheme?: SanityColorTheme;
};

export type SubHeading = {
  _key: string;
  _type: 'subHeadingObject';
  subHeading: string;
  colorTheme?: SanityColorTheme;
};

export type Description = {
  _key: string;
  _type: 'descriptionObject';
  description: string;
  colorTheme?: SanityColorTheme;
};

export type StringArrayObject = {
  _key: string;
  _type: 'stringArrayObject';
  strings: string[];
  listType: string;
};

export type iRichTextModule = {
  _key: string;
  _type: 'module.richText';
  richTextBody: RichText[];
  columnWidth?: string;
};

export type PureHTMLModule = {
  _key: string;
  _type: 'module.pureHTML';
  html: string;
};

export type VideowiseHTML = {
  _key: string;
  _type: string;
  playButton?: boolean;
  buttonTheming?: SanityColorTheme;
  html: string;
  mobileHTML?: string;
  index?: number;
  page?: number;
  hideMobile?: boolean;
  hideTablet?: boolean;
  hideDesktop?: boolean;
  widthRadio?: string;
  widthMobileRadio?: string;
};

export type GuideProduct = {
  _type: 'module.guideProduct';
  _key: string;
  images: GuideProductImage[];
  productInfo: {
    productTitle: string;
    productDescription: string;
    bulletPoints?: string[];
    internalLink?: SanityLinkInternal;
  };
};

export type GuideProductImage = {
  guideProductImage: {
    image: SanityAssetImage;
    imageMobile: SanityAssetImage;
    imageAltText: string;
  };
};

export type FeaturedFabric = {
  _type: 'module.featuredFabric';
  _key: string;
  fabricInfo: FabricInfo;
};

export type FabricInfo = {
  heading?: string; // Updated from 'productTitle' to 'fabricTitle'
  description?: string; // Updated from 'productDescription' to 'fabricDescription'
  bulletPoints?: string[];
  internalLinks?: SanityLinkInternal;
  displayProductInfoLocation?: string;
  displayButtonLocation?: string;
  styles?: string[];
  sideBySideImages?: SideBySideImages;
  twoColumnCards?: TwoColumnCards;
};

export type TwoColumnCards = Array<{
  _key: string;
  image?: SanityAssetImage;
  imageMobile?: SanityAssetImage;
  imageAltText?: string;
  heading?: string;
  description?: string;
  bulletPoints?: string[];
  internalLinks?: SanityLinkInternal;
  icons?: Array<{
    iconImage?: SanityAssetImage;
    iconHeading?: string;
    iconDetail?: string;
  }>;
}> | null;

export type SideBySideImages = Array<{
  image: SanityAssetImage;
  imageMobile?: SanityAssetImage;
  imageAltText?: string;
  _key: string;
}> | null;

export type PromoProducts = {
  _key: string;
  _type: 'module.promoProducts';
  max: number;
  columnsOnDesktop: number;
  collection: SanityCollection;
};

export type SingleTestimonial = {
  _type: 'module.singleTestimonial';
  _key: string;
  title: string;
  imagePanel: SanityAssetImage;
  imagePanelMobile: SanityAssetImage;
  altText: string;
  quotationPanel: {
    colorTheme: SanityColorTheme;
    quoteTextFields: SingleTestimonial_TextFields;
  };
};

export type SingleTestimonial_TextFields = {
  quote: string;
  jobTitle: string;
  name: string;
};

export type ListColumns = {
  _type: 'module.listColumns';
  _key: string;
  heading: string;
  columns: Array<ColumnObject>;
  bottomContent: string;
  colorTheme: SanityColorTheme;
};

export type ColumnObject = {
  _type: 'columnObject';
  _key: string;
  columnHeading: string;
  columnStrings: Array<string>;
};

export type FeaturedProductsGridHomepage = {
  _type: 'module.featuredCollection';
  _key: string;
  linkText: 'string';
  moduleDescription: 'string';
  moduleHeading: 'string';
  collections: {
    collection: SanityCollection; // Reference to the collection
    sidebarTitle: string; // Custom sidebar title
  }[];
  hideReviews?: boolean;
  hideSwatches?: boolean;
};

export type FeaturedProductsGrid = {
  _id: string;
  _type: string;
  _key: string;
  hideSwatches?: boolean;
  hideReviews?: boolean;
  sidebar?: {
    sidebarSubtitle: 'string';
    sidebarMenuItemsArray: SanityLinkInternal;
  };
  product?: ExtendedProduct[];
  products?: ExtendedProduct[];
  title?: string;
};

export type ASTMetafieldNode = {
  type: string;
  children?: ASTMetafieldNode[];
  value?: string;
  bold?: boolean;
  italic?: boolean;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  listType?: 'ordered' | 'unordered';
  url?: string;
  title?: string;
  target?: string;
};

export type SidebarLink = {
  title: string;
  slug: string;
  link: string;
  _key: string;
  _type: 'sidebarAccountLink';
};

export type SlottedContentItem = {
  _key: string;
  _type: 'content';
  hideMobile?: boolean;
  hideTablet?: boolean;
  hideDesktop?: boolean;
  index: number;
  page: number;
  links?: SanityLink;
  image: SanityAssetImage;
  imageMobile: SanityAssetImage;
  altText?: string;
  imageSize?: string;
  widthRadio: string;
  widthMobileRadio: string;
  colorTheme: SanityColorTheme;
  richTextBody: RichText[];
  backgroundTransparency?: boolean;
  width?: string;
};

export type HeroFullWidth = {
  _key: string;
  _type: 'module.heroFullWidth';
  title?: string;
  subtitle?: string;
  colorTheme?: SanityColorTheme;
  textLeftOrRight?: 'left' | 'center';
  image: SanityAssetImage;
  imageMobile?: SanityAssetImage;
  altText?: string;
  link?: SanityLinkInternal;
  link2?: SanityLinkInternal;
  linkColorTheme1?: SanityColorTheme;
  linkColorTheme2?: SanityColorTheme;
};

export interface HeadingProps {
  text: string;
  hero?: boolean;
}
export interface SubHeadingProps {
  text: string;
}
export interface DescriptionProps {
  text: string;
}
export interface LinkInternalProps {
  key: string;
  borderColor: string;
  textAlign?: 'left' | 'center';
  alignSelf?: string;
  textField: SanityLinkInternal;
}
export interface RichTextProps {
  richTextBody: RichText[];
}
export interface StringArrayObjectProps {
  key: string;
  listType: string;
  strings: string[];
}

export type DisplayOptions = {
  showColorSwatches: boolean;
  cardsVisible: 'more' | 'fewer';
};

export type PodSlider = {
  heading: {
    heading: string | null;
    mobileAlignment: 'left' | 'center' | 'right';
    desktopAlignment: 'left' | 'center' | 'right';
  };
  pod?: {
    podId: string;
    numberOfProducts: number | null;
    limitResultsToCollection?: boolean | null;
    itemID?: string | string[];
    categoryID?: string;
  };
  podId?: string;
  limitResultsToCollection?: boolean | null;
  itemID?: string | string[];
  cartItemsIDs?: string;
  categoryID?: string;
  numberOfProducts?: number | null;
  displayOptions: DisplayOptions;
  isCart?: boolean;
  cartIsEmpty?: boolean;
  _key: string;
  _type: 'module.podSlider';
};

export type ShelfHeaders = {
  _key: string;
  _type: 'module.shelfHeaders';
  hideOnMobile?: boolean;
  links?: SanityLinkInternal[];
};

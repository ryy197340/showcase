import {useMatches} from '@remix-run/react';
import {stegaClean} from '@sanity/client/stega';
import {Image} from '@shopify/hydrogen';
import {memo, useEffect, useRef, useState} from 'react';
import {v4 as uuidv4} from 'uuid';

import Modal from '~/components/global/ModalCardCatalog';
import {Link} from '~/components/Link';
import CardCatalog from '~/components/product/CardCatalog';
import ImageGridHotspot from '~/components/product/HotspotImageGrid';
import {useHydration} from '~/hooks/useHydration';
import {
  DescriptionProps,
  HeadingProps,
  ImageWithText as ImageWithTextType,
  ImageWithText_TextFields,
  LinkInternalProps,
  RichTextProps,
  StringArrayObjectProps,
  SubHeadingProps,
} from '~/lib/sanity';
import {DEFAULT_COLOR_THEME} from '~/lib/utils';
import {hexToRgba} from '~/utils/styleHelpers';

import SanityImage from '../media/SanityImage';
import PortableText from '../portableText/PortableText';
import ProductTooltip from '../product/Tooltip';
import ImageWithTextSSR from './ImageWithTextSSR';

type Props = {
  content?: ImageWithTextType;
  hero?: boolean;
};

const Heading = memo<HeadingProps>(({text, hero}) => {
  return hero ? (
    <h1 className="font-hoefler text-[44px]">{text}</h1>
  ) : (
    <h2 className="text-[34px]">{text}</h2>
  );
});
const SubHeading = memo<SubHeadingProps>(({text}) => {
  return (
    <span className="text-2xs uppercase tracking-[1px] sm:pt-0">{text}</span>
  );
});
const Description = memo<DescriptionProps>(({text}) => {
  return text.split('\n').map((paragraph) => (
    <p className="text-sm leading-[20px]" key={`desc-${uuidv4()}`}>
      {paragraph}
    </p>
  ));
});
const LinkInternal = memo<LinkInternalProps>(
  ({borderColor, textAlign, alignSelf, textField}) => {
    if (textField.slug) {
      return (
        <Link
          className={`max-w-max px-2 py-1 text-xs uppercase tracking-[1.2px] ${
            !textField.hideUnderline
              ? 'underline decoration-2 underline-offset-8'
              : ''
          }`}
          style={{
            borderColor,
            textAlign,
            alignSelf,
            background: hexToRgba(textField.buttonStyle?.background),
            color: textField.buttonStyle?.text,
          }}
          to={textField.slug}
          prefetch="intent"
        >
          {textField.title}
        </Link>
      );
    } else {
      return (
        <span
          className="button-link-border-b max-w-max px-2 pb-1 text-xs uppercase tracking-[1.2px]"
          style={{borderColor, textAlign, alignSelf}}
        >
          {textField.title}
        </span>
      );
    }
  },
);
const RichTextBlock = memo<RichTextProps>(({richTextBody}) => {
  return (
    <div>
      {richTextBody &&
        richTextBody !== null &&
        richTextBody[0].children[0].text !== '' && (
          <PortableText blocks={richTextBody} centered />
        )}
    </div>
  );
});
const StringArrayObject = memo<StringArrayObjectProps>(
  ({listType, strings}) => {
    const arrayListType = listType === 'bullet' ? 'list-disc' : 'list-decimal';

    return (
      <ul className={`pb-4 ${arrayListType}`}>
        {strings.map((string) => (
          <li
            key={`string-array-${uuidv4()}`}
            className="list-inside text-sm leading-[20px]"
          >
            {string}
          </li>
        ))}
      </ul>
    );
  },
);

const ImageWithTextCSR = memo(({content, hero}: Props) => {
  const [root] = useMatches();
  const sanityDataset = root.data?.sanityDataset;
  const sanityProjectID = root.data?.sanityProjectID;
  const {imageContent, textContent, cssClass, hotspots} = content;
  const {desktopImage, mobileImage, imageWidth, imageLeftOrRight, altText} =
    imageContent;
  const {colorTheme, textFields, textLeftOrCenter, textOverlay} = textContent;
  const {background, text} = colorTheme ? colorTheme : DEFAULT_COLOR_THEME;
  let url: string | undefined;

  // the product that is active in the modal window
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);
  // the primary product associated with the hotspot, it will also be the active product when the modal opens
  const [primaryProduct, setPrimaryProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState(null);
  const [relatedProductsHandles, setRelatedProductsHandles] = useState(null);
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [variationsMap, setVariationsMap] = useState(null); // sourced from Shopify

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

  if (!content) {
    return null;
  }
  const textBoxWidth = 100 - parseFloat(imageWidth.split('%')[0]) + '%';
  const overlayBackgroundTransparency =
    stegaClean(content.textContent.textOverlay?.backgroundTransparency) ===
    '100% transparent background'
      ? '00'
      : stegaClean(content.textContent.textOverlay?.backgroundTransparency) ===
        '50% transparent background'
      ? '7d'
      : '';
  const textAlignmentClass =
    stegaClean(textLeftOrCenter) === 'center'
      ? 'text-center md:justify-center'
      : 'text-left justify-start';
  const renderTextField = (textField: ImageWithText_TextFields) => {
    switch (textField._type) {
      case 'subHeadingObject':
        return <SubHeading text={textField.subHeading} key={textField._key} />;
      case 'headingObject':
        return (
          <Heading text={textField.heading} hero={hero} key={textField._key} />
        );
      case 'descriptionObject':
        return (
          <Description text={textField.description} key={textField._key} />
        );
      case 'stringArrayObject': {
        const arrayStrings = textField.strings[0]
          .split('\n')
          .filter((str: string) => str.trim() !== '');

        return (
          <StringArrayObject
            key={textField._key}
            listType={textField.listType}
            strings={arrayStrings}
          />
        );
      }
      case 'linkInternal':
        return (
          <LinkInternal
            key={textField._key}
            borderColor={text}
            textAlign={textLeftOrCenter}
            alignSelf={textLeftOrCenter}
            textField={textField}
          />
        );
      case 'module.richText':
        return (
          <RichTextBlock
            key={textField._key}
            richTextBody={textField.richTextBody}
          />
        );
      default:
        return null;
    }
  };
  const imageBoxStyles = {
    width: stegaClean(imageWidth),
  };
  const textBoxWidthStyles = {
    width: `${
      textOverlay?.textOverlayBoolean
        ? stegaClean(imageWidth)
        : stegaClean(textBoxWidth)
    }`,
  };

  const textBoxColorStyles = {
    backgroundColor: `${background}${overlayBackgroundTransparency}`,
    color: text,
  };
  const textBoxContent = (
    <div
      className={`textBoxStyles flex flex-col items-center ${
        textOverlay?.textOverlayBoolean
          ? `absolute h-full justify-${stegaClean(
              textOverlay.textOverlayPosition,
            )} text-center`
          : `relative w-full justify-center md:w-1/2 ${stegaClean(
              textAlignmentClass,
            )}`
      }`}
      style={textBoxWidthStyles}
    >
      <div
        className={`flex flex-col gap-5 align-middle ${textAlignmentClass} md:w-3/4 ${
          hero === true
            ? 'py-[47px] md:py-[50px]'
            : 'minHeight-[160px] p-5 md:px-0'
        }`}
        style={textBoxColorStyles}
      >
        {textFields ? textFields.map(renderTextField) : ''}
      </div>
    </div>
  );
  const imageWithTextContent = (
    <div
      className={`page-width image-with-text-content ${
        hero === true ? 'md:pb-0' : ''
      } ${cssClass ? `${cssClass}` : ''}`}
    >
      <div
        className={`relative flex w-full flex-col ${
          stegaClean(imageLeftOrRight) === 'right' ? 'md:flex-row-reverse' : ''
        } flex-wrap md:flex-row ${
          !textOverlay?.textOverlayBoolean
            ? hero !== true
              ? 'md:px-10 lg:px-20'
              : 'lg:px-10'
            : ''
        } md:pt-0`}
      >
        <div
          className={`imageBoxStyles relative w-full ${
            hero !== true ? 'px-5 md:px-0' : ''
          } ${!textOverlay?.textOverlayBoolean ? 'md:w-1/2' : 'w-full'}`}
          style={imageBoxStyles}
        >
          {/* both desktop and mobile images exist */}
          {desktopImage?.url && mobileImage?.url ? (
            <picture className="flex h-full w-full">
              <source media="(max-width: 767px)" srcSet={mobileImage.url} />
              <source media="(min-width: 768px)" srcSet={desktopImage.url} />
              <Image
                src={desktopImage.url}
                alt={stegaClean(altText)}
                loading="eager"
                className="!aspect-auto w-full object-cover"
                height={desktopImage.height}
                width={desktopImage.width}
              />
            </picture>
          ) : // only desktop image exists
          desktopImage ? (
            <div className="relative h-[200px]">
              <SanityImage
                alt={stegaClean(altText)}
                crop={desktopImage?.crop}
                dataset={sanityDataset}
                hotspot={desktopImage?.hotspot}
                layout="fill"
                objectFit="cover"
                projectId={sanityProjectID}
                sizes="100vw"
                src={desktopImage?.asset?._ref}
                height={434}
                width={600}
              />
            </div>
          ) : mobileImage ? (
            <div className="relative">
              <SanityImage
                alt={altText}
                crop={mobileImage?.crop}
                dataset={sanityDataset}
                hotspot={mobileImage?.hotspot}
                layout="fill"
                objectFit="cover"
                projectId={sanityProjectID}
                sizes="100vw"
                src={mobileImage?.asset?._ref}
              />
            </div>
          ) : (
            <Image
              src={desktopImage?.url}
              alt={altText}
              className={`w-full ${
                hero === true
                  ? 'min-h-[306px] md:h-[400px] lg:h-[500px]'
                  : 'min-h-[200px]'
              } md:min-[300px] object-cover object-top lg:min-h-[400px]`}
              crop="center"
              sizes="100%"
              loading="eager"
            />
          )}
          {/* Product Hotspots */}
          <div className="absolute left-0 top-0 h-full w-full">
            {content.hotspots?.map((hotspot) => {
              if (!hotspot.productWithVariant?.product) return null;

              const id = hotspot.productWithVariant.product._ref.split('-')[1];
              const productGid = `gid://shopify/Product/${id}`;

              return (
                <ImageGridHotspot
                  key={hotspot._key}
                  id={id}
                  productGid={productGid}
                  variantGid={hotspot.productWithVariant.variantGid}
                  x={hotspot.x}
                  y={hotspot.y}
                  relatedProducts={hotspot?.relatedProducts}
                  setRelatedProducts={setRelatedProducts}
                  setRelatedProductsHandles={setRelatedProductsHandles}
                  isCatalogHotspot={true} // This is ImageWithText, not catalog
                  isImageGridImage={false}
                  setActiveHotspot={setActiveHotspot}
                  setActiveProduct={setActiveProduct}
                  setPrimaryProduct={setPrimaryProduct}
                  setIsModalOpen={setIsModalOpen}
                />
              );
            })}
          </div>
        </div>
        {textBoxContent}
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

  return url ? (
    <Link to={url} prefetch="intent">
      {imageWithTextContent}
    </Link>
  ) : (
    <>{imageWithTextContent}</>
  );
});

export default function ImageWithText(props: any) {
  const isHydrated = useHydration();
  return (
    <>
      {isHydrated ? (
        <ImageWithTextCSR {...props} />
      ) : (
        <ImageWithTextSSR {...props} />
      )}
    </>
  );
}

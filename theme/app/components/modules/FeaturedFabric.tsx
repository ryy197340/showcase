import {Image} from '@shopify/hydrogen';
import clsx from 'clsx';
import {useEffect, useState} from 'react';
import {v4 as uuidv4} from 'uuid';

import Button, {squareButtonStyles} from '~/components/elements/Button';
import {Link} from '~/components/Link';
import {
  FabricInfo,
  FeaturedFabric as FeaturedFabricType,
  SideBySideImages,
  TwoColumnCards,
} from '~/lib/sanity';

type Props = {
  module?: FeaturedFabricType;
  index?: number;
};

export default function FeaturedFabric({module, index}: Props) {
  const fabricInfo: FabricInfo = module ? module.fabricInfo : {};
  const {styles = []} = fabricInfo;

  const [sectionStyles, setSectionStyles] = useState({});

  useEffect(() => {
    // Check if styles are defined and set them as section styles
    if (styles && styles.length > 0) {
      const sectionStyle = styles.join('; ');
      setSectionStyles(sectionStyle);
    }
  }, [styles]);

  if (!module) {
    return null; // Return null or handle the case when content is not available.
  }
  const moduleIndex = index;

  let sideBySideImages: SideBySideImages = null;
  let twoColumnCards: TwoColumnCards = null; // Define variables to avoid redeclaration.

  const {
    heading,
    description,
    bulletPoints,
    internalLinks,
    displayProductInfoLocation,
    displayButtonLocation,
    sideBySideImages: sideBySideImagesData,
    twoColumnCards: twoColumnCardsData,
  } = fabricInfo;

  const bulletPointArray = bulletPoints ? bulletPoints : null;

  if (sideBySideImagesData) {
    sideBySideImages = sideBySideImagesData; // Assign the data to the variable.
  }

  if (twoColumnCardsData) {
    twoColumnCards = twoColumnCardsData; // Assign the data to the variable.
  }

  return (
    <div
      className={`page-width flex flex-col ${
        sectionStyles ? sectionStyles : ''
      }`}
    >
      {heading || description || bulletPoints || internalLinks ? (
        <div
          className={`flex w-full flex-col justify-center px-5 lg:px-[156px] ${
            displayProductInfoLocation && displayProductInfoLocation === 'Top'
              ? 'order-1'
              : 'order-2 pt-10'
          }`}
        >
          {/* Fabric Info - heading, description, bulletPoints, internalLink */}
          <div
            className={`flex w-full flex-col justify-center gap-5 md:px-4 lg:px-[40px]`}
          >
            {heading && <h2 className="text-center text-xl2">{heading}</h2>}
            {description && (
              <p className="text-center text-sm" style={{lineHeight: '20px'}}>
                {description}
              </p>
            )}
            {bulletPointArray && (
              <ul className="flex flex-wrap self-center pl-5 md:flex-row md:gap-[5px]">
                {bulletPointArray.map((point: string) => (
                  <li
                    className="float-left mr-2 list-inside list-disc md:mr-0"
                    key={uuidv4()}
                  >
                    <span className="relative left-[-5px] text-sm">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {/* Internal Link */}
            {internalLinks && (
              <Link
                className={`text-center ${
                  displayButtonLocation === 'Bottom' ? 'hidden' : ''
                }`}
                to={`${internalLinks.slug}`}
                key={module._key}
              >
                <Button
                  className={clsx([
                    squareButtonStyles({mode: 'default', tone: 'default'}),
                    'm-auto w-[240px] text-center',
                  ])}
                  type="button"
                >
                  {internalLinks.title}
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : null}
      {/* Module.sideBySideImages */}
      {sideBySideImages && Array.isArray(sideBySideImages) && (
        <div
          className={`flex w-full flex-col md:flex-row ${
            displayProductInfoLocation && displayProductInfoLocation === 'Top'
              ? 'order-2 pt-10'
              : 'order-1 '
          }`}
        >
          <div
            className={`flex w-full flex-row justify-center gap-[10px] px-5 md:w-full md:flex-row md:gap-[35px] md:px-0`}
          >
            {sideBySideImages.map((image) => (
              <div key={uuidv4()}>
                {image.image?.url && (
                  <Image
                    src={image.image.url}
                    alt={image.imageAltText}
                    width={`${image.image.width}px`}
                    height={`${image.image.height}px`}
                    loading={moduleIndex && moduleIndex <= 2 ? 'eager' : 'lazy'}
                    className="hidden md:block"
                  />
                )}
                {image.imageMobile?.url && (
                  <Image
                    src={image.imageMobile.url}
                    alt={image.imageAltText}
                    width={`${image.imageMobile.width}px`}
                    height={`${image.imageMobile.height}px`}
                    loading={moduleIndex && moduleIndex <= 2 ? 'eager' : 'lazy'}
                    className="block md:hidden"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Module.twoColumnCards */}
      {twoColumnCards && Array.isArray(twoColumnCards) && (
        <div
          className={`flex w-full flex-col gap-[10px] px-5 md:flex-row md:gap-[35px] md:px-5 ${
            displayProductInfoLocation && displayProductInfoLocation === 'Top'
              ? 'order-2 pt-[40px]'
              : 'order-1 md:pb-10'
          }`}
        >
          {twoColumnCards.map((card, index) => (
            <div
              className={`flex w-full flex-row items-center gap-5 md:w-1/2 md:flex-col md:items-start ${
                index === 0 ? 'lg:items-end' : ''
              }`}
              key={card._key}
            >
              <div
                className={`flex w-full flex-col items-center md:w-auto md:justify-center ${
                  index === 0 ? 'lg:items-end' : ''
                }`}
              >
                <Image
                  src={card.image?.url}
                  alt={card.imageAltText}
                  className="hidden md:block"
                  sizes="100%"
                  width={`${card.image?.width}px`}
                  height={`${card.image?.height}px`}
                />
                {card.imageMobile && (
                  <Image
                    src={card.imageMobile?.url}
                    alt={card.imageAltText}
                    className="block md:hidden"
                    sizes="100%"
                    width={`${card.imageMobile?.width}px`}
                    height={`${card.imageMobile?.height}px`}
                  />
                )}
                {Array.isArray(card.icons) &&
                  card.icons.map((icon, iconIndex) => (
                    <div
                      key={uuidv4()}
                      className="align-center flex min-h-[115px] self-start pt-6 md:min-h-0"
                    >
                      {/* Icon Image */}
                      {icon.iconImage && (
                        <Image
                          src={icon.iconImage.url}
                          alt={icon.iconHeading}
                          className="h-[30px] w-[30px]"
                          width="31px"
                          height="31px"
                        />
                      )}
                      <div className="flex flex-col pl-2 pt-[3px] md:justify-center">
                        {/* Icon Heading */}
                        <span className="text-sm font-semibold">
                          {icon.iconHeading}
                        </span>

                        {/* Icon Detail */}
                        <p className="text-sm">{icon.iconDetail}</p>
                      </div>
                    </div>
                  ))}

                {/* Display heading, description, and internal link */}
                {(card.heading ||
                  card.description ||
                  card.bulletPoints ||
                  card.internalLinks) && (
                  <div className="m-auto flex max-w-[431px] flex-col justify-center gap-[20px] pt-10">
                    {card.heading && (
                      <h2 className="text-center text-xl2">{card.heading}</h2>
                    )}
                    {card.description && (
                      <p className="text-center text-sm">{card.description}</p>
                    )}
                    {card.bulletPoints && (
                      <ul className="flex max-w-[431px] flex-row flex-wrap self-center md:gap-[20px]">
                        {card.bulletPoints.map((point: string) => (
                          <li
                            className="ml-5 list-disc md:ml-0 md:w-auto md:flex-grow"
                            key={uuidv4()}
                          >
                            <span className="relative left-[-5px] text-sm">
                              {point}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {card.internalLinks && (
                      <Link
                        className="text-center"
                        to={`${card.internalLinks.slug}`}
                        key={uuidv4()}
                      >
                        <button
                          className={clsx([
                            squareButtonStyles({
                              mode: 'default',
                              tone: 'default',
                            }),
                            'm-auto w-[240px] text-center',
                          ])}
                          type="button"
                        >
                          {card.internalLinks.title}
                        </button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Internal Link */}
      {internalLinks && (
        <Link
          className={`text-center ${
            displayButtonLocation === 'Bottom'
              ? 'order-3 flex pt-[10px] md:pt-10'
              : 'hidden'
          }`}
          to={`${internalLinks.slug}`}
          key={module._key}
        >
          <Button
            className={clsx([
              squareButtonStyles({mode: 'default', tone: 'default'}),
              'm-auto w-[240px] text-center',
            ])}
            type="button"
          >
            {internalLinks.title}
          </Button>
        </Link>
      )}
    </div>
  );
}

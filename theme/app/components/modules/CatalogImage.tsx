import {useMatches} from '@remix-run/react';
import {Image} from '@shopify/hydrogen';
import clsx from 'clsx';
import {useEffect, useRef, useState} from 'react';

import Modal from '~/components/global/ModalCardCatalog';
import CardCatalog from '~/components/product/CardCatalog';
import ImageGridHotspot from '~/components/product/HotspotImageGrid';
import {Catalog as CatalogType} from '~/lib/sanity/types';

import TextModule from './TextModule';

type Props = {
  module: CatalogType;
};

export default function CatalogImage({module}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // the product that is active in the modal window
  const [activeProduct, setActiveProduct] = useState(null);
  // the primary product associated with the hotspot, it will also be the active product when the modal opens
  const [primaryProduct, setPrimaryProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState(null);
  const [relatedProductsHandles, setRelatedProductsHandles] = useState(null);
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [variationsMap, setVariationsMap] = useState(null); // will come from Shopify
  const firstLoad = useRef(true);
  const fetchProductInfo = async (handle, activeOrRelated) => {
    if (activeOrRelated === 'activeProduct') {
      const response = await fetch(`/api/catalog/products/${handle}`);
      const data = await response.json();
      setVariationsMap(data.product.colorSwatches);
      setIsModalOpen(true);
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
        setRelatedProducts((prevRelatedProducts) => [
          ...(prevRelatedProducts || []),
          data[0],
        ]);
      } else {
        setRelatedProducts((prevRelatedProducts) => [
          ...(prevRelatedProducts || []),
          data.product,
        ]);
      }
    }
  };

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
      } //else if
    };
    fetchData();
  }, [relatedProductsHandles]);

  useEffect(() => {}, [isModalOpen]);

  if (!module) {
    return null;
  }
  return (
    <div className="catalog page-width w-full">
      <div
        className={clsx(
          `catalog-items-wrapper relative flex flex-row flex-wrap gap-10 lg:w-full`,
        )}
      >
        <div
          className={clsx(`catalog-item flex w-full flex-wrap`)}
          key={module._key}
        >
          <div
            className={`single-image relative w-full ${
              module.style === 'coverImage'
                ? 'coverImage'
                : module.style === 'imageWithTitleAndShopNow'
                ? 'imageWithTitleAndShopNow'
                : 'bigImageWithTitle'
            }`}
          >
            {module.textModule && (
              <div
                className={`catalogTextModule relative z-[2] w-full pb-[5px]`}
              >
                <TextModule content={module.textModule} />
              </div>
            )}
            <ImageContent module={module} />
            {/* Product hotspots */}
            {module.variant === 'productHotspots' && (
              <>
                {module.hotspots?.map((hotspot) => {
                  const id =
                    hotspot.productWithVariant.product._ref.split('-')[1];
                  firstLoad.current = true;
                  return (
                    <ImageGridHotspot
                      key={hotspot._key}
                      id={id}
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
            {module.imageText && (
              <div
                className={`catalog-item-text-container text-center ${
                  module.style === 'imageWithTitleAndShopNow'
                    ? 'mt-4 lg:mt-8'
                    : ''
                }`}
              >
                {module.style === 'coverImage' ? (
                  <h2
                    className="image-text mb-3 font-gotham text-[24px]"
                    style={{
                      color: module.colorTheme.text,
                    }}
                  >
                    {module.imageText}
                  </h2>
                ) : (
                  <p
                    className="image-text mb-2 hidden font-gotham text-sm font-bold uppercase lg:block"
                    style={{
                      color: module.colorTheme.text,
                    }}
                  >
                    {module.imageText}
                  </p>
                )}
                {module.singleFieldSubtext && (
                  <h3
                    className={`h1 image-text text-center font-gotham`}
                    style={{
                      color: module.colorTheme.text,
                    }}
                  >
                    {module.singleFieldSubtext}
                  </h3>
                )}
                {module.shopNowText && module.style !== 'coverImage' && (
                  <span
                    className={`button-link-border-b mt-4 font-gotham lg:block ${
                      module.colorTheme.text === '#ffffff'
                        ? 'accent-white'
                        : module.style === '#13294e'
                        ? 'accent-primary'
                        : ''
                    }`}
                    style={{color: module.colorTheme.text}}
                  >
                    {module.shopNowText}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
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
}

const ImageContent = ({module}: Props) => {
  /* single images have module.image.image whereas gridItem images have module.image */
  const image = module.image.image ? module.image.image : module.image;
  const imageMobile = module.imageMobile;
  const altText = module.altText;
  const [root] = useMatches();
  const sanityDataset = root.data?.sanityDataset;
  const sanityProjectID = root.data?.sanityProjectID;
  const styleSettings = module.styleSettings || {};

  // Responsive Tailwind-compatible class mapping (if you're using Tailwind utilities)
  const responsiveClasses = clsx(
    styleSettings?.padding?.sm || '',
    styleSettings?.padding?.md || '',
    styleSettings?.height || '',
  );

  return (
    <div
      className={clsx(
        'image-content page-width relative overflow-hidden duration-500 ease-out',
        responsiveClasses,
      )}
    >
      <Image
        className={clsx(
          `m-auto ${styleSettings?.objectFit || ''}`,
          imageMobile ? 'hidden md:block' : 'block',
        )}
        src={image.url}
        alt={altText}
        width={image.width}
        height={image.height}
        style={{objectFit: styleSettings?.objectFit || undefined}}
      />
      {imageMobile && (
        <Image
          className={clsx('m-auto block w-full md:hidden')}
          src={imageMobile.url}
          alt={altText}
          width={imageMobile.width}
          height={imageMobile.height}
          style={{objectFit: styleSettings?.objectFitMobile || undefined}}
        />
      )}
    </div>
  );
};

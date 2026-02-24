import {Image} from '@shopify/hydrogen';
import clsx from 'clsx';
import {useEffect, useRef, useState} from 'react';

import Modal from '~/components/global/ModalCardCatalog';
import {Link} from '~/components/Link';
import CardCatalog from '~/components/product/CardCatalog';
import ImageGridHotspot from '~/components/product/HotspotImageGrid';
import type {CatalogImageNew} from '~/lib/sanity';
import {getImageStyle} from '~/utils/styleHelpers';

import TextModule from './TextModule';

type Props = {
  module?: CatalogImageNew;
};

function useIsMobile(breakpoint = 767) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

export default function CatalogImageNew({module}: Props) {
  const isMobile = useIsMobile();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);
  const [primaryProduct, setPrimaryProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState(null);
  const [relatedProductsHandles, setRelatedProductsHandles] = useState(null);
  const [variationsMap, setVariationsMap] = useState(null);
  const [activeHotspot, setActiveHotspot] = useState(null);
  const firstLoad = useRef(true);

  // fetch product info for product hotspots (if any)
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

  if (!module) return null;
  const {
    image,
    imageMobile,
    altText,
    textAbove,
    textOverlay,
    textBelow,
    overlayPositionDesktop,
    overlayPositionMobile,
    overlaySnap,
    overlayAlignment,
    variant,
    hotspots,
    internalLink,
    styleDesktop,
    styleMobile,
  } = module;

  const overlayPos = isMobile ? overlayPositionMobile : overlayPositionDesktop;

  const overlayStyle = !overlaySnap
    ? {
        position: 'absolute' as const,
        left: `${overlayPos?.x ?? 50}%`,
        top: `${overlayPos?.y ?? 50}%`,
        transform: 'translate(-50%, -50%)',
      }
    : {};

  const snapToClass = (snap: string) => {
    const [vertical, horizontal] = snap.split('-');
    return clsx(
      'absolute',
      vertical === 'top' && 'top-0',
      vertical === 'center' && 'top-1/2 -translate-y-1/2',
      vertical === 'bottom' && 'bottom-0',
      horizontal === 'left' && 'left-0',
      horizontal === 'center' && 'left-1/2 -translate-x-1/2',
      horizontal === 'right' && 'right-0',
    );
  };

  let imageContent = (
    <div className="relative overflow-hidden">
      {/* Desktop Image */}
      <Image
        className={clsx('w-full', imageMobile ? 'hidden md:block' : 'block')}
        src={image?.url}
        alt={altText}
        width={image?.width}
        height={image?.height}
        style={getImageStyle(styleDesktop)}
      />

      {/* Mobile Image */}
      {imageMobile && (
        <Image
          className="block w-full md:hidden"
          src={imageMobile?.url}
          alt={altText}
          width={imageMobile?.width}
          height={imageMobile?.height}
          style={getImageStyle(styleMobile)}
        />
      )}

      {/* Overlay Text */}
      {textOverlay && (
        <div
          className={clsx(
            'z-5',
            overlaySnap ? snapToClass(overlaySnap) : '',
            overlayAlignment === 'left' && 'text-left',
            overlayAlignment === 'center' && 'text-center',
            overlayAlignment === 'right' && 'text-right',
          )}
          style={overlayStyle}
        >
          <TextModule content={textOverlay} />
        </div>
      )}
    </div>
  );

  if (variant === 'internalLink' && internalLink?.slug) {
    imageContent = (
      <Link to={internalLink.slug} className="pointer-events-auto">
        {imageContent}
      </Link>
    );
  }

  return (
    <div className="image-with-text-overlay relative w-full">
      {/* Top Text */}
      {textAbove && (
        <div className="text-above">
          <TextModule content={textAbove} />
        </div>
      )}

      {/* Product Hotspots */}
      {variant === 'productHotspots' &&
        hotspots?.map((hotspot) => {
          const id = hotspot.productWithVariant.product._ref.split('-')[1];
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

      {/* Image Section */}
      {imageContent}

      {/* Bottom Text */}
      {textBelow && (
        <div className="text-below">
          {/* <PortableText value={textBelow} components={components}/> */}
          <TextModule content={textBelow} />
        </div>
      )}
      {isModalOpen && variationsMap && activeProduct && (
        <Modal
          isModalOpen={isModalOpen}
          closeModal={() => setIsModalOpen(false)}
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

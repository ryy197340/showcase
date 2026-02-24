import {ProductVariant} from '@shopify/hydrogen/storefront-api-types';
import {ReactNode, useEffect, useMemo, useState} from 'react';
import {useContext} from 'react';

import PortableText from '~/components/portableText/PortableText';
import type {SanityProductPage} from '~/lib/sanity';
import {ASTMetafieldNode} from '~/lib/sanity/types';
import {normalizeProductLink} from '~/lib/xgen/utils/normalizeProductLink';
import {PodDataContext} from '~/routes/($lang).products.$handle';
import type {ProductWithNodes} from '~/types/shopify';

import Link from '../elements/Link';
import LocalizedA from '../global/LocalizedA';

type Props = {
  storefrontProduct: ProductWithNodes & {
    details?: {value?: string};
    designedToFit?: {value?: string};
    pairWithTxt?: {value?: string};
    viewMore?: {
      references: {
        nodes: Array<{
          handle?: string;
          breadcrumbDisplayTitle?: {value?: string};
        }>;
      };
    };
  };
  selectedVariant?: ProductVariant;
  sanityProduct?: SanityProductPage;
};

const renderNode = (
  node: ASTMetafieldNode,
  index: number,
  parentListType?: string,
): JSX.Element => {
  let children: ReactNode = undefined;

  if (node.children) {
    children = node.children.map((child, i) =>
      renderNode(
        child,
        i,
        node.type === 'list' ? node.listType : parentListType,
      ),
    ) as ReactNode;
  }

  switch (node.type) {
    case 'root':
      return <>{children}</>;
    case 'paragraph':
      return <p key={index}>{children}</p>;
    case 'text':
      return (
        <span
          key={index}
          style={{
            fontWeight: node.bold ? 'bold' : 'normal',
            fontStyle: node.italic ? 'italic' : 'normal',
          }}
        >
          {node.value}
        </span>
      );
    case 'list': {
      const ListTag = node.listType === 'ordered' ? 'ol' : 'ul';
      return <ListTag key={index}>{children}</ListTag>;
    }
    case 'list-item':
      return (
        <li
          key={index}
          className={
            parentListType === 'unordered'
              ? 'ml-[14px] list-disc leading-[18px]'
              : 'ml-[14px] list-decimal leading-[18px]'
          }
        >
          {children}
        </li>
      );
    case 'link':
      return (
        <LocalizedA
          key={index}
          href={node.url}
          title={node.title}
          target={node.target}
        >
          {children}
        </LocalizedA>
      );
    case 'heading': {
      const HeadingTag: React.FC<{children: ReactNode}> =
        `h${node.level}` as any;
      return <HeadingTag key={index}>{children}</HeadingTag>;
    }
    default:
      return <></>;
  }
};

const TabbedContent: React.FC<Props> = ({storefrontProduct, sanityProduct}) => {
  const {descriptionHtml, shortDescription} = storefrontProduct;
  const {shop, completeTheLookData} = useContext(PodDataContext);
  const designed_to_fit = storefrontProduct.designedToFit?.value
    ? JSON.parse(storefrontProduct.designedToFit.value)
    : null;
  const [pairWithText, setPairWithText] = useState<string>('');

  // Get breadcrumbs from view_more_pdp_details_tab metafield
  const getBreadcrumbs = (
    breadcrumbNodes: Array<{
      handle?: string;
      breadcrumbDisplayTitle?: {value?: string};
    }> = [],
  ): Array<{handle: string; displayTitle: string}> => {
    if (!Array.isArray(breadcrumbNodes)) return [];

    return breadcrumbNodes
      .map((node) => {
        const handle = node?.handle?.trim?.();
        const displayTitle = node?.breadcrumbDisplayTitle?.value?.trim?.();

        if (handle || displayTitle) {
          return {handle: handle || '', displayTitle: displayTitle || ''};
        }
        return null;
      })
      .filter((item): item is {handle: string; displayTitle: string} =>
        Boolean(item),
      );
  };

  const viewMoreNodesArray =
    storefrontProduct?.viewMore?.references?.nodes || [];
  const breadcrumbs = getBreadcrumbs(viewMoreNodesArray);

  const pairWithTextMemo = useMemo(() => {
    const pairProducts = completeTheLookData?.items?.slice(0, 3);

    if (!pairProducts || pairProducts.length === 0) {
      return '';
    }

    const productLinks = pairProducts.map((pair) => {
      return `<a rel="noopener" href="${normalizeProductLink(
        pair.link,
      )}" title="${pair.prod_name}" target="_blank" class="underline">${
        pair.prod_name
      }</a>`;
    });

    let sentence = shop?.shop?.pairWithText?.value || 'Pair with the '; // Default text is 'Pair with'

    if (productLinks.length === 1) {
      sentence += productLinks[0] + '.';
    } else if (productLinks.length === 2) {
      sentence += productLinks.join(' and ') + '.';
    } else {
      const lastLink = productLinks.pop();
      sentence += productLinks.join(', ') + ', and ' + lastLink + '.';
    }

    return `<p style="padding-top:10px;">${sentence}</p>`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completeTheLookData]);

  useEffect(() => {
    setPairWithText(pairWithTextMemo);
  }, [pairWithTextMemo]);

  return (
    <div className="border-b border-gray pb-6">
      {sanityProduct?.body && (
        <PortableText
          blocks={sanityProduct.body}
          className="pb-3 leading-[18px]"
        />
      )}

      <div className="flex flex-col gap-y-6 py-4 text-[12px]">
        {descriptionHtml && (
          <div className="border-b border-gray py-[18px]">
            <div className="pb-4 text-xs font-bold uppercase tracking-[1px]">
              Description
            </div>
            <p
              className="text-[12px] leading-[18px]"
              dangerouslySetInnerHTML={{
                __html: `${descriptionHtml} ${pairWithText}`,
              }}
            ></p>
          </div>
        )}

        {shortDescription && (
          <div>
            <div className="pb-4 text-xs font-bold uppercase tracking-[1px]">
              Details
            </div>
            <p
              className="leading-[18px]"
              dangerouslySetInnerHTML={{__html: shortDescription.value}}
            ></p>
          </div>
        )}

        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="pr-[4px] text-xs font-bold uppercase">
              View More
            </span>
            {breadcrumbs.map(({handle, displayTitle}, index) => (
              <span
                key={handle || index}
                className="flex items-center gap-1 underline"
              >
                <LocalizedA href={`/collections/${handle}`}>
                  <span>{displayTitle || handle}</span>
                </LocalizedA>
                {index < breadcrumbs.length - 1 && <span>|</span>}
              </span>
            ))}
          </div>
        )}

        {designed_to_fit && (
          <div>
            <div className="pb-4 text-xs font-bold uppercase tracking-[1px]">
              Designed to Fit
            </div>
            <div>{renderNode(designed_to_fit, 0)}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TabbedContent;

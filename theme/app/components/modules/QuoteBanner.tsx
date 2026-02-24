import {useMemo} from 'react';

import {ModuleQuoteBanner} from '~/lib/sanity';

import {Link} from '../../components/Link';
type Props = {
  module: ModuleQuoteBanner;
};

type CustomStyles = {
  fontStyle?: string;
  fontWeight?: string;
  color?: string;
};

export default function QuoteBanner({module}: Props) {
  const {richText, quoteLink} = module;
  const {children, markDefs} = richText;
  const renderedChildren = useMemo(() => {
    const renderChildren = () => {
      if (!children || !markDefs) {
        // Handle the case where children or markDefs are not available
        return null;
      }
      return children.map((child) => {
        if (!child || !child._type) {
          // Handle the case where child or child._type is not available
          return null;
        }
        const ChildType = child._type;
        const marks = child.marks;
        const styles: CustomStyles = {};
        if (marks) {
          marks.forEach((mark) => {
            if (mark === 'em') {
              styles.fontStyle = 'italic';
            } else if (mark === 'strong') {
              styles.fontWeight = 'bold';
            } else {
              const color = markDefs?.find(
                (i) => i._key === mark && i._type === 'color',
              );
              if (color) styles.color = color.hex as string;
            }
          });
        }
        const tag: React.ReactNode = (
          <ChildType key={child._key} style={styles}>
            {child.text}
          </ChildType>
        );
        return tag;
      });
    };
    return renderChildren();
  }, [children, markDefs]);

  const quoteBanner = (
    <>
      {renderedChildren && renderedChildren.length > 0 && (
        <div className="page-width mb-[30px] whitespace-pre-wrap border-l-2 border-lightGray px-5 font-hoefler text-[28px] leading-[40px] lg:px-10 lg:text-[34px]">
          {renderedChildren}
        </div>
      )}
    </>
  );

  if (quoteLink?.slug) {
    return (
      <Link to={quoteLink.slug} prefetch="intent">
        {quoteBanner}
      </Link>
    );
  } else {
    return quoteBanner;
  }
}

import {Color, VerticalOrientation} from '~/lib/sanity/types';

export const slideTextColor = (textColor: Color) =>
  textColor.hex ? textColor.hex : '132943';

export const TextElement: React.FC<{
  color: string;
  className: string;
  children: React.ReactNode;
  h1?: boolean;
}> = ({color, className, children, h1}) => {
  const Tag = h1 === true ? 'h1' : 'div';
  return (
    <Tag className={className} style={{color}}>
      {children}
    </Tag>
  );
};

export const getTextAlignClass = (verticalOrientation: VerticalOrientation) => {
  const orientationClassMap = {
    top: 'start',
    middle: 'center',
    bottom: 'end',
  };
  return orientationClassMap[verticalOrientation] || 'center';
};

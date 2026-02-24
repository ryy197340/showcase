import {useHydration} from '~/hooks/useHydration';
import {useLinkLocalizer} from '~/hooks/useLinkLocalizer';

interface LocalizedAProps extends React.HTMLProps<HTMLAnchorElement> {
  href?: string;
}

export default function LocalizedA({
  children,
  href,
  ...props
}: LocalizedAProps) {
  const localizedHref = useLinkLocalizer();
  const isHydrated = useHydration();
  const url = isHydrated ? localizedHref(href || '') : href;

  return (
    <a href={url} {...props}>
      {children}
    </a>
  );
}

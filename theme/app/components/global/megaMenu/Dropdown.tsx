import {useHydration} from '~/hooks/useHydration';

import DropdownCSR from './DropdownCSR';
import DropdownSSR from './DropdownSSR';

export default function Dropdown(props: any) {
  const isHydrated = useHydration();
  return (
    <>{isHydrated ? <DropdownCSR {...props} /> : <DropdownSSR {...props} />}</>
  );
}

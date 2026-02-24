import 'react-medium-image-zoom/dist/styles.css';

import {Image} from '@shopify/hydrogen';
import Zoom from 'react-medium-image-zoom';

type Props = {
  zoomImageUrl?: string;
};

export default function ZoomImg({zoomImageUrl}: Props) {
  return (
    <Zoom>
      <Image src={zoomImageUrl} width="500" />
    </Zoom>
  );
}

import {MediaFile} from '@shopify/hydrogen';
import {
  ExternalVideo,
  MediaImage,
  Model3d,
  Video,
} from '@shopify/hydrogen/storefront-api-types';
import clsx from 'clsx';

import {TYPE_NAME_MAP} from '~/lib/utils';

type Props = {
  med: MediaImage | ExternalVideo | Model3d | Video;
  index: number;
  openModal: (image: MediaImage) => void;
  mediaLength: number;
};

const MediaItem = ({med, index, openModal, mediaLength}: Props) => {
  let extraProps = {};

  if (med.mediaContentType === 'MODEL_3D') {
    extraProps = {
      interactionPromptThreshold: '0',
      ar: true,
      loading: index > 0 ? 'lazy' : 'eager',
      disableZoom: true,
      style: {height: '100%', margin: '0 auto'},
    };
  }

  const data = {
    ...med,
    __typename: TYPE_NAME_MAP[med.mediaContentType] || TYPE_NAME_MAP['IMAGE'],
    image: {
      ...med.image,
      altText: med.alt || 'Product image',
    },
  } as MediaImage;

  return (
    <div className="relative w-full flex-shrink-0 flex-grow-0 select-none object-contain lg:object-cover">
      <div className="relative">
        <MediaFile
          className={clsx(
            `lg:embla__slide relative flex max-h-[300px] max-w-full shrink-0 grow-0 select-none object-contain sm:max-h-[562px] ${
              mediaLength > 1 ? 'w-full-40 md:w-1/4' : 'w-full'
            }`,
          )}
          data={data}
          draggable={false}
          key={med.id}
          tabIndex={0}
          mediaOptions={{
            image: {
              crop: 'center',
              sizes: '100%',
              loading: index > 0 ? 'lazy' : 'eager',
            },
          }}
          {...extraProps}
          onClick={() => openModal(data)}
          style={{
            width: '100%',
          }}
        />
      </div>
    </div>
  );
};

export default MediaItem;

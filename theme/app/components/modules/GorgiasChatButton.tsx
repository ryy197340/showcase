import {GorgiasChatButton as GorgiasChatButtonType} from '~/lib/sanity';

import ChatBubbles from '../icons/ChatBubbles';

type Props = {
  module?: GorgiasChatButtonType;
  customClasses?: string;
  dimensions?: {
    width: number;
    height: number;
  };
};

const DEFAULT_ICON_CLASSES = 'page-width px-10 md:px-20 gap-1';
const ICON_BASE_CLASSES = 'flex flex-row w-full text-xs text-primary ';
const DEFAULT_CONTAINER_CLASSES = 'h-6 w-6';
const CONTAINER_BASE_CLASSES = 'flex flex-row justify-center items-center ';
export default function GorgiasChatButton({
  module,
  customClasses,
  dimensions,
}: Props) {
  const iconClasses = customClasses
    ? ICON_BASE_CLASSES + customClasses
    : ICON_BASE_CLASSES + DEFAULT_ICON_CLASSES;
  const containerClasses = dimensions
    ? CONTAINER_BASE_CLASSES
    : DEFAULT_CONTAINER_CLASSES;
  return (
    <div className={iconClasses} key="calloutButton">
      <div
        className={containerClasses}
        style={
          dimensions
            ? {height: `${dimensions.height}px`, width: `${dimensions.width}px`}
            : {}
        }
      >
        <ChatBubbles />
      </div>
      <button onClick={() => GorgiasChat.open()}>Live Chat</button>
    </div>
  );
}

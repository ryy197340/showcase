import {createElement, useEffect} from 'react';
import {useState} from 'react';
import {useLocation} from 'react-router-dom'; // Import useLocation

import {jsonToHtml} from '~/lib/utils';

type Props = {
  wPromoteContent: {
    heading?: string;
    heading_no?: 'H2' | 'H3' | 'H4';
    initial_content: string;
    read_more_text?: string;
    read_less_text?: string;
    hidden_content: string;
  };
};

export default function WPromoteContent({wPromoteContent}: Props) {
  const {
    heading,
    heading_no,
    initial_content,
    read_more_text,
    read_less_text,
    hidden_content,
  } = wPromoteContent;

  const location = useLocation(); // Hook to get current URL

  const HeadingComponent = heading_no?.toLowerCase() || 'h3';
  const readMoreText = read_more_text || 'Read More';
  const readLessText = read_less_text || 'Read Less';
  const [isExpanded, setIsExpanded] = useState(false);

  // Reset isExpanded when the URL changes
  useEffect(() => {
    setIsExpanded(false);
  }, [location.pathname]);

  const toggleContent = () => {
    setIsExpanded(!isExpanded);
  };
  const toggleText = isExpanded ? readLessText : readMoreText;

  return (
    <div className="flex flex-col items-start justify-start gap-[10px] px-5 py-15">
      {heading &&
        createElement(
          HeadingComponent,
          {
            className:
              'flex cursor-default flex-col p-0 font-gotham text-[16px] font-semibold uppercase tracking-[1.2px]',
          },
          heading,
        )}
      {initial_content && (
        <div
          dangerouslySetInnerHTML={{__html: jsonToHtml(initial_content)}}
          className="flex flex-col gap-[14px]"
        />
      )}
      <div
        dangerouslySetInnerHTML={{__html: jsonToHtml(hidden_content)}}
        className={`flex flex-col gap-[10px] ${
          isExpanded && hidden_content ? 'visible' : 'invisible h-[10px]'
        }`}
      />
      {hidden_content && (
        <button
          onClick={toggleContent}
          className="font-gotham text-xs font-semibold uppercase tracking-[1.2px] underline"
        >
          {toggleText ? toggleText : 'Show/Hide'}
        </button>
      )}
    </div>
  );
}

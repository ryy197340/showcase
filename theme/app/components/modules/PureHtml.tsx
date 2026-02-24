import {useCallback, useEffect} from 'react';
import {useInView} from 'react-intersection-observer';

type Props = {
  html: string;
};

const PureHtml = ({html}: Props) => {
  const {ref, inView, entry} = useInView({
    triggerOnce: true,
    threshold: 0,
    rootMargin: '422px 0px',
  });

  const intersectionObserverCb = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      if (!entry.isIntersecting) {
        return;
      }

      const target = entry.target as HTMLDivElement;

      const videos = target.querySelectorAll(
        'video[data-src]',
      ) as NodeListOf<HTMLVideoElement>;
      if (videos.length > 0) {
        videos.forEach((video) => {
          video.src = video.dataset.src || '';
          video.removeAttribute('data-src');
        });
      }

      const images = target.querySelectorAll(
        'img[data-src]',
      ) as NodeListOf<HTMLImageElement>;
      if (images.length > 0) {
        images.forEach((img) => {
          img.src = img.dataset.src || '';
          img.removeAttribute('data-src');

          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
            img.removeAttribute('data-srcset');
          }
        });
      }

      const sources = target.querySelectorAll(
        'source[data-srcset]',
      ) as NodeListOf<HTMLSourceElement>;
      if (sources.length > 0) {
        sources.forEach((source) => {
          if (source.dataset.srcset) {
            source.srcset = source.dataset.srcset;
            source.removeAttribute('data-srcset');
          }
        });
      }

      const elementsWithBgImageRemoved = target.querySelectorAll(
        '[data-has-bg-image]',
      ) as NodeListOf<HTMLElement>;
      if (elementsWithBgImageRemoved.length > 0) {
        elementsWithBgImageRemoved.forEach((element) => {
          element.classList.remove('hidden');
        });
      }
    },
    [],
  );

  useEffect(() => {
    if (inView && entry) {
      intersectionObserverCb([entry]);
    }
  }, [inView, entry, intersectionObserverCb]);

  return (
    <div
      ref={ref}
      dangerouslySetInnerHTML={{
        __html: html,
      }}
    />
  );
};

export default PureHtml;

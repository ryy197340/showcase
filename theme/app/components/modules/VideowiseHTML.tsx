import clsx from 'clsx';
import {useEffect, useRef, useState} from 'react';

import {VideowiseHTML as VideowiseHTMLType} from '~/lib/sanity';
import {hexToRgba} from '~/utils/styleHelpers';

type Props = {
  module: VideowiseHTMLType;
};

export default function VideowiseHTMLModule({module}: Props) {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const textColor = hexToRgba(module.buttonTheming?.text);
  const backgroundColor = hexToRgba(module.buttonTheming?.background);

  useEffect(() => {
    // Determine which HTML to use
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const hasMobile = !!module.mobileHTML;
    const hasDesktop = !!module.html;

    let htmlToUse: string | null = null;

    if (hasMobile && hasDesktop) {
      htmlToUse = isMobile ? module.mobileHTML : module.html;
    } else if (hasDesktop) {
      htmlToUse = module.html;
    } else if (hasMobile) {
      htmlToUse = module.mobileHTML;
    }

    if (!htmlToUse) return;

    // Extract <video> src from the chosen HTML
    const temp = document.createElement('div');
    temp.innerHTML = htmlToUse;
    const videoEl = temp.querySelector('video');

    if (videoEl?.src) setVideoSrc(videoEl.src);
  }, [module.html, module.mobileHTML]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  if (!videoSrc) return null;

  return (
    <div
      className="relative inline-block w-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        muted
        loop
        playsInline
        className="block w-full"
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
      />
      {/* Overlay button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
        className={clsx(
          'absolute bottom-[10px] left-[10px] z-[9999] flex h-[50px] w-[50px] cursor-pointer items-center justify-center rounded-full border-0 text-[20px] transition-opacity duration-300 ease-in-out',
          hovered ? 'opacity-100' : 'opacity-0',
        )}
        style={{
          backgroundColor,
          color: textColor,
        }}
      >
        {isPlaying ? '❚❚' : '►'}
      </button>
    </div>
  );
}

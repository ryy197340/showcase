import {useEffect} from 'react';

const LOADED_STYLESHEETS: Record<string, Promise<boolean>> = {};

type LoadStylesheetOptions = {
  id?: string;
  media?: string;
  crossOrigin?: string;
  onLoadCallback?: () => void;
};

function loadStylesheet(
  href: string,
  options?: LoadStylesheetOptions,
): Promise<boolean> {
  const isStylesheetLoaded = LOADED_STYLESHEETS[href];

  if (isStylesheetLoaded) {
    return isStylesheetLoaded;
  }

  const linkExists = document.querySelector(`link[href="${href}"]`);
  if (linkExists) {
    return Promise.resolve(true);
  }

  const promise = new Promise<boolean>((resolve, reject) => {
    const link = document.createElement('link');

    link.rel = 'stylesheet';
    link.href = href;

    if (typeof options?.id === 'string') {
      link.id = options.id;
    }

    if (typeof options?.media === 'string') {
      link.media = options.media;
    }

    if (typeof options?.crossOrigin === 'string') {
      link.crossOrigin = options.crossOrigin;
    }

    link.onload = () => {
      if (typeof options?.onLoadCallback === 'function') {
        options.onLoadCallback();
      }
      resolve(true);
    };

    link.onerror = () => {
      reject(false);
    };

    document.head.appendChild(link);
  });

  LOADED_STYLESHEETS[href] = promise;

  return promise;
}

function useCustomLoadStylesheet(url: string, options?: LoadStylesheetOptions) {
  useEffect(() => {
    async function loadStylesheetWrapper() {
      try {
        await loadStylesheet(url, options);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log(`Error loading stylesheet ${url}`, error);
      }
    }

    loadStylesheetWrapper().catch(() => {
      // eslint-disable-next-line no-console
      console.log(`Error loading stylesheet ${url}`);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export {useCustomLoadStylesheet};

// The majority of this functionality was taken from useLoadScript.
// We added the ability to pass in async and dataset attributes to the script.

import {useEffect} from 'react';

const SCRIPTS_LOADED: Record<string, Promise<boolean>> = {};

type LoadScriptOptions = {
  module?: boolean;
  async?: boolean;
  defer?: boolean;
  crossOrigin?: string;
  dataset?: Record<string, string>;
  in?: 'head' | 'body';
  onLoadCallback?: () => void;
  isAuthenticated?: boolean;
  id?: string;
  content?: string;
};

function loadScript(
  src?: string,
  options?: LoadScriptOptions,
  scriptKey?: string,
): Promise<boolean> {
  const key = src ? src : scriptKey || 'inline-script';
  const isScriptLoaded = SCRIPTS_LOADED[key];

  if (isScriptLoaded) {
    return isScriptLoaded;
  }

  const existingScript = document.querySelector(`script[src="${src}"]`);
  if (existingScript) {
    return Promise.resolve(true);
  }

  const promise = new Promise<boolean>((resolve, reject) => {
    const script = document.createElement('script');

    if (options == null ? void 0 : options.module) {
      script.type = 'module';
    } else {
      script.type = 'text/javascript';
    }

    if ((options == null ? void 0 : options.async) === true) {
      script.async = true;
    }

    if ((options == null ? void 0 : options.defer) === true) {
      script.defer = true;
    }
    // add crossOrigin
    if (options != null && options.crossOrigin) {
      script.crossOrigin = options.crossOrigin;
    }

    if (options != null && options.dataset) {
      for (const key in options.dataset) {
        script.dataset[key] = options.dataset[key];
      }
    }

    if (options != null && options.id) {
      script.id = options.id;
    }

    if (src) script.src = src;

    if (options && options.content) script.textContent = options.content;

    script.onload = () => {
      if (options) options.onLoadCallback?.();
      resolve(true);
    };

    script.onerror = () => {
      reject(false);
    };

    if ((options == null ? void 0 : options.in) === 'head') {
      document.head.appendChild(script);
    } else {
      document.body.appendChild(script);
    }
  });

  if (key) SCRIPTS_LOADED[key] = promise;

  return promise;
}

function useCustomLoadScript(
  url?: string,
  options?: LoadScriptOptions,
  scriptKey?: string,
) {
  useEffect(() => {
    async function loadScriptWrapper() {
      try {
        await loadScript(url, options, scriptKey);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log(`Error loading ${url}`, error);
      }
    }

    loadScriptWrapper().catch(() => {
      // eslint-disable-next-line no-console
      console.log(`Error loading ${url}`);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export {useCustomLoadScript};

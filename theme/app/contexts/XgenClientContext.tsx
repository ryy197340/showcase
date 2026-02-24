import XGenClient, {LocalCookieAuthStore} from '@xgenai/sdk-core';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {useHydration} from '~/hooks/useHydration';
import {XgenConfigType} from '~/lib/xgen/types';
import formatLocale from '~/lib/xgen/utils/formatLocale';
import {XgenIds} from '~/root';
import {createDebugFetch} from '~/utils/xgen';

type XgenClientProviderProps = {
  config: XgenConfigType & XgenIds;
  children: React.ReactNode;
};

type XgenClientContextType = {
  client: XGenClient | null;
};

export const XgenClientContext = createContext<XgenClientContextType>({
  client: null,
});

export const XgenClientProviderCSR: React.FC<XgenClientProviderProps> = ({
  config,
  children,
}) => {
  const [client, setClient] = useState<XGenClient | null>(null);

  useEffect(() => {
    try {
      // Create a client-specific debug fetch
      const clientDebugFetch = createDebugFetch();
      const authStore = new LocalCookieAuthStore({
        cookieOptions: {
          domain: config.domain ?? '.jmclaughlin.com',
        },
      });

      setClient(
        new XGenClient({
          ...config,
          locale: formatLocale(config?.locale),
          fetchFunc: clientDebugFetch as typeof fetch,
          authStore,
        }),
      );
    } catch (err) {
      console.error('Failed to initialize XgenClient:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contextValue = {
    client,
  };

  return (
    <XgenClientContext.Provider value={contextValue}>
      {children}
    </XgenClientContext.Provider>
  );
};

export function useXgenClient() {
  const context = useContext(XgenClientContext);
  if (!context) {
    throw new Error('useXgenClient must be used within an XgenClientProvider');
  }
  return context.client;
}

export function useXgenClientWhenReady() {
  const client = useXgenClient();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(!!client);
  }, [client]);

  return {client, isReady};
}

export function XgenClientProvider(props: XgenClientProviderProps) {
  return <XgenClientProviderCSR {...props} />;
}

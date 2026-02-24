import {stegaClean} from '@sanity/client/stega';
import {RecommendProduct} from '@xgenai/sdk-core/dist/types/recommend';
import {useCallback, useContext, useEffect, useRef, useState} from 'react';

import {RecommendationsResultsSlider} from '~/components/global/RecommendationsResultsSlider';
import {useXgenClient} from '~/contexts/XgenClientContext';
import {useHydration} from '~/hooks/useHydration';
import useTrackElementInteractions from '~/hooks/useTrackElementInteractions';
import {PodSlider as PodSliderType} from '~/lib/sanity';
import {getPodBySanityId} from '~/lib/xgen/utils/getPodById';
import {
  clearAllPodIdMappings,
  getAllPodIdMappings,
  getPodIdMapping,
  POD_STORAGE_CHANGE_EVENT,
  POD_STORAGE_KEY,
  setPodIdMapping,
} from '~/lib/xgen/utils/podIdMapping';
import {PodDataContext} from '~/routes/($lang).products.$handle';
import {loadStatuses} from '~/utils/constants';

declare global {
  interface Window {
    __xgen: {
      setPodIdMapping: typeof setPodIdMapping;
      getPodIdMapping: typeof getPodIdMapping;
      clearAllPodIdMappings: typeof clearAllPodIdMappings;
    };
  }
}

type Props = {
  module: PodSliderType;
  isCart?: boolean;
  cartIsEmpty?: boolean;
  fallbackPodId?: string;
};

function PodSliderCSR({module, isCart, cartIsEmpty, fallbackPodId}: Props) {
  const xgenClient = useXgenClient();
  const {pod, heading, displayOptions} = module;
  const [xgenPodId, setXgenPodId] = useState<string | null>(null);
  const prevXgenPodId = useRef<string | null>(null);

  // pod mappings as defined in the local storage for testing purposes
  const [localPodIdMap, setLocalPodIdMap] = useState<Record<string, string>>(
    {} as Record<string, string>,
  );

  const [state, setState] = useState({
    id: null as string | null,
    title: null as string | null,
    error: {} as any,
    fullResponse: {} as any,
    loading: loadStatuses.STALE,
    recommendations: [] as RecommendProduct[],
    resultId: null as string | null,
    numResults: null as number | null,
  });

  const modulePodId = pod?.podId;

  // Helper function to get mapped pod ID from local storage
  const getLocalMappedPodId = useCallback(
    (podId: string, fallbackId?: string): string | null => {
      const mappedId = localPodIdMap[podId];
      if (mappedId) {
        return mappedId;
      }
      return fallbackId || null;
    },
    [localPodIdMap],
  );

  // Some pods can only be tested on production so we'll offer a fallback for
  // setting the pods directly in the browser for testing purposes.
  // Flow:
  // - modulePodId is the requested pod ID from the module
  // - fallbackPodId is the pod ID (optional) to use if the modulePodId is not found
  // - xgenPodId is the pod ID to use for the request to the xgen API
  // - if modulePodId is undefined, we'll use the fallbackPodId (if available)
  // - if modulePodId is not found in the mapping, we'll check the SANITY_XGEN_PODS_MAP
  // - if modulePodId is found in the mapping, we'll use the mapped pod ID

  useEffect(() => {
    try {
      const stored = getAllPodIdMappings();
      setLocalPodIdMap(stored);
    } catch (error) {
      console.warn('Failed to parse pod ID mapping from localStorage:', error);
    }
  }, []);

  // Apply helper functions to the window object only when debug mode is enabled
  useEffect(() => {
    // Check for debug query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const isDebugMode = !!urlParams.get('xgen-debug');

    if (isDebugMode) {
      Object.assign((window.__xgen = window.__xgen || {}), {
        setPodIdMapping,
        getPodIdMapping,
        clearAllPodIdMappings,
      });
    }
  }, []);

  // Listen for localStorage changes to keep podIdMap in sync
  useEffect(() => {
    const handleCustomStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.key === POD_STORAGE_KEY) {
        try {
          const stored = getAllPodIdMappings();
          setLocalPodIdMap(stored);
        } catch (error) {
          console.warn(
            'Failed to parse pod ID mapping from localStorage:',
            error,
          );
        }
      }
    };

    window.addEventListener(
      POD_STORAGE_CHANGE_EVENT,
      handleCustomStorageChange,
    );

    return () => {
      window.removeEventListener(
        POD_STORAGE_CHANGE_EVENT,
        handleCustomStorageChange,
      );
    };
  }, []);

  useEffect(() => {
    if (modulePodId) {
      let _xgenPodId = null;
      // First check local storage for a mapping
      _xgenPodId = getLocalMappedPodId(modulePodId);

      // If no mapping is found, check the SANITY_XGEN_PODS_MAP
      if (!_xgenPodId) {
        _xgenPodId = getPodBySanityId(modulePodId)?.id || null;
      }

      // If no Sanity mapping is found, use the original modulePodId as-is
      if (!_xgenPodId) {
        _xgenPodId = modulePodId;
      }

      setXgenPodId(_xgenPodId);
    }
  }, [modulePodId, getLocalMappedPodId]);

  const fetchPodData = async () => {
    setState((prevState) => ({...prevState, loading: loadStatuses.LOADING}));

    if (!modulePodId || !xgenPodId) {
      return;
    }

    try {
      const responseXgen = await xgenClient?.recommend.getResults({
        elementIds: [xgenPodId],
        options: {
          context: {
            filterCategory: pod?.categoryID,
          },
        },
      });

      // Use the mapped podId to get recommendations, but fallback to original if needed
      const recommendationsItems = responseXgen?.[xgenPodId]?.items || [];

      setState({
        ...state,
        id: xgenPodId,
        title: responseXgen?.[xgenPodId]?.title || null,
        fullResponse: responseXgen,
        loading: loadStatuses.SUCCESS,
        recommendations: recommendationsItems,
        numResults: recommendationsItems.length,
      });
    } catch (error) {
      console.error('error', error);
      setState((prevState) => ({
        ...prevState,
        loading: loadStatuses.FAILED,
        error,
      }));
    }
  };

  // todo: check for presence of PDP context
  const cioFamilyTag = useContext(PodDataContext)?.cioFamilyTag ?? '';

  useEffect(() => {
    // Only fetch if the xgenPodId actually changed
    if (xgenPodId !== prevXgenPodId.current) {
      prevXgenPodId.current = xgenPodId;

      // XGEN client might be null.
      if (xgenPodId && xgenClient?.recommend) {
        fetchPodData();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xgenPodId]);

  const elementId = state.id || '';
  const itemsCodes = state.recommendations?.map((item) => item.prod_code) || [];

  const {ref} = useTrackElementInteractions({
    elementId,
    items: itemsCodes,
    enabled: elementId.length > 0,
    threshold: 0,
    click: {
      once: false,
      extract: {selector: '[data-item]', attr: 'data-item'},
    },
  });

  // No pod ID or no recommendations
  if (!xgenPodId || state.recommendations.length === 0 || !state.id) {
    console.warn(
      `Unable to render pod for ${modulePodId}: ${
        !xgenPodId ? 'No XGEN pod ID.' : 'No product data.'
      }`,
    );
    return null;
  }

  return (
    <div
      className={`relative${cioFamilyTag ? ' px-5 md:px-0' : ''} mt-10`}
      data-podid={state.id}
    >
      {state.id && (
        <h2
          className={`font-normal text-base font-primary block min-h-10 text-${stegaClean(
            heading.mobileAlignment,
          )} text-xl md:text-${stegaClean(
            heading.desktopAlignment,
          )} md:text-2xl`}
        >
          {state.title}
        </h2>
      )}
      {state.loading !== loadStatuses.SUCCESS && (
        <div className="absolute left-0 top-0 flex flex-col gap-4 pt-4">
          {state.loading === loadStatuses.LOADING && <p>Loading...</p>}
          {state.loading === loadStatuses.FAILED && (
            <p>There was an error: {state.error.message}</p>
          )}
          {state.loading === loadStatuses.FAILED &&
            state.error.message.includes('item_id: field required') && (
              <p>
                If the pod recommendation is of strategy alternative,
                complementary, or bundles, it can only be used on a product
                detail page.
              </p>
            )}
        </div>
      )}
      <div className="recommendations-slider" ref={ref}>
        <RecommendationsResultsSlider
          items={state.recommendations || []}
          dataAttributes={{
            dataXgenPodId: state.id,
            dataXgenNumResults: state.numResults || 0,
          }}
          displayOptions={displayOptions}
        />
      </div>
    </div>
  );
}

export default function PodSlider(props: any) {
  const isHydrated = useHydration();
  return <>{isHydrated ? <PodSliderCSR {...props} /> : null}</>;
}

import {
  RecommendGetResultsReturn,
  RecommendProduct,
} from '@xgenai/sdk-core/dist/types/recommend';
import clsx from 'clsx';
import {useEffect, useState} from 'react';

import {useXgenClient} from '~/contexts/XgenClientContext';
import {useInitialRecommendations} from '~/hooks/useInitialRecommendations';
import {useColorTheme} from '~/lib/theme';
import {getPodBySanityId} from '~/lib/xgen/utils/getPodById';
import {loadStatuses} from '~/utils/constants';

import {RecommendationsResults} from '../global/RecommendationsResults';

export default function BestSellers({
  fallbackPodId,
  pod,
  itemIDs,
  isRestingSearch,
}: {
  isRestingSearch?: boolean;
  fallbackPodId?: string;
  pod?: any;
  itemIDs?: string;
}) {
  const colorTheme = useColorTheme();
  const xgenClient = useXgenClient();
  const initialRecommendations = useInitialRecommendations();
  const [loading, setLoading] = useState(loadStatuses.STALE);
  const [recommendations, setRecommendations] = useState<RecommendProduct[]>(
    initialRecommendations || [],
  );
  const [xgenResponse, setXgenResponse] =
    useState<RecommendGetResultsReturn | null>(null);

  const xgenPod = getPodBySanityId(pod?.pod?.podId ?? fallbackPodId);
  const podId = xgenPod?.id || fallbackPodId;

  // Pod is an optional prop so we'll resort to the initialRecommendations
  // if no pod is provided
  useEffect(() => {
    if (initialRecommendations?.length && !pod) {
      setLoading(loadStatuses.SUCCESS);
    }
  }, [initialRecommendations, pod]);

  useEffect(() => {
    // If no pod or podId, don't fetch recommendations
    if (!podId) {
      return;
    }
    const fetchRecommendationsFromAPI = async () => {
      setLoading(loadStatuses.LOADING);
      try {
        const responseXgen = await xgenClient?.recommend.getResults({
          elementIds: [podId],
        });
        const recommendationsItems =
          responseXgen?.[podId]?.items ?? initialRecommendations ?? [];

        setXgenResponse(responseXgen ?? null);
        setRecommendations(recommendationsItems);
        setLoading(loadStatuses.SUCCESS);
      } catch (error) {
        setRecommendations([]);
        setLoading(loadStatuses.SUCCESS);
      }
    };
    fetchRecommendationsFromAPI();
  }, [xgenClient, podId, initialRecommendations]);

  if (!xgenResponse) {
    return null;
  }

  const podName = xgenResponse[podId!]?.title;
  return (
    <div
      className={`${!isRestingSearch ? 'py-9' : 'w-full'}`}
      style={{background: colorTheme?.background || 'white'}}
    >
      {loading === loadStatuses.SUCCESS && (
        <div>
          {!isRestingSearch && (
            <span
              className={clsx('font-normal text-base mb-4 block font-bold')}
            >
              {podName}
            </span>
          )}
          <RecommendationsResults
            items={recommendations.slice(0, 4)}
            isRestingSearch={!!isRestingSearch}
          />
        </div>
      )}
    </div>
  );
}

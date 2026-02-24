import clsx from 'clsx';
import {useContext, useEffect, useState} from 'react';

import useTrackElementInteractions from '~/hooks/useTrackElementInteractions';
import {useColorTheme} from '~/lib/theme';
import {SANITY_XGEN_PODS_MAP} from '~/lib/xgen/constants';
import {
  XGenRecommendationResult,
  XGenRecommendationResultItem,
} from '~/lib/xgen/types';
import {PodDataContext} from '~/routes/($lang).products.$handle';

import {RecommendationsResultsSlider} from '../global/RecommendationsResultsSlider';

const VISIBLE_PODS = [
  SANITY_XGEN_PODS_MAP['product-detail-page-2'],
  SANITY_XGEN_PODS_MAP['product-detail-page-3'],
  SANITY_XGEN_PODS_MAP['product-detail-page-4'],
];

export default function BestSellers() {
  const {
    isLoading,
    error,
    recommendationsData,
  }: {
    isLoading: boolean;
    error: string | null;
    recommendationsData: XGenRecommendationResult;
  } = useContext(PodDataContext);
  const colorTheme = useColorTheme();

  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [podId, setPodId] = useState<string | null>(null);
  const [podData, setPodData] = useState<XGenRecommendationResultItem[]>([]);

  useEffect(() => {
    if (recommendationsData) {
      const data = VISIBLE_PODS.map(({id}) => {
        const rec = recommendationsData[id];
        rec.id = id;
        return rec;
      });
      setPodData(data);
      setActiveButton(data?.[0]?.title || null);
      setPodId(data?.[0]?.id || null);
    }
  }, [recommendationsData]);

  const handleClick = async (name: string, id: string) => {
    setActiveButton(name);
    setPodId(id);
  };

  const currentRecommendations = podData?.find((item) => item?.id === podId);

  const elementId = podId || '';
  const itemsCodes =
    // For initial render, but may be different if podId changes and clicks are made
    currentRecommendations?.items?.map((item) => item.prod_code) || [];

  const {ref} = useTrackElementInteractions({
    elementId,
    items: itemsCodes,
    resetKey: itemsCodes.join(','), // Reset when items change so new events are fired
    enabled: elementId.length > 0,
    threshold: 0,
    click: {
      once: false,
      extract: {selector: '[data-item]', attr: 'data-item'},
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (podData.length === 0) {
    return null;
  }

  return (
    <div
      className={clsx('clear-both py-2 md:py-1.5')}
      style={{background: colorTheme?.background || 'white'}}
    >
      {podData && (
        <div className="relative">
          <h2
            className={clsx(
              'font-normal font-primary block py-[0.5rem] text-center text-[24px] md:mb-2',
            )}
          >
            You May Also Like
          </h2>
          <div className="flex flex-row justify-center gap-10">
            {podData.map(({id, title}) => {
              // Buttons to select 'Similar Styles' 'Recommended' and 'Best Sellers'
              return (
                <button
                  onClick={() => {
                    handleClick(title, id!);
                  }}
                  key={id}
                  className={`text-[12px] font-light capitalize md:text-[14px] ${
                    activeButton === title
                      ? 'font-bold underline'
                      : 'text-saleGray'
                  }`}
                >
                  {title}
                </button>
              );
            })}
          </div>
          <div ref={ref}>
            <RecommendationsResultsSlider
              items={currentRecommendations?.items || []}
            />
          </div>
        </div>
      )}
    </div>
  );
}

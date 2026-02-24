import {
  RecommendGetResultsReturn,
  type RecommendProduct,
} from '@xgenai/sdk-core';

import {I18nLocale} from '~/types/shopify';

import {CioBsResult} from '../constructor/types';
import {type DisplayOptions} from '../sanity';

export type XgenConfigType = {
  key: string;
  secret: string;
  clientId: string;
  trackerId: string;
  deploymentId: string;
  plpDeploymentId: string;
  domain: string;
  userId?: string;
  locale?: I18nLocale;
  getLocale: () => {
    country: string;
    language: string;
    currency: string;
  };
};

export type XGenRecommendationResultProps = {
  items: RecommendProduct[];
  displayOptions?: DisplayOptions;
  isRestingSearch?: boolean;
};

export type XGenRecommendationResultItem<K extends string = string> =
  RecommendGetResultsReturn[K] & {
    id?: string;
    normalizedItems?: CioBsResult[];
  };

export type XGenRecommendationResult<K extends string = string> = {
  [P in K]: XGenRecommendationResultItem<P>;
};

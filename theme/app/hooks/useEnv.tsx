import {useMatches} from '@remix-run/react';
import {useMemo} from 'react';

export const useEnv = () => {
  const matches = useMatches();
  const ENV = useMemo(
    () =>
      ((
        matches.find((route) => {
          return route.id === 'root';
        })?.data || {}
      ).ENV || {}) as Record<string, string>,
    [matches],
  );
  return ENV;
};

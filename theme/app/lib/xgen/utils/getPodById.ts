import {SANITY_XGEN_PODS_MAP, XGEN_PODS} from '~/lib/xgen/constants';

export function getPodBySanityId(
  sanityId: string,
): (typeof SANITY_XGEN_PODS_MAP)[keyof typeof SANITY_XGEN_PODS_MAP] {
  return SANITY_XGEN_PODS_MAP[sanityId as keyof typeof SANITY_XGEN_PODS_MAP];
}

export function getPodByXgenId(
  xgenId: string,
): (typeof SANITY_XGEN_PODS_MAP)[keyof typeof SANITY_XGEN_PODS_MAP] | null {
  return Object.values(XGEN_PODS).find((pod) => pod.id === xgenId) ?? null;
}

import {CioResultLabels} from '~/lib/constructor/types';

interface BadgesProps {
  labels: CioResultLabels;
}

export default function Badges({labels}: BadgesProps) {
  // const labelKeys: Array<keyof CioResultLabels> = [
  //   '__cnstrc_is_new_arrivals',
  //   '__cnstrc_is_bestseller',
  //   '__cnstrc_is_trending_now',
  // ];

  const firstTag: string | null = null;

  // for (const key of labelKeys) {
  //   const label = labels[key];
  //   if (
  //     label &&
  //     typeof label === 'object' &&
  //     'display_name' in label &&
  //     label.display_name
  //   ) {
  //     firstTag =
  //       key === '__cnstrc_is_bestseller'
  //         ? 'Bestseller'
  //         : key === '__cnstrc_is_trending_now'
  //         ? 'Trending Now'
  //         : null;
  //     break;
  //   }
  // }

  if (firstTag) {
    return (
      <div className="badge mb-[8px] mt-[5px] flex justify-center gap-[5px]">
        <div className="inline-block bg-badge p-[8px] text-2xs">{firstTag}</div>
      </div>
    );
  }

  return null;
}

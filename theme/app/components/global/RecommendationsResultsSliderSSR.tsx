// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable hydrogen/prefer-image-component */
import {RecommendProduct} from '@xgenai/sdk-core';

import {CioBsRecommendationResultProps} from '~/lib/constructor/types';
// SSR Note:
// replaced carousel with simple grid to ensure SSR compatibility

type RecommendationsProps = Omit<CioBsRecommendationResultProps, 'items'> & {
  items: RecommendProduct[];
};

export default function RecommendationsResultsSlider(
  props: RecommendationsProps,
) {
  const {items} = props;

  return (
    <>
      <div
        id="recommendations"
        className={`recommendations-carousel mx-0 min-h-[375px] pt-[30px] md:pt-10`}
      >
        <div className={`embla__container flex flex-row items-start`}>
          {items.map((item) => {
            return (
              <div
                key={item.prod_code}
                className="shadow-md border p-4 text-center"
              >
                {/* Product Image */}
                <a href={item.link}>
                  <img
                    src={item.image}
                    alt={item.prod_name}
                    className="mx-auto mb-3 h-48 w-48 object-cover"
                  />
                </a>

                {/* Product Title */}
                <h3 className="text-lg font-semibold">
                  <a href={item.link} className="hover:underline">
                    {item.prod_name}
                  </a>
                </h3>

                {/* Price */}
                <p className="text-gray-600">{item.price}</p>

                {/* Static "View Product" Button */}
                <a
                  href={item.link}
                  className="mt-3 inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  View Product
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

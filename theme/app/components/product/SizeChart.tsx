import {Image} from '@shopify/hydrogen';
import {useState} from 'react';

import {ISizeChart} from '~/lib/shopify/types';
import {convertRichTextToHtml} from '~/utils/product';

import Collapsible from '../global/Collapsible';
import {SizeChartHangerIcon} from '../icons/SizeChartHangerIcon';
import {SizeChartPhoneIcon} from '../icons/SizeChartPhoneIcon';
function getHelpIsAlwaysHere() {
  return (
    <div className="p-0 text-[12px] md:pl-4 md:pr-8">
      Got questions? Need advice? Our customer service team is just a click or
      call away.
      <div className="mt-4 items-center justify-between md:flex">
        <div className="flex items-center">
          <SizeChartPhoneIcon />
          <div className="ml-2">
            <p>844-532-JMCL (5625)</p>
            <p>Monday-Friday, 9:30am - 5:30pm EST</p>
          </div>
        </div>
      </div>
    </div>
  );
}
function getImageElement(image: any) {
  const {url, altText, width, height} = image || {};
  return image ? (
    <Image
      src={url}
      alt={altText || ''}
      width={width}
      height={height}
      className="relative h-full max-h-80 w-full transform bg-cover bg-center object-cover object-center ease-in-out md:max-h-full"
    />
  ) : (
    ''
  );
}

export default function SizeChart({
  chartData,
  title,
}: {
  chartData: ISizeChart;
  title: string;
}) {
  const measurementsImage = chartData.reference.fields.find(
    (field: any) => field.key === 'measurements',
  )?.reference?.image;
  const measurementsImageElement = getImageElement(measurementsImage);

  const sizeConversionsImage = chartData.reference.fields.find(
    (field: any) => field.key === 'size_conversions',
  )?.reference?.image;
  const sizeConversionsImageElement = getImageElement(sizeConversionsImage);

  const sizeGuideImage = chartData.reference.fields.find(
    (field: any) => field.key === 'sizing_guide',
  )?.reference?.image;
  const sizeGuideImageElement = getImageElement(sizeGuideImage);

  const measuringGuide =
    chartData.reference.fields.find(
      (field: any) => field.key === 'measuring_guide',
    )?.value || '';

  const measuringGuideElement = convertRichTextToHtml(measuringGuide);

  const helpIsAlwaysHere = getHelpIsAlwaysHere();
  const formattedData = [
    {
      title:
        chartData.reference.fields.find(
          (field: any) => field.key === 'display_title',
        )?.value || title,
      description: '*Fits may vary by style or personal preference.',
      initialOpen: false,
    },
    {
      title: 'MEASUREMENTS',
      description: measurementsImageElement,
      initialOpen: false,
    },
    {
      title: 'MEASURING GUIDE',
      description: measuringGuideElement,
      initialOpen: false,
    },
    {
      title: 'SIZE GUIDE',
      description: sizeGuideImageElement,
      initialOpen: false,
    },
    {
      title: 'SIZE CONVERSIONS',
      description: sizeConversionsImageElement,
      initialOpen: false,
    },
    {
      title: 'HELP IS ALWAYS HERE',
      description: helpIsAlwaysHere,
      initialOpen: true,
    },
  ];
  const [openCollapsible, setOpenCollapsible] = useState(
    formattedData.find((item) => item.initialOpen)?.title || '',
  );

  const valideFormattedData = formattedData.filter(
    (item) => item.description !== '',
  );
  const handleCollapsibleToggle = (title: string) => {
    if (openCollapsible === title) {
      // If the clicked Collapsible is already open, close it
      setOpenCollapsible('');
    } else {
      // If a different Collapsible is clicked, open it and close others
      setOpenCollapsible(title);
    }
  };

  return (
    <div className="h-auto max-h-[80vh] min-h-[480px] overflow-y-auto px-0 md:px-4">
      <h4 className="mb-3 text-left text-xl font-bold">Size Chart</h4>
      <div className="overflow-y-auto py-2">
        {valideFormattedData.map((item, index) => (
          <Collapsible
            key={item.title.replace(/\s/g, '')}
            title={item.title}
            description={item.description}
            isOpen={item.title === openCollapsible}
            onToggle={() => handleCollapsibleToggle(item.title)}
          />
        ))}
      </div>
    </div>
  );
}

import React from 'react';

import {SizeChartPhoneIcon} from '../icons/SizeChartPhoneIcon';
import {Link} from '../Link';
import GorgiasChatButton from '../modules/GorgiasChatButton';

const HelpIsHere: React.FC = () => {
  return (
    <div className="border-b border-gray py-4 md:border-b-0">
      <span className="pb-4 text-xs font-bold uppercase tracking-[1px]">
        QUESTIONS? WE&apos;RE HERE
      </span>
      <div className="flex flex-row justify-between">
        <div className="flex w-full items-center text-xs">
          <SizeChartPhoneIcon />
          <div className="flex w-full flex-row">
            <Link to={'tel:844-532-5625'} className="">
              <span className="w-full">844-532-JMCL (5625)</span>
            </Link>
          </div>
        </div>
        <GorgiasChatButton
          customClasses="px-0"
          dimensions={{width: 44, height: 44}}
        />
      </div>
    </div>
  );
};

export default HelpIsHere;

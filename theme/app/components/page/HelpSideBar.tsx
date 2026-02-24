import {useState} from 'react';

import {HelpNav} from '~/lib/sanity/types';

import Sidebar from '../global/Sidebar';

type Props = {
  helpNav: HelpNav;
};

export default function HelpSideBar({helpNav}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const handleClick = (slug: string) => {
    setIsOpen(!isOpen);
  };
  return (
    <Sidebar
      links={helpNav}
      handleClick={handleClick}
      isOpen={isOpen}
      title="More Help?"
    />
  );
}

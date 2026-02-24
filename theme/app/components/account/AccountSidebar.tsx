import {Form, useNavigate} from '@remix-run/react';
import type {Customer, Order} from '@shopify/hydrogen/storefront-api-types';
import {useRef, useState} from 'react';

import {SidebarLink} from '~/lib/sanity';
import {usePrefixPathWithLocale} from '~/lib/utils';
import {fetchWeSupplyDataUseEffect} from '~/utils/weSupply';

import Sidebar from '../global/Sidebar';

type Props = {
  selectedData: string | undefined;
  setSelectedData: (key: string) => void;
  customer?: Customer;
  orders?: Order[];
  setWeSupplyData: (response: any) => void;
  setOrderHistoryText: (orderHistoryExt: string) => void;
};

const ACCOUNT_SIDEBAR_LINKS: SidebarLink[] = [
  {
    title: 'Personal Information',
    slug: 'personal-information',
    link: '/account/personal-information',
    _key: 'PersonalInformation',
    _type: 'sidebarAccountLink',
  },
  {
    title: 'My Orders',
    slug: 'my-orders',
    link: '/account/my-orders',
    _key: 'MyOrders',
    _type: 'sidebarAccountLink',
  },
  {
    title: 'My Wishlist',
    slug: 'my-wishlist',
    link: '/account/my-wishlist',
    _key: 'MyWishlist',
    _type: 'sidebarAccountLink',
  },
  {
    title: 'Log Out',
    slug: 'logout',
    link: '/account/logout',
    _key: 'Logout',
    _type: 'sidebarAccountLink',
  },
];

export default function AccountSidebar({
  setSelectedData,
  selectedData,
  customer,
  orders,
  setWeSupplyData,
  setOrderHistoryText,
}: Props) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleClick = (slug: string) => {
    if (slug === 'logout') {
      formRef.current?.submit();
      return;
    }

    if (slug.length > 0) {
      navigate(`#${slug}`, {replace: true, preventScrollReset: true});
      setSelectedData(slug);
      setIsOpen(false);
      if (customer && orders) {
        const fetchData = async () => {
          try {
            const customerEmail = encodeURIComponent(customer.email);
            const ordersIds = orders.map((order) => order.orderNumber);
            const result = await fetchWeSupplyDataUseEffect(
              customerEmail,
              ordersIds,
            );
            setWeSupplyData(result);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error fetching WeSupply data:', error);
            setOrderHistoryText(
              'There was a problem loading orders. Please try again or contact our support team.',
            );
          }
        };
        fetchData();
      }
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <>
      <Form
        ref={formRef}
        method="post"
        action={usePrefixPathWithLocale('/account/logout')}
        className="page-width"
      />
      <Sidebar
        handleClick={handleClick}
        links={ACCOUNT_SIDEBAR_LINKS}
        selectedData={selectedData}
        title="My Account"
        isOpen={isOpen}
      />
    </>
  );
}

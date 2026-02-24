import {
  Form,
  Outlet,
  useLoaderData,
  useLocation,
  useMatches,
  useNavigation,
  useOutlet,
} from '@remix-run/react';
import type {SeoHandleFunction} from '@shopify/hydrogen';
import {flattenConnection} from '@shopify/hydrogen';
import type {
  Customer,
  MailingAddress,
  Order,
} from '@shopify/hydrogen/storefront-api-types';
import {
  type AppLoadContext,
  defer,
  json,
  type LoaderFunctionArgs,
  redirect,
} from '@shopify/remix-oxygen';
import clsx from 'clsx';
import {ReactNode, useEffect, useState} from 'react';

import {AccountAddressBook} from '~/components/account/AccountAddressBook';
import {AccountDetails} from '~/components/account/AccountDetails';
import AccountSidebar from '~/components/account/AccountSidebar';
import {Modal} from '~/components/account/Modal';
import ModalCard from '~/components/account/ModalOrder';
import AccountOrderHistory from '~/components/account/OrderHistory';
import Breadcrumb from '~/components/elements/BreadCrumb';
import {routeHeaders} from '~/data/cache';
import WishlistGrid from '~/lib/swym/components/wishlist/WishlistGrid';
import {SIDEBAR_CLASSNAMES, usePrefixPathWithLocale} from '~/lib/utils';
import {pushLoginData, pushSignUpData} from '~/utils/eventTracking';
import {pushLoginDataNew, pushSignUpDataNew} from '~/utils/gtmEvents'; //PEAK ACTIVITY ADDITIONS STARTS
import {
  fetchWeSupplyDataUseEffect,
  getOrdersByCustomerEmail,
  getOrderUrls,
} from '~/utils/weSupply';

import {doLogout} from './($lang).account.logout';

// Combining json + Response + defer in a loader breaks the
// types returned by useLoaderData. This is a temporary fix.
type TmpRemixFix = ReturnType<typeof defer<{isAuthenticated: false}>>;

export const headers = routeHeaders;

const seo: SeoHandleFunction<typeof loader> = ({data}) => ({
  title: 'Account details',
});

export const handle = {
  seo,
  isPublic: true,
};

export async function loader({request, context, params}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const newRegistration = !!url.searchParams.get('registered');
  const loggedIn = !!url.searchParams.get('loggedin');
  const lang = params.lang;

  const customerAccessToken = await context.session.get('customerAccessToken');

  const isAuthenticated = Boolean(customerAccessToken);
  const loginPath = lang ? `/${lang}/account/login` : '/account/login';
  const isAccountPage = /\/account\/?$/.test(url.pathname);

  if (!isAuthenticated) {
    if (isAccountPage) {
      return redirect(loginPath) as unknown as TmpRemixFix;
    }
    // pass through to public routes
    return json({isAuthenticated: false}) as unknown as TmpRemixFix;
  }

  const customerPromise = getCustomer(context, customerAccessToken);
  const customer = await customerPromise;

  const heading = getHeading(customer);
  const orders = flattenConnection(customer.orders) as Order[];

  const email = String(customer.email);
  await context.session.set('customerEmail', email);

  return defer({
    isAuthenticated,
    customer,
    heading,
    orders,
    addresses: flattenConnection(customer.addresses) as MailingAddress[],
    newRegistration,
    loggedIn,
  });
}

export default function Authenticated() {
  const data = useLoaderData<typeof loader>();
  const outlet = useOutlet();
  const matches = useMatches();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [weSupplyOrderUrl, setWeSupplyOrderUrl] = useState('');
  const [signedUp, setSignedUp] = useState(false);
  const [weSupplyData, setWeSupplyData] = useState(null);
  const [orderHistoryText, setOrderHistoryText] = useState(
    'Please wait a moment as your orders load...',
  );
  const navigation = useNavigation();
  let orders: Order[] = [];
  if ('orders' in data) {
    orders = data.orders;
  }
  let customer: Customer | null = null;
  if ('customer' in data) {
    customer = data.customer;
  }

  useEffect(() => {
    if (data?.newRegistration) {
      pushSignUpData(data.customer);
    }

    if (data?.loggedIn) {
      pushLoginData(data.customer);
    }
  }, [data]);

  //PEAK ACTIVITY ADDITIONS STARTS
  useEffect(() => {
    if (data?.newRegistration) {
      pushSignUpDataNew(data.customer);
    }

    if (data?.loggedIn) {
      pushLoginDataNew(data.customer);
    }
  }, [data]);
  //PEAK ACTIVITY ADDITIONS ENDS
  // Fetch WeSupply data on load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const customerEmail = encodeURIComponent(data?.customer?.email);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // routes that export handle { renderInModal: true }
  const renderOutletInModal = matches.some((match) => {
    return match?.handle?.renderInModal;
  });

  // Public routes
  if (!data.isAuthenticated) {
    return <Outlet />;
  }

  // Authenticated routes
  if (outlet) {
    if (renderOutletInModal) {
      const modalSeo = matches.map((match) => {
        if (typeof match.handle?.seo === 'function') {
          return match.handle.seo(match);
        }
        return match?.handle?.seo || '';
      });

      const modalTitle = modalSeo.length
        ? modalSeo[modalSeo.length - 1]?.title
        : '';

      return (
        <>
          <Modal title={modalTitle} cancelLink="/account">
            <Outlet
              context={{
                customer: data.customer,
                weSupplyOrderUrls: weSupplyData?.weSupplyOrderUrls,
                weSupplyOrdersByEmail: weSupplyData?.weSupplyOrdersByEmail,
              }}
            />
          </Modal>
          <Account
            {...(data as AccountType)}
            weSupplyOrderUrls={weSupplyData?.weSupplyOrderUrls}
            weSupplyOrdersByEmail={weSupplyData?.weSupplyOrdersByEmail}
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
            weSupplyOrderUrl={weSupplyOrderUrl}
            setWeSupplyOrderUrl={setWeSupplyOrderUrl}
            orderHistoryText={orderHistoryText}
            setOrderHistoryText={setOrderHistoryText}
          />
        </>
      );
    } else {
      return <Outlet context={{customer: data.customer}} />;
    }
  }

  return (
    <Account
      {...(data as AccountType)}
      weSupplyOrderUrls={weSupplyData?.weSupplyOrderUrls}
      weSupplyOrdersByEmail={weSupplyData?.weSupplyOrdersByEmail}
      isModalOpen={isModalOpen}
      setIsModalOpen={setIsModalOpen}
      weSupplyOrderUrl={weSupplyOrderUrl}
      setWeSupplyOrderUrl={setWeSupplyOrderUrl}
      setWeSupplyData={setWeSupplyData}
      orderHistoryText={orderHistoryText}
      setOrderHistoryText={setOrderHistoryText}
    />
  );
}

type AccountType = {
  customer: Customer;
  orders: Order[];
  heading: string;
  addresses: MailingAddress[];
  weSupplyOrderUrls?: any;
  weSupplyOrdersByEmail?: any;
  isModalOpen?: boolean;
  setIsModalOpen?: boolean;
  weSupplyOrderUrl?: string;
  setWeSupplyOrderUrl?: (url: string) => void;
  setWeSupplyData: (response: any) => void;
  orderHistoryText: string;
  setOrderHistoryText: (orderHistoryExt: string) => void;
};

function Account({
  customer,
  orders,
  heading,
  addresses,
  weSupplyOrderUrls,
  weSupplyOrdersByEmail,
  isModalOpen,
  setIsModalOpen,
  weSupplyOrderUrl,
  setWeSupplyOrderUrl,
  setWeSupplyData,
  orderHistoryText,
  setOrderHistoryText,
}: AccountType) {
  const ACCOUNT_SIDEBAR_LINKS = [
    {
      label: 'Personal Information',
      id: 'personal-information',
      link: '/account/personal-information',
      key: 'PersonalInformation',
      component: (
        <div key={'personal-information'}>
          <AccountSection>
            <AccountDetails customer={customer as Customer} />
          </AccountSection>
          <AccountSection>
            <AccountAddressBook
              addresses={addresses as MailingAddress[]}
              customer={customer as Customer}
            />
          </AccountSection>
        </div>
      ),
    },
    {
      label: 'My Orders',
      id: 'my-orders',
      link: '/account/my-orders',
      key: 'MyOrders',
      component: (
        <AccountSection key={'my-orders'}>
          {orders ? (
            <AccountOrderHistory
              orders={orders as Order[]}
              weSupplyOrderUrls={weSupplyOrderUrls}
              weSupplyOrdersByEmail={weSupplyOrdersByEmail}
              setIsModalOpen={setIsModalOpen}
              setWeSupplyOrderUrl={setWeSupplyOrderUrl}
              orderHistoryText={orderHistoryText}
            />
          ) : (
            <p>No orders found.</p>
          )}
        </AccountSection>
      ),
    },
    {
      label: 'My Wishlist',
      id: 'my-wishlist',
      link: '/account/my-wishlist',
      key: 'MyWishlist',
      component: (
        <AccountSection key={'my-wishlist'}>
          <h2 className="text-left text-lg2">My Wishlist</h2>
          <WishlistGrid isAccountPage={true} />
        </AccountSection>
      ),
    },
  ];

  const isValidHash = (hash: string) => {
    const cleanHash = hash.replace('#', '');
    return ACCOUNT_SIDEBAR_LINKS.some((link) => link.id === cleanHash);
  };
  const location = useLocation();
  const hash = location.hash;
  const [selectedData, setSelectedData] = useState<string | undefined>(
    hash && isValidHash(hash) ? hash.replace(/^#/, '') : undefined,
  );

  return (
    <div className="flex flex-col gap-7 py-7 text-center">
      <AccountSection
        setIsModalOpen={setIsModalOpen}
        weSupplyOrderUrl={weSupplyOrderUrl}
        setWeSupplyOrderUrl={setWeSupplyOrderUrl}
      >
        <Breadcrumb />
        <h1 className="mb-[10px] font-hoefler text-xl2">{heading}</h1>
        <Form
          method="post"
          action={usePrefixPathWithLocale('/account/logout')}
          className="page-width"
        >
          <button type="submit" className="text-[12px] text-secondary">
            Sign out
          </button>
        </Form>
      </AccountSection>
      <div className={SIDEBAR_CLASSNAMES}>
        <AccountSidebar
          selectedData={selectedData}
          setSelectedData={setSelectedData}
          customer={customer as Customer}
          orders={orders}
          setWeSupplyData={setWeSupplyData}
          setOrderHistoryText={setOrderHistoryText}
        />
        <div className="page-width flex w-full flex-col gap-[30px]">
          {ACCOUNT_SIDEBAR_LINKS.map((link) => {
            if (
              selectedData === link.id ||
              (selectedData === undefined && link.id === 'personal-information')
            ) {
              return link.component;
            }
            return null;
          })}
        </div>
      </div>
      {isModalOpen === true && (
        <ModalCard
          isModalOpen={isModalOpen}
          closeModal={() => {
            setIsModalOpen(false);
          }}
        >
          <iframe
            src={weSupplyOrderUrl}
            title="Modal Content"
            width="100%"
            height="100%"
            className="pt-8 lg:pt-0"
          />
        </ModalCard>
      )}
    </div>
  );
}
const AccountSection = ({children}: {children: ReactNode}) => {
  return (
    <>
      <div className={clsx(['mx-auto w-full max-w-[1400px] px-4', 'lg:px-1'])}>
        {children}
      </div>
    </>
  );
};

const CUSTOMER_QUERY = `#graphql
  query CustomerDetails(
    $customerAccessToken: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    customer(customerAccessToken: $customerAccessToken) {
      firstName
      lastName
      phone
      email
      acceptsMarketing
      id
      defaultAddress {
        id
        formatted
        firstName
        lastName
        company
        address1
        address2
        country
        province
        city
        zip
        phone
      }
      addresses(first: 6) {
        edges {
          node {
            id
            formatted
            firstName
            lastName
            company
            address1
            address2
            country
            province
            city
            zip
            phone
          }
        }
      }
      orders(first: 250, sortKey: PROCESSED_AT, reverse: true) {
        edges {
          node {
            id
            orderNumber
            name
            processedAt
            financialStatus
            fulfillmentStatus
            currentTotalPrice {
              amount
              currencyCode
            }
            lineItems(first: 100) {
              edges {
                node {
                  variant {
                    image {
                      url
                      altText
                      height
                      width
                    }
                  }
                  title
                }
              }
            }
          }
        }
      }
    }
  }
`;

export async function getCustomer(
  context: AppLoadContext,
  customerAccessToken: string,
) {
  const {storefront} = context;

  const data = await storefront.query<{
    customer: Customer;
  }>(CUSTOMER_QUERY, {
    variables: {
      customerAccessToken,
      country: context.storefront.i18n.country,
      language: context.storefront.i18n.language,
    },
  });

  /**
   * If the customer failed to load, we assume their access token is invalid.
   */
  if (!data || !data.customer) {
    throw await doLogout(context);
  }

  return data.customer;
}

function getHeading(customer: Customer | null) {
  if (!customer) return 'Account Details';
  return customer.firstName
    ? `Welcome, ${customer.firstName}`
    : 'Welcome to your account.';
}

export async function fetchWeSupplyData(
  context: any,
  ordersIds: string[],
  customerEmail?: string,
) {
  if (!customerEmail || !ordersIds.length)
    return {weSupplyOrderUrls: null, weSupplyOrdersByEmail: null};

  const weSupplyOrdersByEmail: any = await getOrdersByCustomerEmail(
    customerEmail,
    context,
  );

  const weSupplyOrderIds = weSupplyOrdersByEmail
    .reverse()
    .map((order) => order.OrderExternalOrderID);
  const weSupplyOrderUrls = await getOrderUrls(weSupplyOrderIds, context);
  return {weSupplyOrderUrls, weSupplyOrdersByEmail, weSupplyOrderIds};
}

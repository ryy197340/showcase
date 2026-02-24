import {Form} from '@remix-run/react';
import type {
  Customer,
  MailingAddress,
} from '@shopify/hydrogen/storefront-api-types';
import clsx from 'clsx';

import Button, {defaultButtonStyles} from '~/components/elements/Button';
import {Link} from '~/components/Link';

const buttonClasses = 'border-primary border px-[10px] py-[6px]';

export function AccountAddressBook({
  customer,
  addresses,
}: {
  customer: Customer;
  addresses: MailingAddress[];
}) {
  return (
    <>
      <div className="grid w-full text-left">
        <h3 className="border-b border-gray pb-[14px] text-lg2">
          Address Book
        </h3>
        <div className="pt-[14px]">
          {!addresses?.length && (
            <p>You haven&apos;t saved any addresses yet.</p>
          )}
          {Boolean(addresses?.length) && (
            <div className="flex flex-col gap-4">
              {customer.defaultAddress && (
                <Address address={customer.defaultAddress} defaultAddress />
              )}
              {addresses
                .filter((address) => address.id !== customer.defaultAddress?.id)
                .map((address) => (
                  <Address key={address.id} address={address} />
                ))}
            </div>
          )}
          <div className="border-t border-lightGray text-left">
            <Button
              to="/account/address/add"
              aria-label="Add New Address"
              className={clsx([
                defaultButtonStyles({tone: 'link', style: 'link'}),
                'bg-white text-[10px] font-bold uppercase leading-[20px] tracking-[1px] text-secondary',
              ])}
              preventScrollReset
            >
              + Add New Address?
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function Address({
  address,
  defaultAddress,
}: {
  address: MailingAddress;
  defaultAddress?: boolean;
}) {
  return (
    <div className="relative flex flex-col gap-[14px] border-b border-lineGray border-opacity-50 pb-[14px] last:border-b-0">
      <ul className="flex-1 flex-row space-y-1 text-[14px]">
        {(address.firstName || address.lastName) && (
          <li className="font-bold">
            {'' +
              (address.firstName && address.firstName + ' ') +
              address?.lastName}
          </li>
        )}
        {address.formatted &&
          address.formatted.map((line: string) => <li key={line}>{line}</li>)}
      </ul>

      <div className="flex flex-row gap-2 text-[10px] tracking-[.8px] text-darkGray">
        {defaultAddress && (
          <span className={buttonClasses}>DEFAULT ADDRESS</span>
        )}
        <Link
          to={`/account/address/${encodeURIComponent(address.id)}`}
          prefetch="intent"
          preventScrollReset
          className={buttonClasses}
        >
          EDIT
        </Link>
        <Form action="/account/address/delete" method="delete">
          <input type="hidden" name="addressId" value={address.id} />
          <button
            className={buttonClasses}
            aria-label={`Delete address for ${address.firstName} ${address.lastName}`}
          >
            DELETE
          </button>
        </Form>
      </div>
    </div>
  );
}

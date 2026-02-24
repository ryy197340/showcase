import type {Customer} from '@shopify/hydrogen/storefront-api-types';
import clsx from 'clsx';

import {Link} from '~/components/Link';

const labelClasses = 'text-[14px] text-darkGray font-semibold';

export function AccountDetails({customer}: {customer: Customer}) {
  const {firstName, lastName, email, phone} = customer;
  return (
    <>
      <div>
        <div className="flex flex-col items-baseline">
          <h3 className="align-baseline text-lg2">Personal Information</h3>
          <Link
            prefetch="intent"
            className="text-[12px]"
            to="/account/edit"
            preventScrollReset
          >
            Edit
          </Link>
        </div>

        <div className="mt-4 space-y-4 pb-5 text-left">
          <div className="space-y-1">
            <div className={labelClasses}>Name</div>
            <p
              className={clsx(
                !firstName && !lastName && 'italic text-darkGray',
                'text-[14px]',
              )}
            >
              {firstName || lastName
                ? (firstName ? firstName + ' ' : '') + lastName
                : 'Not added'}{' '}
            </p>
          </div>
          <div className="space-y-1">
            <div className={labelClasses}>Phone</div>
            <p
              className={clsx(!phone && 'italic text-darkGray', 'text-[14px]')}
            >
              {phone ?? 'Not added'}
            </p>
          </div>
          <div className="space-y-1">
            <div className={labelClasses}>Email address</div>
            <p className="text-[14px]">{email}</p>
          </div>
        </div>
      </div>
    </>
  );
}

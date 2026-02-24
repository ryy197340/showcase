import {useMatches} from '@remix-run/react';
import {CartForm} from '@shopify/hydrogen';
import type {
  Cart,
  CartLine,
  ComponentizableCartLine,
} from '@shopify/hydrogen/storefront-api-types';
import {AttributeInput} from '@shopify/hydrogen/storefront-api-types';
import {Image, Money} from '@shopify/hydrogen-react';
import clsx from 'clsx';
import React, {useContext, useEffect, useState} from 'react';
import {v4 as uuidv4} from 'uuid';

import Button, {squareButtonStyles} from '~/components/elements/Button';
import {FacetCaret} from '~/components/icons/FacetCaret';
import PencilIcon from '~/components/icons/Pencil';
import RemoveIcon from '~/components/icons/Remove';
import {GlobalContext} from '~/lib/utils';

import InfoElement from '../elements/InfoElement';

export default function AttributesUpdateForm({
  lineItem,
  quantity,
  attributes,
  source,
  lines,
  cart,
}: {
  lineItem?: CartLine | ComponentizableCartLine;
  quantity?: BigInteger;
  attributes?: AttributeInput;
  source?: string;
  lines?: Cart['lines'] | undefined;
  cart?: Cart;
}) {
  // query root.data.layout to grab the giftOptions object from sanity
  const [root] = useMatches();
  const layout = root.data?.layout;
  const sanityGiftOptions = layout.giftSettings;

  // shows gift options set on the item/order
  const [showGiftOptions, setShowGiftOptions] = useState(false);
  // shows the form to set gift options
  const [showGiftOptionsForm, setShowGiftOptionsForm] = useState(false);
  const [formData, setFormData] = useState({
    to: '',
    from: '',
    message: '',
    removed: 'default',
  });
  const [isChecked, setIsChecked] = useState(false);
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const {name, value} = e.target;
    setFormData((prevData) => ({...prevData, [name]: value}));
  };
  const [submitOnRemove, setSubmitOnRemove] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    setShowGiftOptionsForm(false);

    const closestForm = e.target.closest('form');
    closestForm.submit();
  };

  const messageCharacterCount = formData.message.length;
  const toCharacterCount = formData.to.length;
  const fromCharacterCount = formData.from.length;

  useEffect(() => {
    if (formData.removed === 'removed') {
      const timer = setTimeout(() => {
        setFormData((prevData) => ({...prevData, removed: 'default'}));
      }, 2000);
      setShowGiftOptions(false);
      setShowGiftOptionsForm(false);
      return () => clearTimeout(timer);
    }
  }, [formData.removed]);

  useEffect(() => {
    let toValue = '';
    let fromValue = '';
    let msgValue = '';
    const orderLevelOptionsSet = cart.attributes.length > 0 ? true : false;

    // order level gift wrap
    if (!lineItem) {
      const cartAttributes = cart?.attributes;
      if (cartAttributes) {
        for (let i = 0; i < cartAttributes.length; i++) {
          const attribute = cartAttributes[i];
          if (attribute.key === '_OrderGiftWrappingMessage') {
            const valueString = attribute.value;
            if (valueString) {
              const toIndex = valueString.indexOf('TO:') + 3;
              const fromIndex = valueString.indexOf('FROM:') + 5;
              const msgIndex = valueString.indexOf('MSG:') + 4;
              toValue = valueString.substring(
                toIndex,
                valueString.indexOf(',', toIndex),
              );
              fromValue = valueString.substring(
                fromIndex,
                valueString.indexOf(',', fromIndex),
              );
              msgValue = valueString.substring(msgIndex);
              break;
            }
          }
        }
      }
    } else {
      // line item gift wrap
      const attributesArray = lineItem.attributes;
      if (attributesArray.length > 0) {
        setShowGiftOptions(true);
        if (orderLevelOptionsSet) {
          // dont show line item gift options if they are coming from the order gift options
          setShowGiftOptions(false);
        }
      }
      for (let i = 0; i < attributesArray.length; i++) {
        const attribute = attributesArray[i];
        if (attribute.key === '_ItemGiftMessage') {
          const valueString = attribute.value;
          if (valueString) {
            const toIndex = valueString.indexOf('TO:') + 3;
            const fromIndex = valueString.indexOf('FROM:') + 5;
            const msgIndex = valueString.indexOf('MSG:') + 4;
            toValue = valueString.substring(
              toIndex,
              valueString.indexOf(',', toIndex),
            );
            fromValue = valueString.substring(
              fromIndex,
              valueString.indexOf(',', fromIndex),
            );
            msgValue = valueString.substring(msgIndex);
            break;
          }
        }
      }
    }
    setFormData((prevData) => ({
      ...prevData,
      to: toValue,
      from: fromValue,
      message: msgValue,
    }));
  }, [lineItem, cart]);

  const {locale} = useContext(GlobalContext);

  return (
    <div className="attribute-form flex w-full flex-col">
      <div className="flex flex-col">
        <button
          className="flex flex-row items-center gap-[10px]"
          onClick={() => {
            setShowGiftOptions((prev) => !prev);
            setShowGiftOptionsForm((prev) => !prev);
          }}
        >
          <span
            className="text-xs text-primary underline"
            style={{lineHeight: '24px'}}
          >
            {source && source === 'order' ? 'Order Level ' : ''} Gift Options
          </span>
          <div
            className="transition-transform duration-300"
            style={{
              transform: showGiftOptions ? 'rotate(180deg)' : '',
            }}
          >
            <FacetCaret />
          </div>
          <InfoElement
            content={
              source === 'order'
                ? 'Apply gift options to this entire order.'
                : 'Apply gift options to this item only.'
            }
          />
        </button>
      </div>
      <div className="flex w-full">
        <CartForm
          route={`${locale.pathPrefix}/cart`}
          action={CartForm.ACTIONS.AttributesUpdateInput}
          inputs={formData}
          className="flex w-full"
          id="test"
          //onSubmit={handleSubmit}
        >
          {/* Form Data Start */}
          {lines &&
            source &&
            source === 'order' &&
            lines.edges.map(function (el, index) {
              return (
                <div className="orderLineItems" key={uuidv4()}>
                  <input type="hidden" name="orderLineId" value={el.node.id} />
                  <input
                    type="hidden"
                    name="orderLineQuantity"
                    value={el.node.quantity}
                  />
                </div>
              );
            })}
          <input type="hidden" name="lineId" value={lineItem?.id} />
          <input type="hidden" name="quantity" value={lineItem?.quantity} />
          <input
            type="hidden"
            name="giftWrap"
            value={isChecked ? 'GW:C' : ''}
          />
          <input
            type="hidden"
            name="giftWrapRemove" // Additional input field to indicate the removal of gift wrap
            value={
              formData.to || formData.from || formData.message || formData
                ? ''
                : 'removed'
            } // Set value to 'removed' if the form data is cleared
          />
          {/* Form Data End */}
          {/* First conditional - Show line item gift wrap attributes that have been set
              Second conditional - Show order level gift wrap attributes that have been set
          */}
          {((lineItem &&
            lineItem.attributes &&
            lineItem.attributes.length > 0 &&
            cart &&
            !(cart.attributes.length > 0) &&
            showGiftOptions) ||
            (source &&
              source === 'order' &&
              cart &&
              cart.attributes.length > 0 &&
              showGiftOptions)) && (
            <div className="flex flex-col items-start justify-between md:flex-row md:items-end">
              <div className="flex w-1/2 flex-col gap-2 pt-4 text-xs text-primary md:flex-wrap">
                <p>
                  <span className="text-[darkGray]">Message: </span>
                  {formData.message}
                </p>
                <p>
                  <span className="text-[darkGray]">To: </span>
                  {formData.to}
                </p>
                <p>
                  <span className="text-[darkGray]">From: </span>
                  {formData.from}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex w-1/2 flex-row justify-end gap-2 pt-4 text-xs text-primary md:flex-wrap">
                  <button
                    onClick={() => {
                      setShowGiftOptions(true);
                      setShowGiftOptionsForm(!showGiftOptionsForm);
                    }}
                  >
                    <PencilIcon />
                  </button>
                </div>
                <div className="flex w-1/2 flex-row justify-end gap-2 pt-4 text-xs text-primary md:flex-wrap">
                  <button
                    onClick={() => {
                      setFormData({
                        to: '',
                        from: '',
                        message: '',
                        removed: 'removed',
                      });
                      setSubmitOnRemove(true);
                    }}
                  >
                    <RemoveIcon />
                  </button>
                </div>
              </div>
            </div>
          )}
          {showGiftOptions && showGiftOptionsForm && (
            <div
              className={`flex w-full flex-row py-10 text-sm text-primary ${
                showGiftOptions ? '' : 'pointer-events-none hidden'
              }`}
            >
              <div className="flex w-full flex-col text-sm text-primary md:flex-row">
                <div className="mr-5 flex w-full flex-col flex-wrap justify-center gap-5 md:w-1/2">
                  <p className="h1 text-center text-xl2 md:text-left">
                    {sanityGiftOptions?.giftHeader?.trim()
                      ? sanityGiftOptions.giftHeader
                      : 'The Finishing Touch'}
                  </p>
                  <p className="mt-[-10px] text-center md:text-left">
                    {sanityGiftOptions?.giftCopy?.trim()
                      ? sanityGiftOptions.giftCopy
                      : 'Packaged in a J.McLaughlin azure blue gift box and finished with our navy & sand graphic zebra gift wrap.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsChecked(!isChecked)}
                    className="flex w-full justify-center"
                  >
                    <Image
                      src={
                        sanityGiftOptions.giftImage
                          ? sanityGiftOptions.giftImage.url
                          : 'https://cdn.sanity.io/images/tzehqw2l/production/02f15bcafee13869c605026950cc8c91a90388ec-600x600.jpg'
                      }
                      width="250px"
                      height="250px"
                      alt="image of wrapped gift boxes stacked vertically"
                    />
                  </button>
                </div>
                {showGiftOptionsForm && (
                  <div className="flex w-full flex-col pt-5 md:w-1/2 md:pt-0">
                    <p>Gift Message (optional)</p>
                    <div className="mt-5 flex flex-col gap-5">
                      <div className="giftwrap flex flex-col gap-[10px] text-primary">
                        <label htmlFor="ToInput" className="text-xs ">
                          TO: {toCharacterCount}/25
                        </label>
                        <input
                          type="text"
                          name="to"
                          value={formData.to}
                          onChange={handleInputChange}
                          style={{}}
                          maxLength={25}
                        />
                      </div>
                      <div className="giftwrap flex flex-col gap-[10px] text-primary">
                        <label htmlFor="FromInput" className="text-xs">
                          FROM: {fromCharacterCount}/25
                        </label>
                        <input
                          type="text"
                          name="from"
                          value={formData.from}
                          onChange={handleInputChange}
                          maxLength={25}
                        />
                      </div>
                      <div className="giftwrap flex flex-col gap-[10px] text-primary">
                        <label htmlFor="MessageInput" className="text-xs">
                          Message: {messageCharacterCount}/150
                        </label>
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          maxLength={150}
                        />
                      </div>
                      <Button
                        type="button"
                        className={clsx([
                          squareButtonStyles({
                            mode: 'default',
                            tone: 'default',
                          }),
                          'w-full',
                        ])}
                        onClick={(e) => {
                          handleSubmit(e);
                        }}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CartForm>
      </div>
    </div>
  );
}

import '@shopify/ui-extensions/preact';
import { render } from 'preact';

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const attributes = (shopify && shopify.attributes && shopify.attributes.value) || [];

  let faGiftCardsRaw = null;

  if (Array.isArray(attributes)) {
    const faAttr = attributes.find((attr) => attr && attr.key === 'follett_giftcards');

    if (faAttr && typeof faAttr.value === 'string' && faAttr.value.trim() !== '') {
      try {
        faGiftCardsRaw = JSON.parse(faAttr.value);
        console.log('[follett_giftcards] parsed value:', faGiftCardsRaw);
      } catch (err) {
        console.error('[follett_giftcards] Failed to parse attribute value:', faAttr.value, err);
        faGiftCardsRaw = null;
      }
    }
  }

  const faGiftCards = Array.isArray(faGiftCardsRaw) ? faGiftCardsRaw : [];

  if (!faGiftCards.length) {
    return null;
  }

  function formatSource(source) {
    switch (source) {
      case 'campusCard':
        return 'Campus Card';
      case 'financialAid':
        return 'Financial Aid';
      default:
        return 'Gift Card';
    }
  }

  return (
    <s-stack
      background="subdued"
      borderRadius="base"
      borderWidth="base"
      padding="base"
      direction="block" 
    >
      {faGiftCards.map((gc, index) => {
        const sourceLabel =
          gc &&
          gc.source === 'financialAid' &&
          typeof gc.description === 'string' &&
          gc.description.trim() !== ''
            ? gc.description
            : formatSource(gc && gc.source);

        const rawAmount = gc && gc.amount;
        const amountNumber = Number(rawAmount);
        const formattedAmount = Number.isFinite(amountNumber)
          ? `$${amountNumber.toFixed(2)}`
          : '$0.00';

        return (
          <s-stack key={index} direction="block" gap="small-500">
            <s-text type="strong">
              {sourceLabel}
            </s-text>

            <s-text>
              <s-stack direction="inline" gap="small-500" alignItems='center'>
                <s-icon type="info" />
                <s-text>
                  {formattedAmount} applied to your order.
                </s-text>
              </s-stack>
            </s-text>

            {index < faGiftCards.length - 1 && (
              <s-stack padding="small-300">
                <s-divider />
              </s-stack>
            )}
          </s-stack>
        );
      })}
    </s-stack>
  );
}

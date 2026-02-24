import '@shopify/ui-extensions/preact';
import {render} from "preact";

export default async () => {
  render(<Extension />, document.body)
}

function Extension() {
  return (
    <s-banner>
      <s-text>
        A debit or credit card is required to rent textbooks and will be kept on file for potential damages, overdue, or unreturned rental charges.
      </s-text>
    </s-banner>
  );
}
import '@shopify/ui-extensions/preact';
import {render} from "preact";

export default async () => {
  render(<Extension />, document.body)
}

function Extension() {
  return (
    <s-text>
      Order total includes taxes. Tax-exempt financial aid / student billing account(s) will not be charged taxes during order processing.
    </s-text>
  );
}
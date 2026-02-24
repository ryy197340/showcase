import '@shopify/ui-extensions/preact';
import {render} from "preact";

export default async () => {
  render(<Extension />, document.body)
}

function Extension() {
  return (
    <s-stack direction="inline" gap="base" block-alignment="center">
      <s-link href="https://www.follett.com/terms" target="_blank">
        Terms of Use
      </s-link>
      <s-text>|</s-text>
      <s-link href="https://www.follett.com/policies" target="_blank">
        Privacy Policy
      </s-link>
    </s-stack>
  );
}
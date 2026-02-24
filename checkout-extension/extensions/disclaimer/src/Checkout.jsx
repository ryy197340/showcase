import '@shopify/ui-extensions/preact';
import {render} from "preact";

// 1. Export the extension
export default async () => {
  render(<Extension />, document.body)
};

function Extension() {
  return (
    <s-stack gap="base">
      <s-text>
        By proceeding, I agree to Follett's{' '}
        <s-link href="https://www.follett.com/terms">
          Terms of Use
        </s-link>
        ,{' '}
        <s-link href="https://www.follett.com/policies">
          Privacy Policy
        </s-link>
        {' '}and{' '}
        <s-link href="https://follett.com/cookies/">
          Cookie Preference Policy
        </s-link>
        .
      </s-text>
    </s-stack>
  );
}
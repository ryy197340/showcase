import { POSBlock, POSBlockRow, reactExtension, Text, useApi } from "@shopify/ui-extensions-react/point-of-sale";

const Block = () => {
  const api = useApi<'pos.customer-details.block.render'>();
  return (
    <POSBlock action={{title: 'Tax Override', onPress: api.action.presentModal}}>
      <POSBlockRow>
        <Text>{`Customer ID for this customer: ${api.customer.id}`}</Text>
      </POSBlockRow>
    </POSBlock>
  );
};

export default reactExtension('pos.customer-details.block.render', () => (
  <Block />
));
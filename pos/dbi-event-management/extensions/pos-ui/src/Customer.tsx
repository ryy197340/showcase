import {
  reactExtension,
  useApi,
} from "@shopify/ui-extensions-react/point-of-sale";

import { ModalContents } from "./ModalContents.jsx";

const Customer = () => {
  const api = useApi<"pos.customer-details.action.render">();
  return <ModalContents shopifyCustomerId={api.customer.id} />;
};

export default reactExtension("pos.customer-details.action.render", () => (
  <Customer />
));

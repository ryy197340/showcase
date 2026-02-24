import {
  reactExtension,
  useCartSubscription,
} from "@shopify/ui-extensions-react/point-of-sale";
import { ModalContents } from "./ModalContents.jsx";

const Modal = () => {
  const cart = useCartSubscription();
  return <ModalContents shopifyCustomerId={cart?.customer?.id} />;
};

export default reactExtension("pos.home.modal.render", () => <Modal />);

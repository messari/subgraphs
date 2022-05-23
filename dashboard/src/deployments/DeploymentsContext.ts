import { createContext } from "react";
import { DeploymentErrorDialogData } from "./DeploymentErrorModal";

export interface DeploymentsValue {
  errorDialogData: DeploymentErrorDialogData | undefined;
  setErrorDialogData: (data: DeploymentErrorDialogData) => void;
  showErrorDialog: (b: boolean) => void;
}

const DeploymentsContext = createContext<DeploymentsValue>({
  errorDialogData: undefined,
  showErrorDialog: () => {},
  setErrorDialogData: () => {},
});

export default DeploymentsContext;

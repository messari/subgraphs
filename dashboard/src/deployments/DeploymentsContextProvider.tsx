import { FC, useMemo, useState } from "react";
import DeploymentsContext, { DeploymentsValue } from "./DeploymentsContext";
import { DeploymentErrorDialogData, DeploymentErrorModal } from "./DeploymentErrorModal";

export const DeploymentsContextProvider: FC = ({ children }) => {
  const [showErrorDialog, setShowErrorDialog] = useState<boolean>(false);
  const [dialogData, setDialogData] = useState<DeploymentErrorDialogData | undefined>();

  const value: DeploymentsValue = useMemo(
    () => ({
      showErrorDialog: setShowErrorDialog,
      errorDialogData: dialogData,
      setErrorDialogData: setDialogData,
    }),
    [dialogData],
  );

  const resetDialog = () => {
    setShowErrorDialog(false);
    setDialogData(undefined);
  };

  return (
    <DeploymentsContext.Provider value={value}>
      {children}
      {dialogData && <DeploymentErrorModal open={showErrorDialog} onClose={resetDialog} data={dialogData} />}
    </DeploymentsContext.Provider>
  );
};

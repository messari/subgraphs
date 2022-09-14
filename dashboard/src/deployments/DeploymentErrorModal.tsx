import { Box, Dialog, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material";
import { styled } from "../styled";
import { DeploymentError } from "./types";
import CloseIcon from "@mui/icons-material/Close";

const ErrorRow = styled("div")`
  padding: ${({ theme }) => theme.spacing(2, 0)};
`;
const ErrorType = styled(Typography)<{ type?: string }>`
  display: flex;
  align-items: center;
  ${({ type, theme }) => type === "fatal" && `color: ${theme.palette.error.main};`};
`;

const ErrorMessage = styled("pre")`
  font-size: 14px;
  white-space: normal;
  background: ${({ theme }) => theme.palette.background.paper};
  padding: ${({ theme }) => theme.spacing(2)};
  border-radius: 4px;
`;

export interface DeploymentErrorDialogData {
  deployment: string;
  network: string;
  nonFatalErrors: DeploymentError[];
  fatalError: DeploymentError;
  subgraphName: string;
}

export interface DeploymentErrorModalProps {
  open: boolean;
  onClose: () => void;
  data: DeploymentErrorDialogData;
}

export const DeploymentErrorModal = ({
  open,
  onClose,
  data: { subgraphName, network, fatalError, nonFatalErrors },
}: DeploymentErrorModalProps) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg">
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <span>
            {subgraphName} - {network}
          </span>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {fatalError && (
          <ErrorRow>
            <ErrorType variant="h6" type="fatal">
              Fatal Error - block: {fatalError.block.number}
            </ErrorType>
            <ErrorMessage>{fatalError.message}</ErrorMessage>
          </ErrorRow>
        )}
        {nonFatalErrors.map((err) => (
          <ErrorRow>
            <ErrorType variant="h6">Non-fatal - block: {err.block.number}</ErrorType>
            <ErrorMessage>{err.message}</ErrorMessage>
          </ErrorRow>
        ))}
      </DialogContent>
    </Dialog>
  );
};

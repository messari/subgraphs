export interface ErrorBlock {
  number: number;
  hash: string;
}

export interface DeploymentError {
  message: string;
  block: ErrorBlock;
}

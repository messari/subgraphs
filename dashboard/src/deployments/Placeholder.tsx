import { useEffect } from "react";

interface Placeholder {
  deploymentsLoaded: any;
  setDeploymentsLoaded: any;
  deploymentKey: string;
}

function Placeholder({ deploymentsLoaded, deploymentKey, setDeploymentsLoaded }: Placeholder) {
  const copiedDeploymentsLoaded = { ...deploymentsLoaded };
  copiedDeploymentsLoaded[deploymentKey] = true;
  useEffect(() => setDeploymentsLoaded(copiedDeploymentsLoaded));

  return <div style={{ display: "inline-block", width: "100%", height: "10px" }} />;
}

export default Placeholder;

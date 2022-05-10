import "./App.css";

import { useState } from "react";
import moment from "moment";
import ProtocolDashboard from "./interfaces/ProtocolDashboard";
import DeploymentsPage from "./interfaces/DeploymentsPage";

export const toDate = (timestamp: number) => {
  return moment.unix(timestamp).format("YYYY-MM-DD");
};

export function isValidHttpUrl(s: string) {
  let url;
  try {
    url = new URL(s);
  } catch (_) {
    return false;  
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

function App() {
  const [protocolUrl, setProtocolUrl] = useState("");
  const [urlTextField, setTextField] = useState<string>("");

  const protocolElement = ProtocolDashboard(protocolUrl, setProtocolUrl, urlTextField);
  const deploymentPage = DeploymentsPage(setProtocolUrl, setTextField, urlTextField);

  return (
    <div className="App">
      {protocolUrl ? protocolElement: deploymentPage}
    </div>
  );
}

export default App;

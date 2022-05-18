import { Box, Button, TextField } from "@mui/material";
import { useState } from "react";
import { ProtocolsToQuery } from "../constants";
import { SubgraphDeployments } from "../common/subgraphDeployments";
import { useNavigate } from "react-router";


function DeploymentsPage() {
  const [urlText, setUrlText] = useState<string>("");
  const navigate = useNavigate();

  return (
    <div className="DeploymentsPage">
      <Box marginLeft={6} marginTop={1} marginRight={6}>
        <TextField
          label="Subgraph query name ie. messari/balancer-v2-ethereum"
          fullWidth
          onChange={(event) => {
            setUrlText(event.target.value);
          }}
        />
        <Button
          style={{ border: "black 0.2px solid", marginTop: "10px" }}
          onClick={() => {
            navigate(`graphs?subgraph=${urlText}`);
          }}
        >
          Load Subgraph
        </Button>
      </Box>
      <h2 style={{ textAlign: "center" }}>Deployed Subgraphs</h2>
      {/*{errorRender}*/}
      {Object.keys(ProtocolsToQuery).map((key) => (
        <SubgraphDeployments
          key={key}
          protocol={{ name: key, deploymentMap: ProtocolsToQuery[key] }}
        />
      ))}
    </div>
  );
}

export default DeploymentsPage;
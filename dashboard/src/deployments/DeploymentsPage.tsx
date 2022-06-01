import { styled } from "../styled";
import { ProtocolsToQuery } from "../constants";
import { SubgraphDeployments } from "./SubgraphDeployments";
import { useNavigate } from "react-router";
import { SearchInput } from "../common/utilComponents/SearchInput";
import { DeploymentsContextProvider } from "./DeploymentsContextProvider";
import { Typography } from "@mui/material";
import LazyLoad from "react-lazyload";
import { NewClient } from "../utils";

const DeploymentsLayout = styled("div")`
  padding: ${({ theme }) => theme.spacing(4)};
`;

function DeploymentsPage() {
  const navigate = useNavigate();
  const clientIndexing = NewClient("https://api.thegraph.com/index-node/graphql");
  window.scrollTo(0, 0);

  return (
    <DeploymentsContextProvider>
      <DeploymentsLayout>
        <SearchInput
          onSearch={(val) => {
            if (val) {
              navigate(`subgraph?endpoint=${val}&tab=protocol`);
            }
          }}
          placeholder="Subgraph query name ie. messari/balancer-v2-ethereum"
        >
          Load Subgraph
        </SearchInput>
        <Typography variant="h4" align="center" sx={{ my: 2 }}>
          Deployed Subgraphs
        </Typography>
        {Object.keys(ProtocolsToQuery).map((key) => (
          <SubgraphDeployments
            clientIndexing={clientIndexing}
            key={key}
            protocol={{ name: key, deploymentMap: ProtocolsToQuery[key] }}
          />
        ))}
      </DeploymentsLayout>
    </DeploymentsContextProvider>
  );
}

export default DeploymentsPage;

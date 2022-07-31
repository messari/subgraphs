import { SubgraphDeployments } from "./SubgraphDeployments";
import { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useState } from "react";
import Placeholder from "./Placeholder";
import LazyLoad from "react-lazyload";

interface DeploymentsTable {
  clientIndexing: ApolloClient<NormalizedCacheObject>;
  protocolsOnType: any;
  protocolType: string;
}

function DeploymentsTable({ protocolsOnType, clientIndexing, protocolType }: DeploymentsTable) {
  const initialLoaded: { [x: string]: Boolean } = {};
  Object.keys(protocolsOnType).forEach((p, idx) => {
    if (idx < 1) {
      initialLoaded[p] = true;
    } else {
      initialLoaded[p] = false;
    }
  });

  const [deploymentsLoadedState, setDeploymentsLoaded] = useState(initialLoaded);
  const deploymentsLoaded: { [x: string]: any } = {};
  const placeholders: { [x: string]: any } = {};
  Object.keys(protocolsOnType).forEach((x) => {
    if (deploymentsLoadedState[x] === true) {
      deploymentsLoaded[x] = protocolsOnType[x];
    } else {
      placeholders[x] = protocolsOnType[x];
    }
  });

  const columnLabels: { [x: string]: string } = {
    "Name/Network": "220px",
    "Indexed %": "80px",
    "Current Block": "120px",
    "Chain Head": "120px",
    "Schema Version": "130px",
    "Subgraph Version": "130px",
    "Non-Fatal Errors": "100px",
    "Entity Count": "100px",
  };

  return (
    <>
      <TableContainer>
        <Table stickyHeader>
          <TableHead sx={{ height: "30px" }}>
            <TableRow sx={{ height: "30px", width: "100%" }}>
              {Object.keys(columnLabels).map((x, idx) => {
                const style: { [x: string]: string } = {
                  minWidth: columnLabels[x],
                  maxWidth: columnLabels[x],
                  padding: "6px",
                };
                let textAlign = "left";
                if (idx !== 0) {
                  textAlign = "right";
                }
                if (idx === Object.keys(columnLabels).length - 1) {
                  style.paddingRight = "30px";
                }
                return (
                  <TableCell key={"column" + x} sx={style}>
                    <Typography
                      variant="h5"
                      fontSize={14}
                      fontWeight={500}
                      sx={{ margin: "0", width: "100%", textAlign }}
                    >
                      {x}
                    </Typography>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody sx={{ width: "100%" }}>
            {Object.keys(deploymentsLoaded).map((protocol) => {
              return (
                <SubgraphDeployments
                  clientIndexing={clientIndexing}
                  key={"DeploymentsOnProtocol-" + protocolType + "-" + protocol}
                  protocol={{ name: protocol, deploymentMap: protocolsOnType[protocol] }}
                />
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <div>
        {Object.keys(placeholders).map((deployment) => {
          return (
            <LazyLoad key={"dep-" + deployment} height={53} offset={100}>
              <Placeholder
                deploymentsLoaded={deploymentsLoadedState}
                deploymentKey={deployment}
                setDeploymentsLoaded={(x: any) => setDeploymentsLoaded(x)}
              />
            </LazyLoad>
          );
        })}
      </div>
    </>
  );
}

export default DeploymentsTable;

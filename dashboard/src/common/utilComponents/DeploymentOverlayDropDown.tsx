import { Autocomplete, CircularProgress } from "@mui/material";
import React, { useState } from "react";
import { isValidHttpUrl, schemaMapping } from "../../utils";
import { ComboBoxInput } from "./ComboBoxInput";

interface DeploymentOverlayDropDownProps {
  data: any;
  subgraphEndpoints: any[];
  setDeploymentURL: any;
  currentDeploymentURL: string;
  pendingSubgraphData: any;
  decentralizedDeployments: any;
  showDropDown: Boolean;
  failedToLoad: Boolean;
}

export const DeploymentOverlayDropDown = ({
  data,
  subgraphEndpoints,
  setDeploymentURL,
  currentDeploymentURL,
  pendingSubgraphData,
  decentralizedDeployments,
  showDropDown,
  failedToLoad,
}: DeploymentOverlayDropDownProps) => {
  let currentDeploymentLabel = currentDeploymentURL;
  let deploymentsList: any[] = [];
  let componentRenderOverwrite = undefined;
  try {
    let protocolObj: any = null;
    let protocolObjKey = Object.keys(subgraphEndpoints[schemaMapping[data.protocols[0].type]]).find((x) =>
      x.includes(data.protocols[0].slug),
    );
    if (protocolObjKey) {
      protocolObj = subgraphEndpoints[schemaMapping[data.protocols[0].type]][protocolObjKey];
    } else {
      protocolObjKey = Object.keys(subgraphEndpoints[schemaMapping[data.protocols[0].type]]).find((x) =>
        x.includes(data.protocols[0].slug.split("-")[0]),
      );
      if (protocolObjKey) {
        protocolObj = subgraphEndpoints[schemaMapping[data.protocols[0].type]][protocolObjKey];
      }
    }

    if (protocolObj) {
      if (decentralizedDeployments[data.protocols[0].slug]) {
        protocolObj[decentralizedDeployments[data.protocols[0].slug].network + " (DECENTRALIZED)"] =
          "https://gateway.thegraph.com/api/" +
          process.env.REACT_APP_GRAPH_API_KEY +
          "/subgraphs/id/" +
          decentralizedDeployments[data.protocols[0].slug].subgraphId;
      }
      if (pendingSubgraphData) {
        if (Object.keys(pendingSubgraphData).length > 0) {
          Object.keys(pendingSubgraphData).forEach((depoKey) => {
            protocolObj[depoKey + " (PENDING)"] =
              "https://api.thegraph.com/subgraphs/id/" + pendingSubgraphData[depoKey].subgraph;
          });
        }
      }
      deploymentsList = Object.keys(protocolObj).map((chain) => {
        return data.protocols[0].name + " " + chain + " " + protocolObj[chain];
      });
      deploymentsList.unshift("NONE (CLEAR)");
      currentDeploymentLabel = deploymentsList.find((x) => x.includes(currentDeploymentURL)) || currentDeploymentURL;
    }
  } catch (err) {
    componentRenderOverwrite = null;
    console.log(err)
  }
  const [textInput, setTextInput] = useState<string>(currentDeploymentLabel);
  if (componentRenderOverwrite === null) {
    return null;
  }
  if (failedToLoad) {
    return null;
  }
  if (!showDropDown) {
    return <CircularProgress size={20} sx={{ mx: 2 }} />;
  }
  return (
    <>
      <Autocomplete
        options={isValidHttpUrl(textInput) ? [textInput] : deploymentsList}
        value={currentDeploymentLabel}
        sx={{ width: 400, height: "40px", padding: "0" }}
        size="small"
        onChange={(event: React.SyntheticEvent) => {
          const targEle = event?.target as HTMLLIElement;
          const deploymentSelected = deploymentsList.find((x: string) => {
            return x.trim() === targEle.innerText.trim();
          });
          if (deploymentSelected === "NONE (CLEAR)") {
            setDeploymentURL("");
          } else if (deploymentSelected) {
            setDeploymentURL("http" + deploymentSelected.split("http")[1]);
          } else if (isValidHttpUrl(textInput)) {
            setDeploymentURL(textInput);
          }
        }}
        renderInput={(params) => (
          <ComboBoxInput
            style={{ width: 400, height: "40px", padding: "0" }}
            label="Select Deployment To Overlay"
            params={params}
            setTextInput={setTextInput}
          />
        )}
      />
    </>
  );
};

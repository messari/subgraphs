import { Autocomplete, Typography } from "@mui/material";
import React, { useState } from "react";
import { ComboBoxInput } from "./ComboBoxInput";

interface DeploymentsDropDownProps {
  setDeploymentURL: React.Dispatch<React.SetStateAction<string>>;
  setDefiLlamaSlug: React.Dispatch<React.SetStateAction<string>>;

  deploymentURL: string;
  deploymentJSON: { [x: string]: any };
}

export const DeploymentsDropDown = ({
  setDeploymentURL,
  setDefiLlamaSlug,
  deploymentURL,
  deploymentJSON,
}: DeploymentsDropDownProps) => {
  //   array of objects containing label and subgraph url
  const selectionsSet: { [x: string]: any }[] = [];
  Object.entries(deploymentJSON).forEach(([protocolName, protocolValue]) => {
    if (protocolValue.slug.length > 0) {
      protocolValue.defiLlamaNetworks.forEach((networkName: string) => {
        if (protocolValue.subgraphNetworks[networkName]) {
          selectionsSet.push({
            label: protocolName.split("-").join(" ") + " (" + networkName + ")",
            url: protocolValue.subgraphNetworks[networkName],
          });
        }
      });
    }
  });

  let inputTextValue = "Select a protocol";
  if (deploymentURL) {
    const selectionsSetVal = selectionsSet.find((x) => x.url === deploymentURL);
    if (selectionsSetVal?.label) {
      inputTextValue = selectionsSetVal.label;
    }
  }
  const [textInput, setTextInput] = useState<string>(inputTextValue);
  return (
    <>
      <Typography variant="h6">Select a protocol</Typography>
      <Autocomplete
        options={selectionsSet.map((x) => x.label)}
        inputValue={textInput}
        sx={{ maxWidth: 1000, my: 2 }}
        onChange={(event: React.SyntheticEvent) => {
          // Upon selecting a protocol from the list, get the protocol id and navigate to the routing for that protocol
          const targEle = event?.target as HTMLLIElement;
          const subgraphObj = selectionsSet.find((x) => x.label === targEle.innerText);
          if (targEle.innerText && subgraphObj) {
            setDefiLlamaSlug(targEle.innerText);
            setDeploymentURL(subgraphObj.url);
          }

          // find the obj in selectionSet with the label = to selected input label, set the url value of that depo as the depo url
        }}
        renderInput={(params) => <ComboBoxInput label="Protocols List" params={params} setTextInput={setTextInput} />}
      />
    </>
  );
};

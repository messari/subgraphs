import { Autocomplete, Typography } from "@mui/material";
import React, { useState } from "react";
import { useNavigate } from "react-router";
import { ComboBoxInput } from "./ComboBoxInput";

interface DeploymentsDropDownProps {
  setDeploymentURL: React.Dispatch<React.SetStateAction<string>>;
  setDefiLlamaSlug: React.Dispatch<React.SetStateAction<string>>;
  setIssues: any;
  issuesProps: any;
  deploymentURL: string;
  deploymentJSON: { [x: string]: any };
}

export const DeploymentsDropDown = ({
  setDeploymentURL,
  setDefiLlamaSlug,
  setIssues,
  issuesProps,
  deploymentURL,
  deploymentJSON,
}: DeploymentsDropDownProps) => {
  const navigate = useNavigate();

  //   array of objects containing label and subgraph url
  const href = new URL(window.location.href);
  const p = new URLSearchParams(href.search);
  const protocolStr = p.get("protocol");
  const networkStr = p.get("network");

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

  if (protocolStr && !deploymentURL) {
    const selection = selectionsSet.find(
      (protocol) => protocol.label.includes(protocolStr.split("-").join(" ")) && protocol.label.includes(networkStr),
    );
    if (selection) {
      if (textInput === "Select a protocol") {
        setTextInput(selection.label);
      }
      setDefiLlamaSlug(selection.label);
      setDeploymentURL(selection.url);
    } else if (!(issuesProps.filter((x: any) => x.type === "QRY").length > 0) && selectionsSet.length > 0) {
      setIssues([
        {
          message: `"protocol=${protocolStr}"//"network=${networkStr}"`,
          type: "QRY",
          level: "critical",
          fieldName: deploymentURL,
        },
      ]);
    }
  }
  return (
    <>
      <Typography variant="h6">Select a protocol to compare data between Defi Llama and Messari subgraphs</Typography>
      <Autocomplete
        options={selectionsSet.map((x) => x.label)}
        value={textInput}
        inputValue={textInput}
        sx={{ maxWidth: 1000, my: 2 }}
        onChange={(event: React.SyntheticEvent) => {
          // Upon selecting a protocol from the list, get the protocol id and navigate to the routing for that protocol
          const targEle = event?.target as HTMLLIElement;
          const subgraphObj = selectionsSet.find((x) => x.label === targEle.innerText);
          if (targEle.innerText && subgraphObj) {
            p.set("protocol", targEle.innerText?.split(" (")[0].split(" ").join("-"));
            p.set("network", targEle.innerText?.split(" (")[1].split(")")[0]);
            navigate("?" + p.toString());
            setTextInput(targEle.innerText);
            setDefiLlamaSlug(targEle.innerText);
            setDeploymentURL(subgraphObj.url);
          }

          // find the obj in selectionSet with the label = to selected input label, set the url value of that depo as the depo url
        }}
        renderInput={(params) => (
          <ComboBoxInput label="Protocols List" params={params} setTextInput={(x) => setTextInput(x)} />
        )}
      />
    </>
  );
};

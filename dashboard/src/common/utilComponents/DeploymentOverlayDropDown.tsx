import { Autocomplete, CircularProgress, Typography } from "@mui/material";
import React, { useState } from "react";
import { isValidHttpUrl, schemaMapping } from "../../utils";
import { ComboBoxInput } from "./ComboBoxInput";

interface DeploymentOverlayDropDownProps {
    data: any;
    subgraphEndpoints: any[];
    setDeploymentURL: any;
    currentDeploymentURL: string;
    showDropDown: Boolean;
    failedToLoad: Boolean;
}

export const DeploymentOverlayDropDown = ({
    data,
    subgraphEndpoints,
    setDeploymentURL,
    currentDeploymentURL,
    showDropDown,
    failedToLoad
}: DeploymentOverlayDropDownProps) => {
    let currentDeploymentLabel = currentDeploymentURL;
    let deploymentsList: any[] = [];
    let componentRenderOverwrite = undefined;
    try {
        const protocolObj = subgraphEndpoints[schemaMapping[data.protocols[0].type]][data.protocols[0].slug];
        if (protocolObj) {
            deploymentsList = Object.keys(protocolObj).map(chain => {
                return data.protocols[0].name + ' ' + chain + ' ' + protocolObj[chain];
            });
            currentDeploymentLabel = deploymentsList.find(x => x.includes(currentDeploymentURL)) || currentDeploymentURL;
        }
    } catch (err) {
        componentRenderOverwrite = null;
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
                    if (deploymentSelected) {
                        setDeploymentURL('http' + deploymentSelected.split('http')[1]);
                    } else if (isValidHttpUrl(textInput)) {
                        setDeploymentURL(textInput);
                    }
                }}
                renderInput={(params) => (
                    <ComboBoxInput style={{ width: 400, height: "40px", padding: "0" }} label="Select Deployment To Overlay" params={params} setTextInput={setTextInput} />
                )}
            />
        </>
    );
};

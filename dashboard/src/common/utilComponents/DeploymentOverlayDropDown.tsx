import { Autocomplete, Typography } from "@mui/material";
import React, { useState } from "react";
import { ComboBoxInput } from "./ComboBoxInput";

interface DeploymentOverlayDropDownProps {
    deploymentsList: any[];
    setDeploymentURL: any;
    currentDeploymentURL: string;
}

export const DeploymentOverlayDropDown = ({
    deploymentsList,
    setDeploymentURL,
    currentDeploymentURL
}: DeploymentOverlayDropDownProps) => {
    const options = deploymentsList.map(x => x.label);
    const currentDeploymentLabel = deploymentsList.find(x => x.value === currentDeploymentURL);
    return (
        <>
            <Autocomplete
                options={options}
                value={currentDeploymentLabel}
                sx={{ width: 400, height: "40px", padding: "0" }}
                size="small"
                onChange={(event: React.SyntheticEvent) => {
                    const targEle = event?.target as HTMLLIElement;
                    const deploymentSelected = deploymentsList.find(x => {
                        return x.label.trim() === targEle.innerText.trim();
                    });
                    if (deploymentSelected) {
                        setDeploymentURL(deploymentSelected.value);
                    }
                }}
                renderInput={(params) => (
                    <ComboBoxInput style={{ width: 400, height: "40px", padding: "0" }} label="Select Deployment To Overlay" params={params} setTextInput={(x: string) => console.log(x)} />
                )}
            />
        </>
    );
};

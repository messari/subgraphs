import { Autocomplete, Typography } from "@mui/material";
import React, { useState } from "react";
import { useNavigate } from "react-router";
import { ComboBoxInput } from "./ComboBoxInput";

interface ProtocolTypeDropDownProps {
  protocolTypeList: string[];
  setProtocolType: any;
  currentProtocolType: string;
}

export const ProtocolTypeDropDown = ({
  protocolTypeList,
  setProtocolType,
  currentProtocolType,
}: ProtocolTypeDropDownProps) => {
  const options = protocolTypeList;
  return (
    <>
      <Autocomplete
        options={options}
        value={currentProtocolType}
        sx={{ width: 400, height: "100%" }}
        onChange={(event: React.SyntheticEvent) => {
          const targEle = event?.target as HTMLLIElement;
          setProtocolType(targEle.innerText);
        }}
        renderInput={(params) => (
          <ComboBoxInput label="Protocol Type Selection" params={params} setTextInput={(x: string) => console.log(x)} />
        )}
      />
    </>
  );
};

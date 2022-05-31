import { Autocomplete, TextField, Typography } from "@mui/material";
import React, { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ComboBoxInput } from "./ComboBoxInput";

interface ProtocolDropDownProps {
  setProtocolId: React.Dispatch<React.SetStateAction<string>>;
  protocols: [];
}

export const ProtocolDropDown = ({ setProtocolId, protocols }: ProtocolDropDownProps) => {
  const href = new URL(window.location.href);
  const p = new URLSearchParams(href.search);
  const protocolId = p.get("protocolId");
  const navigate = useNavigate();
  // Create the array of protocol selections in the drop down
  const options = protocols.map((pro: any) => {
    return pro.id + " / " + pro.name;
  });
  // Get the array entry for the current selected protocol
  const protocol = protocols.find((m: any) => m.id === protocolId) || { name: "Selected Protocol" };
  let inputTextValue = "Select a protocol";
  if (protocolId) {
    inputTextValue = protocolId + " / " + protocol.name;
  }
  const [textInput, setTextInput] = useState<string>(inputTextValue);
  return (
    <>
      <Typography variant="h6">Select a protocol</Typography>
      <Autocomplete
        options={options}
        inputValue={textInput}
        sx={{ maxWidth: 1000, my: 2 }}
        onChange={(event: React.SyntheticEvent) => {
          // Upon selecting a protocol from the list, get the protocol id and navigate to the routing for that protocol
          const targEle = event?.target as HTMLLIElement;
          setTextInput(targEle.innerText);
          p.delete("view");
          if (targEle.innerText) {
            setProtocolId(targEle.innerText?.split(" / ")[0]);
            navigate(
              `?endpoint=${p.get("endpoint")}&tab=${p.get("tab")}&protocolId=${targEle.innerText?.split(" / ")[0]}`,
            );
          }
        }}
        renderInput={(params) => <ComboBoxInput label="Protocol List" params={params} setTextInput={setTextInput} />}
      />
    </>
  );
};

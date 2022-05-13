import { MenuItem, Select, SelectChangeEvent, Autocomplete, TextField } from "@mui/material";
import React, { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ComboBoxInput } from "./ComboBoxInput";

interface PoolDropDownProps {
  poolId: string;
  setPoolId: React.Dispatch<React.SetStateAction<string>>;
  setWarning: React.Dispatch<React.SetStateAction<{ message: string, type: string }[]>>;
  markets: [];
}

export const PoolDropDown = ({ poolId, setPoolId, setWarning, markets }: PoolDropDownProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const scrollToView = searchParams.get("view") || "";
  const options = markets.map((market: any) => {
    return market.id + '-' + market.name;
  });
  const pool = markets.find((m: any) => m.id === poolId) || { name: "Selected Pool" };
  let inputTextValue = "Select a pool";
  if (poolId) {
    inputTextValue = poolId + '-' + pool.name;
  }
  const [textInput, setTextInput] = useState<string>(inputTextValue);
  return (
    <>
      <h3 style={{ marginLeft: "16px" }}>Select a pool</h3>
      {/* <Select
        fullWidth
        sx={{ maxWidth: 1000, margin: 2 }}
        labelId="demo-simple-select-filled-label"
        id="demo-simple-select-filled"
        value={poolId}
        onChange={(event: SelectChangeEvent) => {
          setWarning([]);
          setPoolId(event.target.value)
        }}
      >
        <MenuItem value="">
          <em>No Pool Selected</em>
        </MenuItem>
        {
          markets.map((market: any) => {
            return (
              <MenuItem value={market.id}>
                <em>{market.id} - {market.name}</em>
              </MenuItem>
            )
          })
        }
      </Select> */}
      <Autocomplete
        options={options}
        inputValue={textInput}
        sx={{ maxWidth: 1000, margin: 2 }}
        onChange={(event: React.SyntheticEvent) => {
          setWarning([]);
          const targEle = (event?.target as HTMLLIElement);
          setTextInput(targEle.innerText);
          searchParams.delete('view');
          if (targEle.innerText) {
            setPoolId(targEle.innerText?.split("-")[0]);
            navigate('?subgraph=' + searchParams.get('subgraph') + '&tab=' + searchParams.get('tab') + '&poolId=' + targEle.innerText?.split("-")[0]);
          }
        }}
        renderInput={
          (params) => <ComboBoxInput params={params} setTextInput={setTextInput} />}
      />
    </>)
}
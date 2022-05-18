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
  // Create the array of pool selections in the drop down
  const options = markets.map((market: any) => {
    return market.id + ' / ' + market.name;
  });
  // Get the array entry for the current selected pool
  const pool = markets.find((m: any) => m.id === poolId) || { name: "Selected Pool" };
  let inputTextValue = "Select a pool";
  if (poolId) {
    inputTextValue = poolId + ' / ' + pool.name;
  }
  const [textInput, setTextInput] = useState<string>(inputTextValue);
  return (
    <>
      <h3 style={{ marginLeft: "16px" }}>Select a pool</h3>
      <Autocomplete
        options={options}
        inputValue={textInput}
        sx={{ maxWidth: 1000, margin: 2 }}
        onChange={(event: React.SyntheticEvent) => {
          // Upon selecting a pool from the list, get the pool id and navigate to the routing for that pool
          setWarning([]);
          const targEle = (event?.target as HTMLLIElement);
          setTextInput(targEle.innerText);
          searchParams.delete('view');
          if (targEle.innerText) {
            setPoolId(targEle.innerText?.split(" / ")[0]);
            navigate(`?subgraph=${searchParams.get('subgraph')}&tab=${searchParams.get('tab')}&poolId=${targEle.innerText?.split(" / ")[0]}`);
          }
        }}
        renderInput={
          (params) => <ComboBoxInput params={params} setTextInput={setTextInput} />}
      />
    </>)
}
import { Autocomplete, Typography } from "@mui/material";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ComboBoxInput } from "./ComboBoxInput";

/**
 * simple check if a string might be an address. Does not verify that the address is a valid pool address.
 * In the future, we can try a query to liquidityPools to validate the address exists for the protocol
 *
 * @param input user input in the dropdown
 * @returns
 */
const isAddress = (input: string) => {
  return input.startsWith("0x") && input.length === 42;
};

interface PoolDropDownProps {
  poolId: string;
  setPoolId: React.Dispatch<React.SetStateAction<string>>;
  setIssues: React.Dispatch<
    React.SetStateAction<{ message: string; type: string; level: string; fieldName: string }[]>
  >;
  pools: { [x: string]: any }[];
}

export const PoolDropDown = ({ poolId, setPoolId, setIssues, pools }: PoolDropDownProps) => {
  const navigate = useNavigate();
  // Create the array of pool selections in the drop down
  const options = pools.map((market: any) => {
    return market.id + " / " + market.name;
  });
  // Get the array entry for the current selected pool
  const pool = pools.find((m: any) => m.id === poolId) || { name: "Selected Pool" };
  let inputTextValue = "Select a pool";
  if (poolId) {
    inputTextValue = poolId + " / " + pool.name;
  }
  const [textInput, setTextInput] = useState<string>(inputTextValue);

  return (
    <>
      <Typography variant="h6">Select a pool</Typography>
      <Typography>Search from the top 100 pools by TVL or filter by any pool address.</Typography>
      <Typography>NOTE: we do not currently validate that the address is an existing pool</Typography>
      <Autocomplete
        options={isAddress(textInput) ? [textInput] : options}
        inputValue={textInput}
        sx={{ maxWidth: 1000, my: 2 }}
        onChange={(event: React.SyntheticEvent) => {
          // Upon selecting a pool from the list, get the pool id and navigate to the routing for that pool
          const href = new URL(window.location.href);
          const p = new URLSearchParams(href.search);
          setIssues([]);
          const targEle = event?.target as HTMLLIElement;
          setTextInput(targEle.innerText);
          p.delete("view");
          if (targEle.innerText) {
            p.set("poolId", targEle.innerText?.split(" / ")[0]);
            setPoolId(targEle.innerText?.split(" / ")[0]);
            navigate("?" + p.toString().split("%2F").join("/"));
          }
        }}
        renderInput={(params) => <ComboBoxInput label="PoolList" params={params} setTextInput={setTextInput} />}
      />
    </>
  );
};

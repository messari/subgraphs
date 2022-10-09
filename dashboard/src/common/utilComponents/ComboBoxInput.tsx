import { AutocompleteRenderInputParams, TextField } from "@mui/material";

interface ComboBoxInputProps {
  setTextInput: any;
  params: AutocompleteRenderInputParams;
  label: string;
}

export const ComboBoxInput = ({ setTextInput, params, label }: ComboBoxInputProps) => {
  return (
    <TextField
      onFocus={() => setTextInput("")}
      onChange={(inp) => setTextInput(inp.target.value)}
      {...params}
      label={label}
      variant="outlined"
    />
  );
};

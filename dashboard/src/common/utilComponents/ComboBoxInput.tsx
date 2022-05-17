import { AutocompleteRenderInputParams, TextField } from "@mui/material"

interface ComboBoxInputProps {
    setTextInput: React.Dispatch<React.SetStateAction<string>>;
    params: AutocompleteRenderInputParams;
}

export const ComboBoxInput = ({ setTextInput, params }: ComboBoxInputProps) => {
    return <TextField onFocus={() => setTextInput("")} onChange={(inp) => setTextInput(inp.target.value)} {...params} label="Pool List" variant="outlined" />
}
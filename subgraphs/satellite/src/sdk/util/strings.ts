export function isValidEVMAddress(input: string): bool {
  if (input.length !== 42) {
    return false;
  }

  if (input.length == 42 && input.substring(0, 2).toLowerCase() == "0x") {
    return true;
  }

  return false;
}

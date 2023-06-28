export function isValidEVMAddress(input: string): bool {
  const ADDRESS_STR_LENGTH = 42;
  if (input.length !== ADDRESS_STR_LENGTH) {
    return false;
  }

  if (
    input.length == ADDRESS_STR_LENGTH &&
    input.substring(0, 2).toLowerCase() == "0x"
  ) {
    return true;
  }

  return false;
}

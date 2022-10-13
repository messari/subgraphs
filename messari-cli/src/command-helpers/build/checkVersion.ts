// Makes sure the version specified in the json file is valid.
export function isValidVersion(version) {
  if (!version) {
    return false
  }

  // Make sure version length is 3 (major.minor.patch)
  if (version.split('.').length !== 3) {
    return false
  }

  // Make sure each integer is valid
  const array = version.split('.')
  if (!array.every((element) => !element.isNaN)) {
    return false
  }

  return true
}

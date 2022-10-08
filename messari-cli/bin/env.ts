const execSync = require('child_process').execSync

// Change to the directory of this file
process.chdir(__dirname)

// Get the path to the head of the `Subgraphs` repo
export const MESSARI_REPO_PATH = execSync('git rev-parse --show-toplevel')
  .toString()
  .trim()

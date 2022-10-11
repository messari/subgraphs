import { MESSARI_REPO_PATH } from '../bin/env'

const { build } = require('gluegun')

/**
 * Create the cli and kick it off
 */

async function run(argv) {
  // create a CLI runtime
  const cli = build()
    .brand('messari')
    .src(__dirname)
    .plugins('./node_modules', { matching: 'messari-*', hidden: true })
    .help() // provides default for help, h, --help, -h
    .version() // provides default for version, v, --version, -v
    .defaultCommand()
    .create()

  console.log(MESSARI_REPO_PATH)

  // and run it
  const toolbox = await cli.run(argv)

  // send it back (for testing, mostly)
  return toolbox
}

module.exports = { run }

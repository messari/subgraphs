import * as fs from 'fs'
import * as chalk from 'chalk'
import { GluegunToolbox } from 'gluegun'
import {
  ScriptGeneratorArgs,
  ScriptGenerator,
} from '../command-helpers/build/scriptGenerator'

import { validateDeploymentJson } from '../../../deployment/validation/validateDeploymentJson'
import { getScopeAlias, getServiceAlias } from '../command-helpers/build/alias'
import { isValidVersion } from '../command-helpers/build/checkVersion'
import { Executor as ExecutorClass } from '../command-helpers/build/execution'
import { MESSARI_REPO_PATH } from '../../bin/env'

const HELP: string = `
${chalk.bold('messari build')} ${chalk.bold('[<deployment-id>]')} [options]

Options:

    -s, --service        Service to deploy to < hosted-service | subgraph-studio | cronos-portal>
    -v, --version        Specify the version of the subgraph deployment - Only relevant for subgraph studio testing deployments < e.g. 1.0.0 >
    -t, --token          API token to use for the deployment
    -r, --target         Target account for the deployment (i.e. messari)
        --slug <slug>    The slug to use for the deployment {optional - replace deployment.json slug}
        --base           Specifies that you want the build/deploy command to apply to all protocols in a subgraph folder {default: false}
    -d, --deploy         Deploy the build to the specified service {default: false}
    -l, --log            Print results to the console {default: false}
    -h, --help           Show usage information {default: false}
`

module.exports = {
  name: 'build',
  alias: ['b'],
  run: async (toolbox: GluegunToolbox) => {
    const {
      parameters,
      print: { info },
    } = toolbox

    let id = parameters.first

    let {
      l,
      log,
      scope,
      h,
      help,
      r,
      target,
      s,
      service,
      d,
      deploy,
      base,
      slug,
      t,
      token,
      v,
      version,
    } = parameters.options

    log = (l || log) === undefined ? false : true
    scope = getScopeAlias(scope)
    target = r || target
    service = getServiceAlias(s || service)
    deploy = (d || deploy) === undefined ? false : true
    base = base === undefined ? false : true
    token = t || token
    version = v || version
    help = (h || help) === undefined ? false : true

    // Show help text if requested
    if (help) {
      info(HELP)
      return
    }

    // Check if the deployment.json file exists
    if (!fs.existsSync(`${MESSARI_REPO_PATH}/deployment/deployment.json`)) {
      info(
        'deployment.json file not found - Please move to subgraph directory at <messari-repo>/subgraphs/subgraphs/**'
      )
      return
    }

    // Read the deployment.json file
    const deploymentJSONData = JSON.parse(
      fs.readFileSync(`${MESSARI_REPO_PATH}/deployment/deployment.json`, 'utf8')
    )

    // Check if deployment.json data is valid
    try {
      validateDeploymentJson(deploymentJSONData)
    } catch (e) {
      info(e.message)
      return
    }

    const askId = {
      type: 'input',
      name: 'id',
      message: 'Deployment id to use for the build/deployment',
      skip: id !== undefined,
    }

    const askService = {
      type: 'select',
      name: 'service',
      message: 'Choose a service:',
      choices: ['subgraph-studio', 'hosted-service', 'cronos-portal'],
      skip: !deploy,
    }

    const askTarget = {
      type: 'input',
      name: 'target',
      message: 'Target to deploy to:',
      skip: !deploy,
    }

    if (id === undefined) {
      id = (await toolbox.prompt.ask(askId)).id
    }

    if (
      !['subgraph-studio', 'hosted-service', 'cronos-portal'].includes(service)
    ) {
      service = (await toolbox.prompt.ask(askService)).service
    }

    if (target === undefined) {
      target = (await toolbox.prompt.ask(askTarget)).target
    }

    const askToken = {
      type: 'input',
      name: 'token',
      message: 'Please enter Cronos Portal API token:',
      skip: !deploy || !(service == 'cronos-portal') || token,
    }

    const askVersion = {
      type: 'input',
      name: 'version',
      message: 'Please enter valid deploymemt version (e.g. 1.0.0):',
      skip:
        !deploy || !(service == 'subgraph-studio') || isValidVersion(version),
    }

    if (deploy === true && version !== undefined) {
      while (!isValidVersion(version)) {
        version = (await toolbox.prompt.ask(askVersion)).version
      }
    }

    if (token === undefined && deploy && service == 'cronos-portal') {
      token = (await toolbox.prompt.ask(askToken)).token
    }

    const args: ScriptGeneratorArgs = {
      id,
      base,
      target,
      service,
      deploy,
      token,
      slug,
      log,
      version,
    }

    // Use arguments to generate scrips for building subgraph
    let scriptGenerator = new ScriptGenerator(deploymentJSONData, args)

    try {
      await scriptGenerator.prepare()
    } catch (e) {
      info(e.message)
      return
    }

    let Executor = new ExecutorClass(
      scriptGenerator.deployments,
      args.deploy,
      args.log
    )
    Executor.execute()
  },
}

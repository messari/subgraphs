import { MESSARI_REPO_PATH } from '../../../bin/env'
import { Deployment } from './scriptGenerator'

const { exec } = require('child_process')
const fs = require('fs')

export class Executor {
  logs: string
  results: string
  deploymentIndex: number
  scriptIndex: number
  httpCounter: number
  httpCounterLimit: number
  deployments: Deployment[]
  scriptKeys: string[]
  deploy: boolean
  log: boolean

  constructor(deployments: Deployment[], deploy: boolean, log: boolean) {
    this.logs = ''
    this.results = 'RESULTS:\n'
    this.deploymentIndex = 0
    this.scriptIndex = 0
    this.httpCounter = 0
    this.httpCounterLimit = 3
    this.deployments = deployments
    this.deploy = deploy
    this.log = log
  }

  isHTTPError(stderr): boolean {
    return stderr.includes('Error: HTTP Error')
  }

  shouldRetry(): boolean {
    if (this.httpCounter < this.httpCounterLimit) {
      return true
    }

    this.httpCounter += 1
    return false
  }

  appendLogs(stdout, stderr, error) {
    this.logs = `${this.logs}stdout: ${stdout}stderr: ${stderr}`
    if (error) {
      this.logs = `${this.logs}error: ${error}`
    }
  }

  appendResult(error) {
    if (error) {
      if (this.deploy === false) {
        this.results += `Build Failed: ${
          this.deployments[this.deploymentIndex].location
        }\n`
      } else {
        this.results += `Deployment Failed: ${
          this.deployments[this.deploymentIndex].location
        }\n`
      }

      return
    }

    if (this.deploy === false) {
      this.results += `Build Succesful: ${
        this.deployments[this.deploymentIndex].location
      }\n`
    } else {
      this.results += `Deployment Succesful: ${
        this.deployments[this.deploymentIndex].location
      }\n`
    }
  }

  printOutput() {
    fs.writeFile(
      'results.txt',
      this.logs.replace(/\u00[^m]*?m/g, ''),
      (err) => {
        if (err) throw new Error(err)
      }
    )

    // Print the logs if printlogs is 't' or 'true'
    if (this.log) {
      console.log(this.logs)
    }
    console.log(`\n${this.results}END\n\n`)
  }

  handleSuccess(stdout, stderr, error) {
    this.appendLogs(stdout, stderr, error)
    this.httpCounter = 0
    this.scriptIndex += 1

    if (
      this.scriptIndex === this.deployments[this.deploymentIndex].scripts.length
    ) {
      this.appendResult(error)
      this.deploymentIndex += 1
      this.scriptIndex = 0
      return
    }
  }

  handleFailure(stdout, stderr, error) {
    this.appendLogs(stdout, stderr, error)
    this.appendResult(error)
    this.deploymentIndex += 1
    this.scriptIndex = 0
    this.httpCounter = 0
    return this.executeNextScript()
  }

  async execute() {
    this.executeNextScript()
  }

  executeNextScript() {
    if (this.deploymentIndex >= this.deployments.length) {
      return this.printOutput()
    }

    if (this.scriptIndex == 0) {
      process.chdir(
        `${MESSARI_REPO_PATH}/subgraphs/${
          this.deployments[this.deploymentIndex].base
        }`
      )
    }

    let script =
      this.deployments[this.deploymentIndex].scripts[this.scriptIndex]

    exec(script, (error, stdout, stderr) => {
      if (!error) {
        // increase counters and continue
        this.handleSuccess(stdout, stderr, null)
        return this.executeNextScript()
      }

      if (!this.isHTTPError(stderr) || !this.shouldRetry()) {
        // append logs to `result` and continue with the next deployment
        return this.handleFailure(stdout, stderr, error)
      }

      // here we know it is an http error. We can retry or skip it
      // Increse http counter and retry
      this.httpCounter += 1
      return this.executeNextScript()
    })
  }
}

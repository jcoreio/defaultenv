#!/usr/bin/env node

'use strict'

var defaultEnv = require('./index')
var fs = require('fs')

function run(command, args) {
  try {
    // eslint-disable-next-line @jcoreio/implicit-dependencies/no-implicit
    var kexec = require('kexec')
    kexec(command, args)
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') throw err

    var child_process = require('child_process')
    var proc = child_process.spawn(command, args, { stdio: 'inherit' })
    proc.on('exit', function (code, signal) {
      process.on('exit', function () {
        if (signal) {
          process.kill(process.pid, signal)
        } else {
          process.exit(code)
        }
      })
    })
  }
}

module.exports = defaultEnv

var argv = process.argv.slice(2)

var command, commandArgs, envFiles, myArgs

var dashIndex = argv.indexOf('--')
if (dashIndex >= 0) {
  command = argv[dashIndex + 1]
  commandArgs = argv.slice(dashIndex + 2)
  envFiles = argv.slice(0, dashIndex).filter(function (file) {
    return !file.startsWith('-')
  })
  myArgs = argv.slice(0, dashIndex).filter(function (arg) {
    return arg.startsWith('-')
  })
} else {
  for (var envFileIndex = 0; envFileIndex < argv.length; envFileIndex++) {
    if (!argv[envFileIndex].startsWith('-')) break
  }
  myArgs = argv.slice(0, envFileIndex)
  envFiles = [argv[envFileIndex]]
  command = argv[envFileIndex + 1]
  commandArgs = argv.slice(envFileIndex + 2)
  if (myArgs.indexOf('-p') >= 0 || myArgs.indexOf('--print') >= 0) {
    envFiles = argv.slice(envFileIndex)
  }
}

var options = {
  noDotenv: myArgs.indexOf('--no-dotenv') >= 0,
  force: myArgs.indexOf('-f') >= 0 || myArgs.indexOf('--force') >= 0,
  print: myArgs.indexOf('-p') >= 0 || myArgs.indexOf('--print') >= 0,
}

if (!command && !options.print) {
  process.stdout.write(fs.readFileSync(require.resolve('./usage.txt'), 'utf8'))
  process.exit(0)
}

try {
  defaultEnv(envFiles, options)
} catch (error) {
  console.error(error.stack) // eslint-disable-line no-console
  process.exit(1)
}

if (options.print) process.exit(0)

run(command, commandArgs)

#!/usr/bin/env node

'use strict'

var fs = require('fs')
var path = require('path')
var dotenv = require('dotenv')
var defaults = require('lodash.defaults')

function defaultEnv(envFiles, options) {
  options = options || {}
  var env = options.force || options.print ? {} : process.env
  var key
  for (var i = 0; i < envFiles.length; i++) {
    var file = envFiles[i]
    var defaultValues
    if (/\.js(on)?$/.test(file)) {
      defaultValues = require(path.resolve(process.cwd(), file))
      if (!(defaultValues instanceof Object)) {
        throw new Error(file + ' is invalid; it should export an object, got ' + defaultValues + ' instead')
      }
      for (key in defaultValues) {
        if (typeof defaultValues[key] !== 'string') {
          throw new Error(file + ' is invalid; value for ' + key + ' should be a string, got ' + defaultValues[key] + ' instead')
        }
      }
    } else {
      defaultValues = dotenv.parse(fs.readFileSync(file, 'utf8'))
    }
    defaults(env, defaultValues)
  }
  if (options.print) {
    for (key in env) console.log('export ' + key + '=' + env[key]) // eslint-disable-line no-console
  }
  if (options.force) {
    for (key in env) process.env[key] = env[key]
  }
}

function run(command, args) {
  try {
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

if (!module.parent) {
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
    force: myArgs.indexOf('-f') >= 0 || myArgs.indexOf('--force') >= 0,
    print: myArgs.indexOf('-p') >= 0 || myArgs.indexOf('--print') >= 0,
  }

  if (!command && !options.print) {
    /* eslint-disable no-console */
    process.stdout.write(fs.readFileSync(require.resolve('./usage.txt'), 'utf8'))
    process.exit(0)
    /* eslint-enable no-console */
  }

  try {
    defaultEnv(envFiles, options)
  } catch (error) {
    console.error(error.stack) // eslint-disable-line no-console
    process.exit(1)
  }

  if (options.print) process.exit(0)

  run(command, commandArgs)
}


#!/usr/bin/env node

'use strict'

var fs = require('fs')
var path = require('path')
var dotenv = require('dotenv')
var defaults = require('lodash.defaults')

function defaultEnv(envFiles) {
  for (var i = 0; i < envFiles.length; i++) {
    var file = envFiles[i]
    var defaultValues
    if (fs.existsSync(file)) {
      if (/\.js(on)?$/.test(file)) {
        defaultValues = require(path.resolve(process.cwd(), file))
        if (!(defaultValues instanceof Object)) {
          throw new Error(file + ' is invalid; it should export an object, got ' + defaultValues + ' instead')
        }
        for (var key in defaultValues) {
          if (typeof defaultValues[key] !== 'string') {
            throw new Error(file + ' is invalid; value for ' + key + ' should be a string, got ' + defaultValues[key] + ' instead')
          }
        }
      } else {
        defaultValues = dotenv.parse(fs.readFileSync(file, 'utf8'))
      }
      defaults(process.env, defaultValues)
    }
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
  var myArgs = process.argv.slice(2)

  if (!myArgs.length) {
    /* eslint-disable no-console */
    console.log('Usage:')
    console.log('  defaultenv <envfile> <command> [...command args]')
    console.log('  defaultenv <envfile1> <envfile2> [...more env files] -- <command> [...command args]')
    process.exit(0)
    /* eslint-enable no-console */
  }

  var dashIndex = myArgs.indexOf('--')
  var envFiles = dashIndex >= 0 ? myArgs.slice(0, dashIndex) : [myArgs[0]]

  try {
    defaultEnv(envFiles)
  } catch (error) {
    console.error(error.stack) // eslint-disable-line no-console
    process.exit(1)
  }

  if (dashIndex >= 0) {
    run(myArgs[dashIndex + 1], myArgs.slice(dashIndex + 2))
  } else {
    run(myArgs[1], myArgs.slice(2))
  }
}


#!/usr/bin/env node

'use strict'

var fs = require('fs')
var dotenv = require('dotenv')
var defaults = require('lodash.defaults')

function defaultEnv(envFiles) {
  defaults.apply(undefined, [process.env].concat(envFiles.map(function (file) {
    return dotenv.parse(fs.readFileSync(file, 'utf8'))
  })))
}

function run(command, args) {
  try {
    var kexec = require("kexec")
    kexec(command, args)
  } catch (err) {
    if (err.code !== "MODULE_NOT_FOUND") throw err

    var child_process = require("child_process")
    var proc = child_process.spawn(command, args, { stdio: "inherit" })
    proc.on("exit", function (code, signal) {
      process.on("exit", function () {
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
  var dashIndex = myArgs.indexOf('--')

  if (dashIndex >= 0) {
    defaultEnv(myArgs.slice(0, dashIndex))
    run(myArgs[dashIndex + 1], myArgs.slice(dashIndex + 2))
  } else {
    defaultEnv([myArgs[0]])
    run(myArgs[1], myArgs.slice(2))
  }
}


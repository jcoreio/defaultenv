#!/usr/bin/env node

"use strict";

var fs = require("fs");
var path = require("path");
var dotenv = require("dotenv");

function defaultEnv(envFiles, options) {
  options = options || {};
  var setvars = {};
  var file;

  function get(key) {
    return setvars[key] != null ? setvars[key] : process.env[key];
  }
  function setDefault(key, value) {
    if (typeof key !== "string") {
      throw new Error(
        file + " is invalid; keys should be strings, got " + key + " instead"
      );
    }
    if (typeof value !== "string") {
      throw new Error(
        file +
          " is invalid; value for " +
          key +
          " should be a string, got " +
          value +
          " instead"
      );
    }
    if (
      !Object.prototype.hasOwnProperty.call(setvars, key) &&
      (!Object.prototype.hasOwnProperty.call(process.env, key) ||
        options.force ||
        options.print)
    ) {
      setvars[key] = value;
      if (!options.noExport) process.env[key] = value;
    }
  }
  function setDefaults(defaults) {
    for (var key in defaults) {
      setDefault(key, defaults[key]);
    }
  }

  var key;
  if (!options.noDotenv) {
    var parsed = dotenv.config().parsed;
    setDefaults(parsed);
  }
  for (var i = 0; i < envFiles.length; i++) {
    file = envFiles[i];
    var defaultValues;
    if (/\.js(on)?$/.test(file)) {
      defaultValues = require(path.resolve(process.cwd(), file));
      if (defaultValues instanceof Function) {
        defaultValues({
          get: get,
          setDefault: setDefault,
          setDefaults: setDefaults,
        });
      } else if (defaultValues instanceof Object) {
        setDefaults(defaultValues);
      } else {
        throw new Error(
          file +
            " is invalid; it should export an object or a function, got " +
            defaultValues +
            " instead"
        );
      }
    } else {
      defaultValues = dotenv.parse(fs.readFileSync(file, "utf8"));
      setDefaults(defaultValues);
    }
  }
  if (options.print) {
    for (key in setvars) console.log("export " + key + "=" + setvars[key]); // eslint-disable-line no-console
  }
  return setvars;
}

function run(command, args) {
  try {
    var kexec = require("kexec");
    kexec(command, args);
  } catch (err) {
    if (err.code !== "MODULE_NOT_FOUND") throw err;

    var child_process = require("child_process");
    var proc = child_process.spawn(command, args, { stdio: "inherit" });
    proc.on("exit", function (code, signal) {
      process.on("exit", function () {
        if (signal) {
          process.kill(process.pid, signal);
        } else {
          process.exit(code);
        }
      });
    });
  }
}

module.exports = defaultEnv;

if (!module.parent) {
  var argv = process.argv.slice(2);

  var command, commandArgs, envFiles, myArgs;

  var dashIndex = argv.indexOf("--");
  if (dashIndex >= 0) {
    command = argv[dashIndex + 1];
    commandArgs = argv.slice(dashIndex + 2);
    envFiles = argv.slice(0, dashIndex).filter(function (file) {
      return !file.startsWith("-");
    });
    myArgs = argv.slice(0, dashIndex).filter(function (arg) {
      return arg.startsWith("-");
    });
  } else {
    for (var envFileIndex = 0; envFileIndex < argv.length; envFileIndex++) {
      if (!argv[envFileIndex].startsWith("-")) break;
    }
    myArgs = argv.slice(0, envFileIndex);
    envFiles = [argv[envFileIndex]];
    command = argv[envFileIndex + 1];
    commandArgs = argv.slice(envFileIndex + 2);
    if (myArgs.indexOf("-p") >= 0 || myArgs.indexOf("--print") >= 0) {
      envFiles = argv.slice(envFileIndex);
    }
  }

  var options = {
    noDotenv: myArgs.indexOf("--no-dotenv") >= 0,
    force: myArgs.indexOf("-f") >= 0 || myArgs.indexOf("--force") >= 0,
    print: myArgs.indexOf("-p") >= 0 || myArgs.indexOf("--print") >= 0,
  };

  if (!command && !options.print) {
    /* eslint-disable no-console */
    process.stdout.write(
      fs.readFileSync(require.resolve("./usage.txt"), "utf8")
    );
    process.exit(0);
    /* eslint-enable no-console */
  }

  try {
    defaultEnv(envFiles, options);
  } catch (error) {
    console.error(error.stack); // eslint-disable-line no-console
    process.exit(1);
  }

  if (options.print) process.exit(0);

  run(command, commandArgs);
}


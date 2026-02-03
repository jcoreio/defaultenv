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
        file + " is invalid; keys should be strings, got " + key + " instead",
      );
    }
    if (typeof value !== "string") {
      throw new Error(
        file +
          " is invalid; value for " +
          key +
          " should be a string, got " +
          value +
          " instead",
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
            " instead",
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

module.exports = defaultEnv;

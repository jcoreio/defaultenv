var path = require('path')
var exec = require('child_process').exec
var expect = require('chai').expect

var defaultEnv = require('../lib/index')

var root = path.resolve(__dirname, '..')

describe('defaultenv', function () {
  this.timeout(5000)
  it('exports defaultEnv function', function () {
    expect(process.env.FOO).not.to.exist
    defaultEnv([path.resolve(__dirname, 'foo.env')])
    expect(process.env.FOO).to.equal('foo')
    delete process.env.FOO
  })
  it('prints usage and exits with no args', function (done) {
    var command = process.argv[0] + ' lib/index.js'
    exec(command, {
      cwd: root,
      env: {},
    }, function (error, stdout) {
      expect(error).not.to.exist
      expect(stdout).to.match(/Usage:/)
      done()
    })
  })
  it('works for single env file', function (done) {
    var command = process.argv[0] + ' ' +
      'lib/index.js test/foo.env ' +
      process.argv[0] + " -p 'process.env.FOO'"
    exec(command, {
      cwd: root,
      env: {},
    }, function (error, stdout) {
      expect(error).not.to.exist
      expect(stdout.trim()).to.equal('foo')
      done()
    })
  })
  it('works for multiple env files', function (done) {
    var command = process.argv[0] + ' ' +
      'lib/index.js test/foo.env test/bar.env -- ' +
      process.argv[0] + " -p 'process.env.FOO + process.env.BAR'"
    exec(command, {
      cwd: root,
      env: {},
    }, function (error, stdout) {
      expect(error).not.to.exist
      expect(stdout.trim()).to.equal('foobar')
      done()
    })
  })
  it("doesn't clobber existing environment variables", function (done) {
    var command = process.argv[0] + ' ' +
      'lib/index.js test/foo.env ' +
      process.argv[0] + " -p 'process.env.FOO'"
    exec(command, {
      cwd: root,
      env: {FOO: 'bar'},
    }, function (error, stdout) {
      expect(error).not.to.exist
      expect(stdout.trim()).to.equal('bar')
      done()
    })
  })
  it('mimics signal from spawned process', function (done) {
    var command = process.argv[0] + ' ' +
      'lib/index.js test/foo.env ' +
      process.argv[0] + ' test/signal.js'
    exec(command, {
      cwd: root,
      env: {FOO: 'bar'},
    }, function (error) {
      // nyc seems to interfere with this
      // expect(error.signal).to.equal('SIGINT')
      done()
    })
  })
  it('mimics code from spawned process', function (done) {
    var command = process.argv[0] + ' ' +
      'lib/index.js test/foo.env ' +
      process.argv[0] + " -e 'process.exit(1)'"
    exec(command, {
      cwd: root,
      env: {FOO: 'bar'},
    }, function (error) {
      expect(error.code).to.equal(1)
      done()
    })
  })
})


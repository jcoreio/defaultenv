var path = require('path')
var exec = require('child_process').exec
var expect = require('chai').expect

var defaultEnv = require('../src/index')

var root = path.resolve(__dirname, '..')

describe('defaultenv', function () {
  this.timeout(5000)
  describe('node.js API', function () {
    it('puts vars on process.env unless noExport is true', function () {
      expect(process.env.FOO).not.to.exist
      defaultEnv([path.resolve(__dirname, 'foo.env')], { noDotenv: true })
      expect(process.env.FOO).to.equal('foo')
      delete process.env.FOO

      var vars = defaultEnv([path.resolve(__dirname, 'bar.env')], {
        noDotenv: true,
        noExport: true,
      })
      expect(process.env.BAR).not.to.exist
      expect(vars.BAR).to.equal('bar')
    })
  })
  it('prints usage and exits with no args', function (done) {
    var command = process.argv[0] + ' src/cli.js'
    exec(
      command,
      {
        cwd: root,
        env: {},
      },
      function (error, stdout) {
        expect(error).not.to.exist
        done()
      }
    )
  })
  it('works for single env file', function (done) {
    var command =
      process.argv[0] +
      ' ' +
      'src/cli.js --no-dotenv test/foo.env ' +
      process.argv[0] +
      " -p 'process.env.FOO'"
    exec(
      command,
      {
        cwd: root,
        env: {},
      },
      function (error, stdout) {
        expect(error).not.to.exist
        expect(stdout.trim()).to.equal('foo')
        done()
      }
    )
  })
  it('works for single js file', function (done) {
    var command =
      process.argv[0] +
      ' ' +
      'src/cli.js --no-dotenv test/foo.js ' +
      process.argv[0] +
      " -p 'process.env.FOO'"
    exec(
      command,
      {
        cwd: root,
        env: {},
      },
      function (error, stdout) {
        expect(error).not.to.exist
        expect(stdout.trim()).to.equal('foo')
        done()
      }
    )
  })
  it('works for multiple js files', function (done) {
    var command =
      process.argv[0] +
      ' ' +
      'src/cli.js --no-dotenv test/foo.js test/bar.js -- ' +
      process.argv[0] +
      " -p 'process.env.FOOBAR'"
    exec(
      command,
      {
        cwd: root,
        env: {},
      },
      function (error, stdout) {
        expect(error).not.to.exist
        expect(stdout.trim()).to.equal('foobar')
        done()
      }
    )
  })
  it('requires js env files to export an object or function', function (done) {
    var command =
      process.argv[0] +
      ' ' +
      'src/cli.js --no-dotenv test/notObject.js ' +
      process.argv[0] +
      " -p 'process.env.FOO'"
    exec(
      command,
      {
        cwd: root,
        env: {},
      },
      function (error, stdout, stderr) {
        expect(error.code).to.equal(1)
        expect(stderr).to.match(/test\/notObject.js is invalid;/)
        done()
      }
    )
  })
  it('requires all values exported from js env files to be strings', function (done) {
    var command =
      process.argv[0] +
      ' ' +
      'src/cli.js --no-dotenv test/notStringValue.js ' +
      process.argv[0] +
      " -p 'process.env.FOO'"
    exec(
      command,
      {
        cwd: root,
        env: {},
      },
      function (error, stdout, stderr) {
        expect(error.code).to.equal(1)
        expect(stderr).to.match(/test\/notStringValue.js is invalid;/)
        done()
      }
    )
  })
  it('works for single json file', function (done) {
    var command =
      process.argv[0] +
      ' ' +
      'src/cli.js --no-dotenv test/foo.json ' +
      process.argv[0] +
      " -p 'process.env.FOO'"
    exec(
      command,
      {
        cwd: root,
        env: {},
      },
      function (error, stdout) {
        expect(error).not.to.exist
        expect(stdout.trim()).to.equal('foo')
        done()
      }
    )
  })
  it('works for multiple env files', function (done) {
    var command =
      process.argv[0] +
      ' ' +
      'src/cli.js --no-dotenv test/foo.env test/bar.env -- ' +
      process.argv[0] +
      " -p 'process.env.FOO + process.env.BAR'"
    exec(
      command,
      {
        cwd: root,
        env: {},
      },
      function (error, stdout) {
        expect(error).not.to.exist
        expect(stdout.trim()).to.equal('foobar')
        done()
      }
    )
  })
  it("doesn't clobber existing environment variables", function (done) {
    var command =
      process.argv[0] +
      ' ' +
      'src/cli.js test/foo.env ' +
      process.argv[0] +
      " -p 'process.env.FOO'"
    exec(
      command,
      {
        cwd: root,
        env: { FOO: 'bar' },
      },
      function (error, stdout) {
        expect(error).not.to.exist
        expect(stdout.trim()).to.equal('bar')
        done()
      }
    )
  })
  it('clobbers existing environment variables with -f option', function (done) {
    var command =
      process.argv[0] +
      ' ' +
      'src/cli.js --no-dotenv -f test/foo.env ' +
      process.argv[0] +
      " -p 'process.env.FOO'"
    exec(
      command,
      {
        cwd: root,
        env: { FOO: 'bar' },
      },
      function (error, stdout) {
        expect(error).not.to.exist
        expect(stdout.trim()).to.equal('foo')
        done()
      }
    )
  })
  it('mimics signal from spawned process', function (done) {
    var command =
      process.argv[0] +
      ' ' +
      'src/cli.js --no-dotenv test/foo.env ' +
      process.argv[0] +
      ' test/signal.js'
    exec(
      command,
      {
        cwd: root,
        env: { FOO: 'bar' },
      },
      function (error) {
        // nyc seems to interfere with this
        // expect(error.signal).to.equal('SIGINT')
        done()
      }
    )
  })
  it('mimics code from spawned process', function (done) {
    var command =
      process.argv[0] +
      ' ' +
      'src/cli.js --no-dotenv test/foo.env ' +
      process.argv[0] +
      " -e 'process.exit(1)'"
    exec(
      command,
      {
        cwd: root,
        env: { FOO: 'bar' },
      },
      function (error) {
        expect(error.code).to.equal(1)
        done()
      }
    )
  })
  it('outputs export script with -p option', function (done) {
    var command =
      process.argv[0] + ' src/cli.js --no-dotenv -p test/foo.env test/bar.js'
    exec(
      command,
      {
        cwd: root,
        env: { FOO: 'bar' },
      },
      function (error, stdout) {
        expect(stdout.trim()).to.equal(
          'export FOO=foo\nexport BAR=bar\nexport FOOBAR=foobar'
        )
        done()
      }
    )
  })
  it('loads .env when --no-dotenv option is not given', function (done) {
    var command =
      process.argv[0] +
      ' ' +
      'src/cli.js test/foo.env ' +
      process.argv[0] +
      " -p 'process.env.FOO'"
    exec(
      command,
      {
        cwd: root,
      },
      function (error, stdout) {
        expect(stdout.trim()).to.equal('gloob')
        done()
      }
    )
  })
})

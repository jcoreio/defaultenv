module.exports = function (env) {
  env.setDefaults({BAR: 'bar'})
  env.setDefaults({FOOBAR: String(env.get('FOO')) + env.get('BAR')})
}

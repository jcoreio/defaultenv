export type Options = {
  force?: boolean,
  print?: boolean,
  noDotenv?: boolean,
  noExport?: boolean,
}

export type EnvFileAPI = {
  get: (key: string) => string | null | undefined,
  setDefault: (key: string, value: string) => void,
  setDefaults: (defaults: {[key: string]: string}) => void,
}

export default function defaultEnv(envFiles: Array<string>, options?: Options): {[varname: string]: string};

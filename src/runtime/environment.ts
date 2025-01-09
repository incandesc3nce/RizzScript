import { evaluateFunction } from './eval/expressions';
import { jsToRuntime, printValues, runtimeToJS } from './eval/native-fns';
import {
  ArrayValue,
  FunctionValue,
  MK_ARRAY,
  MK_BOOL,
  MK_NATIVE_FN,
  MK_NULL,
  MK_NUMBER,
  MK_OBJECT,
  MK_STRING,
  NumberValue,
  ObjectValue,
  RuntimeValue,
  StringValue,
} from './values';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import Parser from '../frontend/parser';
import { evaluate } from './interpreter';
import { Identifier, MemberExpression } from '../frontend/ast';
import { transcribe } from '../utils/transcriber';
import { rl } from '../utils/readlineInterface';

/**
 * Creates a global environment with predefined variables.
 * @returns The global environment.
 */
export function createGlobalEnvironment(
  beginTime: number = -1,
  filePath: string = __dirname,
  args: RuntimeValue[] = [],
) {
  const env = new Environment();
  env.declareVariable('true', MK_BOOL(true), true);
  env.declareVariable('false', MK_BOOL(false), true);
  env.declareVariable('null', MK_NULL(), true);

  env.declareVariable('error', MK_NULL(), false);
  env.declareVariable('args', MK_ARRAY(args), true);

  env.declareVariable(
    'println',
    MK_NATIVE_FN((args) => {
      printValues(args);
      return MK_NULL();
    }),
    true,
  );

  env.declareVariable(
    'trim',
    MK_NATIVE_FN((args) => {
      const str = (args.shift() as StringValue).value;

      return MK_STRING(str.trim());
    }),
    true,
  );

  env.declareVariable(
    'splitstr',
    MK_NATIVE_FN((args) => {
      const str = (args.shift() as StringValue).value;
      const splitat = (args.shift() as StringValue).value;

      return MK_ARRAY(str.split(splitat).map((val) => MK_STRING(val)));
    }),
    true,
  );

  env.declareVariable(
    'input',
    MK_NATIVE_FN((args) => {
      const cmd = (args.shift() as StringValue).value;

      return MK_NATIVE_FN((args) => {
        const fn = args.shift() as FunctionValue;
        (async () => {
          const result = await rl.question(cmd);
          evaluateFunction(fn, [MK_STRING(result)]);
        })();
        return MK_NULL();
      });
    }),
    true,
  );

  env.declareVariable(
    'math',
    MK_OBJECT(
      new Map()
        .set('pi', MK_NUMBER(Math.PI))
        .set('e', MK_NUMBER(Math.E))
        .set(
          'sqrt',
          MK_NATIVE_FN((args) => {
            const arg = (args[0] as NumberValue).value;
            return MK_NUMBER(Math.sqrt(arg));
          }),
        )
        .set(
          'random',
          MK_NATIVE_FN((args) => {
            const arg1 = (args[0] as NumberValue).value;
            const arg2 = (args[1] as NumberValue).value;

            const min = Math.ceil(arg1);
            const max = Math.floor(arg2);
            return MK_NUMBER(Math.floor(Math.random() * (max - min + 1)) + min);
          }),
        )
        .set(
          'round',
          MK_NATIVE_FN((args) => {
            const arg = (args[0] as NumberValue).value;
            return MK_NUMBER(Math.round(arg));
          }),
        )
        .set(
          'ceil',
          MK_NATIVE_FN((args) => {
            const arg = (args[0] as NumberValue).value;
            return MK_NUMBER(Math.ceil(arg));
          }),
        )
        .set(
          'abs',
          MK_NATIVE_FN((args) => {
            const arg = (args[0] as NumberValue).value;
            return MK_NUMBER(Math.abs(arg));
          }),
        ),
    ),
    true,
  );

  env.declareVariable(
    'parseNumber',
    MK_NATIVE_FN((args) => {
      const arg = (args[0] as StringValue).value;
      const number = parseFloat(arg);
      return MK_NUMBER(number);
    }),
    true,
  );

  env.declareVariable(
    'strcon',
    MK_NATIVE_FN((args) => {
      let res = '';

      for (let i = 0; i < args.length; i++) {
        const arg = args[i] as StringValue;

        res += arg.value;
      }

      return MK_STRING(res);
    }),
    true,
  );

  function localPath(path: string) {
    if (path.startsWith('.') || !path.includes(':')) {
      path = filePath + path;
    }
    return path;
  }

  env.declareVariable(
    'fs',
    MK_OBJECT(
      new Map()
        .set('tmpdir', MK_STRING(os.tmpdir()))
        .set(
          'appdata',
          MK_STRING(
            process.env.APPDATA ||
              (process.platform === 'darwin'
                ? path.join(os.homedir(), 'Library', 'Application Support')
                : path.join(os.homedir(), '.local', 'share')),
          ),
        )
        .set('home', MK_STRING(os.homedir()))
        .set('desktop', MK_STRING(path.join(os.homedir(), 'Desktop')))
        .set(
          'read',
          MK_NATIVE_FN((args) => {
            const path = localPath((args.shift() as StringValue).value);
            const encoding = (args.shift() as StringValue)?.value ?? 'utf8';
            const read = fs.readFileSync(path, encoding as fs.EncodingOption);
            return MK_STRING(read.toString());
          }),
        )
        .set(
          'write',
          MK_NATIVE_FN((args) => {
            const path = localPath((args.shift() as StringValue).value);
            const data = (args.shift() as StringValue).value;
            fs.writeFileSync(path, data);
            return MK_NULL();
          }),
        )
        .set(
          'mkdir',
          MK_NATIVE_FN((args) => {
            const path = localPath((args.shift() as StringValue).value);
            fs.mkdirSync(path);
            return MK_NULL();
          }),
        )
        .set(
          'rm',
          MK_NATIVE_FN((args) => {
            const path = localPath((args.shift() as StringValue).value);
            fs.rmSync(path);
            return MK_NULL();
          }),
        )
        .set(
          'rmdir',
          MK_NATIVE_FN((args) => {
            const path = localPath((args.shift() as StringValue).value);
            fs.rmdirSync(path, { recursive: true });
            return MK_NULL();
          }),
        )
        .set(
          'exists',
          MK_NATIVE_FN((args) => {
            const path = localPath((args.shift() as StringValue).value);
            return MK_BOOL(fs.existsSync(path));
          }),
        ),
    ),
    true,
  );

  env.declareVariable(
    'objects',
    MK_OBJECT(
      new Map()
        .set(
          'hasKey',
          MK_NATIVE_FN((args) => {
            const obj = (args.shift() as ObjectValue).properties;
            const value = (args.shift() as StringValue).value;
            const within = obj.has(value);
            return MK_BOOL(within);
          }),
        )
        .set(
          'get',
          MK_NATIVE_FN((args) => {
            const obj = (args.shift() as ObjectValue).properties;
            const key = (args.shift() as StringValue).value;
            return obj.get(key) as RuntimeValue;
          }),
        )
        .set(
          'set',
          MK_NATIVE_FN((args) => {
            const obj = (args.shift() as ObjectValue).properties;
            const key = (args.shift() as StringValue).value;
            const value = args.shift() as RuntimeValue;
            obj.set(key, value);
            return MK_NULL();
          }),
        )
        .set(
          'keys',
          MK_NATIVE_FN((args) => {
            const obj = (args.shift() as ObjectValue).properties;
            return MK_ARRAY(Array.from(obj.keys()).map(MK_STRING));
          }),
        ),
    ),
    true,
  );

  env.declareVariable(
    'len',
    MK_NATIVE_FN((args) => {
      const arg = args.shift()!;
      switch (arg.type) {
        case 'string':
          return MK_NUMBER((arg as StringValue).value.length);
        case 'object':
          return MK_NUMBER((arg as ObjectValue).properties.size);
        case 'array':
          return MK_NUMBER((arg as ArrayValue).elements.length);
        default:
          throw '💀 Cannot get length of type: ' + arg.type;
      }
    }),
    true,
  );

  env.declareVariable(
    'base64',
    MK_OBJECT(
      new Map()
        .set(
          'encode',
          MK_NATIVE_FN((args) => {
            const str = args.shift() as StringValue;
            return MK_STRING(btoa(str.value));
          }),
        )
        .set(
          'decode',
          MK_NATIVE_FN((args) => {
            const str = args.shift() as StringValue;
            return MK_STRING(atob(str.value));
          }),
        ),
    ),
    true,
  );

  env.declareVariable(
    'import',
    MK_NATIVE_FN((args) => {
      const path = localPath((args.shift() as StringValue).value);

      let input;
      if (path.endsWith('.rizz')) {
        input = transcribe(fs.readFileSync(path, 'utf-8'));
      } else throw '💀 Not a RizzScript file: ' + path;

      const parser = new Parser();
      const program = parser.produceAST(input);

      return evaluate(program, env); // this will evaluate and return the last value emitted
    }),
    true,
  );

  // Rizz Object Notaion
  env.declareVariable(
    'rzon',
    MK_OBJECT(
      new Map()
        .set(
          'stringify',
          MK_NATIVE_FN((args) => {
            if (args[0].type == 'object') {
              const obj = args.shift() as ObjectValue;
              return MK_STRING(JSON.stringify(runtimeToJS(obj)));
            } else if (args[0].type == 'array') {
              const arr = args.shift() as ArrayValue;
              return MK_STRING(JSON.stringify(runtimeToJS(arr)));
            }
            throw '💀 Not json stringifiable type: ' + args[0].type;
          }),
        )
        .set(
          'parse',
          MK_NATIVE_FN((args) => {
            const string = (args.shift() as StringValue).value;
            const jsonObj: { [key: string]: unknown } = JSON.parse(string);
            if (Array.isArray(jsonObj)) {
              const rtArr: RuntimeValue[] = [];
              jsonObj.forEach((val) => rtArr.push(jsToRuntime(val)));
              return MK_ARRAY(rtArr);
            }
            const rtObj = new Map();
            Object.keys(jsonObj).forEach((key) =>
              rtObj.set(key, jsToRuntime(jsonObj[key])),
            );
            return MK_OBJECT(rtObj);
          }),
        ),
    ),
    true,
  );

  const timeoutIds: { [key: number]: NodeJS.Timeout } = {};

  function generateTimeoutId(tm: NodeJS.Timeout): number {
    let id: number;
    do {
      id = Math.floor(Math.random() * 999999);
    } while (timeoutIds[id] != null);
    timeoutIds[id] = tm;
    return id;
  }

  env.declareVariable(
    'setTimeout',
    MK_NATIVE_FN((args) => {
      const func = args.shift() as FunctionValue;
      const time = args.shift() as NumberValue;
      const tm = setTimeout(() => {
        evaluateFunction(func, []); // No args can be present here, as none are able to be given.
      }, time.value);
      return MK_NUMBER(generateTimeoutId(tm));
    }),
    true,
  );

  env.declareVariable(
    'setInterval',
    MK_NATIVE_FN((args) => {
      const func = args.shift() as FunctionValue;
      const time = args.shift() as NumberValue;
      const iv = setInterval(() => {
        evaluateFunction(func, []);
      }, time.value); // No args can be present here, as none are able to be given.
      return MK_NUMBER(generateTimeoutId(iv));
    }),
    true,
  );

  env.declareVariable(
    'clearTimeout',
    MK_NATIVE_FN((args) => {
      const id = args.shift() as NumberValue;
      if (timeoutIds[id.value]) {
        clearTimeout(timeoutIds[id.value]);
        return MK_BOOL();
      }
      return MK_BOOL(false);
    }),
    true,
  );
  env.declareVariable(
    'clearInterval',
    MK_NATIVE_FN((args) => {
      const id = args.shift() as NumberValue;
      if (timeoutIds[id.value]) {
        clearInterval(timeoutIds[id.value]);
        return MK_BOOL();
      }
      return MK_BOOL(false);
    }),
    true,
  );

  env.declareVariable(
    'fetch',
    MK_NATIVE_FN((args) => {
      const url = (args.shift() as StringValue).value;
      const options = args.shift() as ObjectValue;

      const method =
        options == undefined
          ? 'GET'
          : ((options.properties.get('method') as StringValue)?.value ?? 'GET');
      const body =
        options == undefined
          ? null
          : ((options.properties.get('body') as StringValue)?.value ?? null);
      const content_type =
        options == undefined
          ? 'text/plain'
          : ((options.properties.get('content_type') as StringValue)?.value ??
            'text/plain');

      return MK_NATIVE_FN((args) => {
        const fn = args.shift() as FunctionValue;
        (async () => {
          const req = await fetch(url, {
            method: method,
            body: body,
            headers: {
              'Content-Type': content_type,
            },
          });

          if (req.status !== 200) {
            throw new Error(
              '💀 Failed to fetch data: ' + JSON.stringify(req.body),
            );
          }
          evaluateFunction(fn, [MK_STRING(JSON.stringify(req.body))]);
        })();
        return MK_NULL();
      });
    }),
    true,
  );

  function parseRegex(regex: string): RegExp {
    const split = regex.split('/');
    if (split.length < 3) throw '💀 Invalid regex: ' + regex;

    split.shift(); // remove empty

    const flags = split[split.length - 1];

    const full = split.join('/');
    const pattern = full.substring(0, full.length - (flags.length + 1));

    return new RegExp(pattern, flags);
  }

  env.declareVariable(
    'regex',
    MK_OBJECT(
      new Map()
        .set(
          'match',
          MK_NATIVE_FN((args) => {
            const string = (args.shift() as StringValue).value;

            const regex = parseRegex((args.shift() as StringValue).value);
            const matches = string.match(regex);

            return matches == null
              ? MK_NULL()
              : MK_ARRAY(matches.map((val) => MK_STRING(val)));
          }),
        )
        .set(
          'replace',
          MK_NATIVE_FN((args) => {
            const string = (args.shift() as StringValue).value;
            const regex = parseRegex((args.shift() as StringValue).value);

            const replaceValue = (args.shift() as StringValue).value;
            const replaced = string.replace(regex, replaceValue);

            return MK_STRING(replaced);
          }),
        ),
    ),
    true,
  );

  env.declareVariable(
    'exit',
    MK_NATIVE_FN(() => {
      console.log('🔥 srsly bruh...');
      process.exit(0);
    }),
    true,
  );

  env.declareVariable(
    'finishExit',
    MK_NATIVE_FN(() => {
      process.exit(0);
    }),
    true,
  );

  return env;
}

/**
 * Environment class is used to store variables and their values.
 * It also provides a way to resolve variables in the scope chain.
 */
export default class Environment {
  private parent?: Environment;
  private variables: Map<string, RuntimeValue>;
  private constants: Set<String>;

  constructor(parentEnv?: Environment) {
    this.parent = parentEnv;
    this.variables = new Map();
    this.constants = new Set();
  }

  /**
   * Declare a variable in the current environment.
   * @param varname Name of the variable.
   * @param value Value of the variable.
   * @returns The value of the variable.
   */
  public declareVariable(
    varname: string,
    value: RuntimeValue,
    isConst: boolean,
  ): RuntimeValue {
    if (this.variables.has(varname)) {
      throw `💀 Variable ${varname} is already defined.`;
    }

    this.variables.set(varname, value);

    if (isConst) {
      this.constants.add(varname);
    }

    return value;
  }

  /**
   * Assign a value to an already declared variable.
   * @param varname Name of the variable.
   * @param value Value to be assigned.
   * @returns The value of the variable.
   */
  public assignVariable(varname: string, value: RuntimeValue): RuntimeValue {
    const env = this.resolve(varname);

    // Cannot assign to a constant variable
    if (env.constants.has(varname)) {
      throw `💀 Cannot reassign to constant variable '${varname}'.`;
    }

    env.variables.set(varname, value);

    return value;
  }

  public lookupOrMutObject(
    expr: MemberExpression,
    value?: RuntimeValue,
    property?: Identifier,
  ): RuntimeValue {
    let pastVal: RuntimeValue;
    if (expr.object.kind === 'MemberExpression') {
      // We will get the expr.object property of the expr.object -- since we are using this just to get the value, we will null the value as it will not be changed
      // This will then, in cases like a.b.c, will return a.b -- now this a.b will be put into pastVal recursively and then it will get c of a.b
      // (Funny how I spent like 20 minutes debugging this just to realize that it was passing value in and then causing it to return the value which isn't an array/object)
      pastVal = this.lookupOrMutObject(
        expr.object as MemberExpression,
        undefined,
        (expr.object as MemberExpression).property as Identifier,
      );
    } else {
      const varname = (expr.object as Identifier).symbol;
      const env = this.resolve(varname);

      pastVal = env.variables.get(varname)!;
    }

    switch (pastVal.type) {
      case 'object': {
        const currentProp = (expr.property as Identifier).symbol;
        const prop = property ? property.symbol : currentProp;

        if (value) (pastVal as ObjectValue).properties.set(prop, value);

        if (currentProp)
          pastVal = (pastVal as ObjectValue).properties.get(
            currentProp,
          ) as ObjectValue;

        return pastVal;
      }
      case 'array': {
        // Will evaluate the expression. Numbers will stay, but a variable will work. This allows for array[0] and array[ident].
        const numRT: RuntimeValue = evaluate(expr.property, this);

        if (numRT.type != 'number')
          throw '🔥 Arrays do not have keys: ' + expr.property;

        const num = (numRT as NumberValue).value;

        if (value) (pastVal as ArrayValue).elements[num] = value;

        return (pastVal as ArrayValue).elements[num];
      }
      default:
        throw '💀 Cannot lookup or mutate type: ' + pastVal.type;
    }
  }

  /**
   * Lookup a variable in the current environment.
   * @param varname Name of the variable.
   * @returns The value of the variable.
   * @throws If the variable is not found in the current environment.
   */
  public lookupVariable(varname: string): RuntimeValue {
    const env = this.resolve(varname);
    return env.variables.get(varname) as RuntimeValue;
  }

  /**
   * Resolve a variable in the scope chain.
   * @param varname Name of the variable.
   * @returns The environment where the variable is defined.
   * @throws If the variable is not found in the scope chain.
   */
  public resolve(varname: string): Environment {
    if (this.variables.has(varname)) {
      return this;
    }

    if (this.parent === undefined) {
      throw `💀 Cannot resolve '${varname}' as it does not exist.`;
    }

    return this.parent.resolve(varname);
  }
}

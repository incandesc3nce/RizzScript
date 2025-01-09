import {
  RuntimeValue,
  StringValue,
  NumberValue,
  BooleanValue,
  NullValue,
  ObjectValue,
  FunctionValue,
  ArrayValue,
  MK_NULL,
  MK_BOOL,
  MK_NUMBER,
  MK_OBJECT,
  MK_STRING,
  MK_ARRAY,
} from '../values';

/**
 * Prints the values to the console.
 * @param args The values to print.
 */
export function printValues(args: Array<RuntimeValue>) {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    console.log(runtimeToJS(arg));
  }
}

export function runtimeToJS(arg: RuntimeValue) {
  switch (arg.type) {
    case 'string':
      return (arg as StringValue).value;
    case 'number':
      return (arg as NumberValue).value;
    case 'boolean':
      return (arg as BooleanValue).value;
    case 'null':
      return (arg as NullValue).value;
    case 'object': {
      const obj: { [key: string]: unknown } = {};
      const aObj = arg as ObjectValue;
      aObj.properties.forEach((value, key) => (obj[key] = runtimeToJS(value)));
      return obj;
    }
    case 'array': {
      const arr: unknown[] = [];
      const aArr = arg as ArrayValue;
      aArr.elements.forEach((value) => arr.push(runtimeToJS(value)));
      return arr;
    }
    case 'fn': {
      const fn = arg as FunctionValue;
      return fn.name == '<anonymous>'
        ? `[Function (anonymous)]`
        : `[Function: ${fn.name}]`;
    }
    case 'native-fn': {
      return `[Native Function]`;
    }
    default:
      return arg;
  }
}

export function jsToRuntime(val: unknown): RuntimeValue {
  if (val == null) return MK_NULL();

  switch (typeof val) {
    case 'boolean':
      return MK_BOOL(val);
    case 'bigint':
    case 'number':
      return MK_NUMBER(val as number);
    case 'string':
      return MK_STRING(val);
    case 'object': {
      if (Array.isArray(val)) {
        const arr: RuntimeValue[] = [];
        val.forEach((value) => {
          arr.push(jsToRuntime(value));
        });
        return MK_ARRAY(arr);
      }
      const prop = new Map<string, RuntimeValue>();
      Object.keys(val as Record<string, unknown>).forEach((key) => {
        prop.set(key, jsToRuntime((val as Record<string, unknown>)[key]));
      });
      return MK_OBJECT(prop);
    }
    default:
      return MK_NULL();
  }
}

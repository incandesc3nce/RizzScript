import { Statement } from '../frontend/ast';
import Environment from './environment';

export type ValueType =
  | 'null'
  | 'number'
  | 'boolean'
  | 'object'
  | 'native-fn'
  | 'fn'
  | 'string'
  | 'array';

/**
 * Defines an abstract runtime value
 */
export interface RuntimeValue {
  type: ValueType;
}

/**
 * Defines a value of undefined meaning
 */
export interface NullValue extends RuntimeValue {
  type: 'null';
  value: null;
}

/**
 * Creates a null value
 */
export function MK_NULL(): NullValue {
  return { type: 'null', value: null } as NullValue;
}

/**
 * Defines a boolean value
 */
export interface BooleanValue extends RuntimeValue {
  type: 'boolean';
  value: boolean;
}

/**
 * Creates a boolean value
 * @param bool The boolean value
 */
export function MK_BOOL(bool: boolean = true): BooleanValue {
  return { type: 'boolean', value: bool } as BooleanValue;
}

/**
 * Runtime value that has access to the raw native number.
 */
export interface NumberValue extends RuntimeValue {
  type: 'number';
  value: number;
}

/**
 * Creates a number value
 * @param num The number value
 */
export function MK_NUMBER(num: number = 0): NumberValue {
  return { type: 'number', value: num } as NumberValue;
}

/**
 * Runtime value that represents an object.
 */
export interface ObjectValue extends RuntimeValue {
  type: 'object';
  properties: Map<string, RuntimeValue>;
}

/**
 * Creates an object value
 * @param properties The object properties
 */
export function MK_OBJECT(properties: Map<string, RuntimeValue>): ObjectValue {
  return { type: 'object', properties } as ObjectValue;
}

/**
 * Runtime value that represents an array.
 */
export interface ArrayValue extends RuntimeValue {
  type: 'array';
  elements: RuntimeValue[];
}

/**
 * Creates an array value
 * @param elements The array elements
 */
export function MK_ARRAY(elements: RuntimeValue[] = []): ArrayValue {
  return { type: 'array', elements } as ArrayValue;
}

/**
 * Runtime value that represents a function.
 */
export interface FunctionValue extends RuntimeValue {
  type: 'fn';
  name: string;
  params: string[];
  declarationEnv: Environment;
  body: Statement[];
}

/**
 * Runtime value that represents a function call.
 */
export type FunctionCall = (
  args: RuntimeValue[],
  env: Environment,
) => RuntimeValue;

export interface NativeFnValue extends RuntimeValue {
  type: 'native-fn';
  call: FunctionCall;
}

export function MK_NATIVE_FN(call: FunctionCall): NativeFnValue {
  return { type: 'native-fn', call } as NativeFnValue;
}

/**
 * Runtime value that represents a string.
 */
export interface StringValue extends RuntimeValue {
  type: 'string';
  value: string;
}

/**
 * Creates a string value
 * @param val The string value
 */
export function MK_STRING(val: string): StringValue {
  return { type: 'string', value: val } as StringValue;
}

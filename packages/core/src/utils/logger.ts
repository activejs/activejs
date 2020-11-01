import {Configuration} from '../lib/configuration';
import {LogLevel} from '../models';
import {isNumber, NOOP} from './funcs';

/**
 * @internal please do not use.
 */
export function logInfo(...messages: any): () => void {
  const {logLevel} = Configuration.ENVIRONMENT;

  if (isNumber(logLevel) && logLevel >= LogLevel.INFO) {
    // tslint:disable-next-line:no-console
    return console.info.bind(console, ...messages);
  }
  return NOOP;
}

/**
 * @internal please do not use.
 */
export function logWarn(...messages: any): () => void {
  const {logLevel} = Configuration.ENVIRONMENT;

  if (isNumber(logLevel) && logLevel >= LogLevel.WARN) {
    // tslint:disable-next-line:no-console
    return console.warn.bind(console, ...messages);
  }
  return NOOP;
}

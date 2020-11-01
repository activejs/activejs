import {AppEnvironment, environmentBase} from './environment.base';

export const environment: AppEnvironment = {
  production: true,
};

Object.assign(environment, environmentBase);

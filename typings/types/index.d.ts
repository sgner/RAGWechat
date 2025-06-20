/// <reference path="./wx/index.d.ts" />

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'production' | 'development'
  }
}

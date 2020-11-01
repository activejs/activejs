export interface AppEnvironment {
  production: boolean;
  colors?: {
    primaryColor: string;
    successColor: string;
    dangerColor: string;
    extraColor: string;
  };
  commonConsoleStyles?: string;
}

export const environmentBase = {
  colors: {
    primaryColor: '#0172ff',
    successColor: '#00b36f',
    dangerColor: '#ff6a00',
    extraColor: '#a847d6',
  },
  commonConsoleStyles: `padding: 10px; font-size: 16px;`,
};

export interface DBConfig {
  dialect: 'postgres';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  autoLoadModels: boolean;
  synchronize: boolean;
  logging: boolean | ((sql: string) => void);
}

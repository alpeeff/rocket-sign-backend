export interface ConfigServiceEnvType {
  DB_HOST: string
  DB_PORT: number
  DB_USERNAME: string
  DB_PASSWORD: string
  DB_NAME: string

  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  GOOGLE_CALLBACK_URL: string

  FACEBOOK_CLIENT_ID: string
  FACEBOOK_CLIENT_SECRET: string
  FACEBOOK_CALLBACK_URL: string

  JWT_SECRET: string

  FONDY_SECRET_KEY: string
  FONDY_MERCHANT_ID: number

  AWS_S3_REGION: string
  AWS_S3_ACCESS_KEY_ID: string
  AWS_S3_SECRET_ACCESS_KEY: string
  AWS_S3_ORDERS_BUCKET: string
}

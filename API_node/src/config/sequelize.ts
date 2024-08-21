import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config(); 

const sequelize = new Sequelize(
  process.env.POSTGRES_DB as string, // Nome del database
  process.env.POSTGRES_USER as string, // Username
  process.env.POSTGRES_PASSWORD as string, // Password
  {
    host: process.env.POSTGRES_HOST as string,
    port: Number(process.env.POSTGRES_PORT),
    dialect: 'postgres',
  }
);

export default sequelize;


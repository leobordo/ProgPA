import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(`postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@db:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`, {
  dialect: 'postgres',
});

export default sequelize;

import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('postgres://user:password@localhost:5432/mydb', {  //TODO
  dialect: 'postgres'
});

export default sequelize;

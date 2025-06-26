import { Sequelize } from 'sequelize';

// database connection.
const database = new Sequelize(
    process.env.DB_NAME || '',
    process.env.DB_USER || '',
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3307,
        dialect: 'mysql',
        //next two line help in debugging
        // logging: console.log,
        // logQueryParameters: true,
        logging: false,
        pool: {
            max: 9,
            min: 6,
            acquire: 30000,
            idle: 10000
        }
    });

export default database;

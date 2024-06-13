require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const {
  invoices,
  customers,
  revenue,
  users,
} = require('../app/lib/placeholder-data.js');

// データベース接続情報を環境変数から取得
const dbConfig = {
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
};

async function seedUsers(connection) {
  try {
    // "users" テーブルが存在しない場合は作成
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
      );
    `);

    console.log(`Created "users" table`);

    // "users" テーブルにデータを挿入
    const insertedUsers = await Promise.all(
      users.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return connection.execute(`
          INSERT INTO users (id, name, email, password)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE id=id;
        `, [uuidv4(), user.name, user.email, hashedPassword]);
      }),
    );

    console.log(`Seeded ${insertedUsers.length} users`);

    return insertedUsers;
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
}

async function seedInvoices(connection) {
  try {
    // "invoices" テーブルが存在しない場合は作成
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR(36) PRIMARY KEY,
        customer_id VARCHAR(36) NOT NULL,
        amount INT NOT NULL,
        status VARCHAR(255) NOT NULL,
        date DATE NOT NULL
      );
    `);

    console.log(`Created "invoices" table`);

    // "invoices" テーブルにデータを挿入
    const insertedInvoices = await Promise.all(
      invoices.map((invoice) => connection.execute(`
        INSERT INTO invoices (id, customer_id, amount, status, date)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE id=id;
      `, [uuidv4(), invoice.customer_id, invoice.amount, invoice.status, invoice.date])),
    );

    console.log(`Seeded ${insertedInvoices.length} invoices`);

    return insertedInvoices;
  } catch (error) {
    console.error('Error seeding invoices:', error);
    throw error;
  }
}

async function seedCustomers(connection) {
  try {
    // "customers" テーブルが存在しない場合は作成
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        image_url VARCHAR(255) NOT NULL
      );
    `);

    console.log(`Created "customers" table`);

    // "customers" テーブルにデータを挿入
    const insertedCustomers = await Promise.all(
      customers.map((customer) => connection.execute(`
        INSERT INTO customers (id, name, email, image_url)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE id=id;
      `, [uuidv4(), customer.name, customer.email, customer.image_url])),
    );

    console.log(`Seeded ${insertedCustomers.length} customers`);

    return insertedCustomers;
  } catch (error) {
    console.error('Error seeding customers:', error);
    throw error;
  }
}

async function seedRevenue(connection) {
  try {
    // "revenue" テーブルが存在しない場合は作成
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS revenue (
        month VARCHAR(4) PRIMARY KEY,
        revenue INT NOT NULL
      );
    `);

    console.log(`Created "revenue" table`);

    // "revenue" テーブルにデータを挿入
    const insertedRevenue = await Promise.all(
      revenue.map((rev) => connection.execute(`
        INSERT INTO revenue (month, revenue)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE month=month;
      `, [rev.month, rev.revenue])),
    );

    console.log(`Seeded ${insertedRevenue.length} revenue`);

    return insertedRevenue;
  } catch (error) {
    console.error('Error seeding revenue:', error);
    throw error;
  }
}

async function main() {
  const connection = await mysql.createConnection(dbConfig);

  await seedUsers(connection);
  await seedCustomers(connection);
  await seedInvoices(connection);
  await seedRevenue(connection);

  await connection.end();
}

main().catch((err) => {
  console.error(
    'An error occurred while attempting to seed the database:',
    err,
  );
});

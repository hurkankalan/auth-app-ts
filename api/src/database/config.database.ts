import Pool from "pg-pool";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
  // host: process.env.DB_HOST || "",
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
});

pool.connect((error, client, done) => {
  if (error) {
    console.error(`Error database connection : ${error.message}`);

    if (done) {
      done(error);
    }

    process.exit(1);
  } else {
    console.log("Connected to database 🚀");
  }

  if (done) {
    done();
  }
});

export default pool;

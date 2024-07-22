// require('dotenv').config();
import dotenv from "dotenv";
import ConnectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({ path: './.env' });

ConnectDB()
    .then(() => {
        app.on("error", error => {
            throw error;
        });
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Successfully connected to port ${process.env.PORT || 8000}`);
        });
    })
    .catch(error => console.error('Database failed to connect!', error));

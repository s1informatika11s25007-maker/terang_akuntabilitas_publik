import dotenv from "dotenv";

// Load centralized .env file first, then fallback to .env.local if configured.
dotenv.config();
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || ".env.local" });


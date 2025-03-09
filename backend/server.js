
const express = require("express");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Подключение к PostgreSQL
const pool = new Pool({
  user: "postgres",       // Ваш пользователь PostgreSQL
  host: "localhost",      // Хост (обычно localhost)
  database: "clicker-game", // Имя вашей базы данных
  password: "PostgreSQLm0nkeys", // Пароль от пользователя postgres
  port: 5432,             // Порт PostgreSQL (по умолчанию 5432)
});

// Регистрация пользователя
app.post("/api/auth/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *",
      [username, password]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Ошибка регистрации:", error);
    res.status(500).json({ error: "Ошибка регистрации" });
  }
});

// Вход пользователя
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1 AND password = $2",
      [username, password]
    );
    if (result.rows.length > 0) {
      res.status(200).json({ token: "dummy_token", user: result.rows[0] });
    } else {
      res.status(401).json({ error: "Неверные учетные данные" });
    }
  } catch (error) {
    console.error("Ошибка входа:", error);
    res.status(500).json({ error: "Ошибка входа" });
  }
});

// Сохранение прогресса
app.post("/api/game/save", async (req, res) => {
  const { userId, money, clickGain, autoGain, shopData } = req.body;
  try {
    await pool.query(
      "INSERT INTO progress (user_id, money, click_gain, auto_gain, shop_data) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (user_id) DO UPDATE SET money = $2, click_gain = $3, auto_gain = $4, shop_data = $5",
      [userId, money, clickGain, autoGain, shopData]
    );
    res.status(200).json({ message: "Прогресс сохранен" });
  } catch (error) {
    console.error("Ошибка сохранения прогресса:", error);
    res.status(500).json({ error: "Ошибка сохранения прогресса" });
  }
});

// Загрузка прогресса
app.get("/api/game/load/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query("SELECT * FROM progress WHERE user_id = $1", [userId]);
    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ error: "Прогресс не найден" });
    }
  } catch (error) {
    console.error("Ошибка загрузки прогресса:", error);
    res.status(500).json({ error: "Ошибка загрузки прогресса" });
  }
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
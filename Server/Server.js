// Подключаем библиотеку express (это веб-сервер на Node.js)
const express = require("express");

// Подключаем библиотеку fs для работы с файлами (для чтения JSON)
const fs = require("fs");

// Path для построения корректных путей к файлам
const path = require("path");

// Подключаем cors, чтобы клиент мог обращаться к серверу
const cors = require("cors");

// Подключаем jsonwebtoken для авторизации через JWT
const jwt = require("jsonwebtoken");

// Секретный ключ для подписи токенов (обычтно хранится в переменных окружения, но для простоты у нас тут)
const JWT_SECRET = "super_secret_key_123";

// Подключаем базу данных
const db = require("./db");

// Создаём экземпляр приложения express
const app = express();

// Разрешаем express автоматически распаковывать JSON из тела запросов
app.use(express.json());

// Разрешаем запросы с других доменов (например, с клиента на localhost:3000)
app.use(cors());


// -----------------------------------------------------------------------------
// ВЫБОР СХЕМЫ ПРИ ЗАПУСКЕ СЕРВЕРА
// -----------------------------------------------------------------------------

// Путь к каталогу со схемами
const SCHEMA_DIR = path.join(__dirname, "data");

// Список всех JSON-файлов в каталоге
const allSchemas = fs.readdirSync(SCHEMA_DIR).filter(f => f.endsWith(".json"));

// В эту переменную положим имя выбранной схемы
let ACTIVE_SCHEMA = null;

async function chooseSchemaCLI() {
    return new Promise(resolve => {
        // Если схем ровно одна — выбираем автоматически
        if (allSchemas.length === 1) {
            ACTIVE_SCHEMA = allSchemas[0];
            console.log(`Найдена одна схема: ${ACTIVE_SCHEMA}`);
            console.log("Выбрана автоматически\n");
            return resolve();
        }

        // Если схем несколько — предлагаем выбрать
        console.log("Найдено несколько схем:");
        allSchemas.forEach((s, i) => {
            console.log(`  ${i + 1}. ${s}`);
        });

        console.log("\nВведите номер схемы и нажмите Enter:");

        const stdin = process.stdin;
        stdin.setEncoding("utf8");

        stdin.once("data", (input) => {
            const num = parseInt(input.trim());

            if (!num || num < 1 || num > allSchemas.length) {
                console.log("Неверный выбор. Сервер остановлен.");
                process.exit(1);
            }

            ACTIVE_SCHEMA = allSchemas[num - 1];
            console.log(`Вы выбрали: ${ACTIVE_SCHEMA}\n`);

            resolve();
        });
    });
}



// -----------------------------------------------------------------------------
// МИДДЛВАР ДЛЯ ПРОВЕРКИ JWT — защищает нужные маршруты
// -----------------------------------------------------------------------------
function authMiddleware(req, res, next) {
    // Токен должен приходить в заголовке Authorization: Bearer XXXXX
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: "Нет токена авторизации" });
    }

    // Извлекаем токен
    const token = authHeader.split(" ")[1];

    try {
        // Проверяем токен
        const decoded = jwt.verify(token, JWT_SECRET);

        // Записываем в объект запроса ID пользователя, чтобы был доступен дальше
        req.userId = decoded.id;

        next(); // продолжаем выполнение запроса
    } catch (err) {
        return res.status(401).json({ error: "Неверный токен" });
    }
}


// -----------------------------------------------------------------------------
// РЕГИСТРАЦИЯ ПОЛЬЗОВАТЕЛЯ
// -----------------------------------------------------------------------------
app.post("/register", (req, res) => {
    const { username, password } = req.body;

    // Проверка, что данные переданы
    if (!username || !password)
        return res.status(400).json({ error: "Передайте username и password" });

    // Проверяем, есть ли такой пользователь
    const userExists = db.prepare("SELECT * FROM users WHERE username=?").get(username);

    if (userExists) {
        return res.status(400).json({ error: "Пользователь с таким именем уже существует" });
    }

    // Создаём нового пользователя
    db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(username, password);

    res.json({ status: "ok" });
});


// -----------------------------------------------------------------------------
// ЛОГИН ПОЛЬЗОВАТЕЛЯ
// -----------------------------------------------------------------------------
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    const user = db.prepare("SELECT * FROM users WHERE username=? AND password=?")
                   .get(username, password);

    if (!user) {
        return res.status(401).json({ error: "Неверное имя пользователя или пароль" });
    }

    // Создаём токен на основе id пользователя
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "24h" });

    res.json({ token });
});


// -----------------------------------------------------------------------------
// ВЫДАТЬ АКТИВНУЮ СХЕМУ
// -----------------------------------------------------------------------------
app.get("/schema", authMiddleware, (req, res) => {
    const filePath = path.join(SCHEMA_DIR, ACTIVE_SCHEMA);

    const jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    res.json(jsonData);
});


// -----------------------------------------------------------------------------
// ПРИЁМ ДАННЫХ ФОРМЫ И СОХРАНЕНИЕ ИХ В БД
// -----------------------------------------------------------------------------
app.post("/submit", authMiddleware, (req, res) => {
    const { formData } = req.body;
    const schemaName = ACTIVE_SCHEMA;


    if (!schemaName || !formData) {
        return res.status(400).json({ error: "Передайте schemaName и formData" });
    }

    db.prepare(`
        INSERT INTO entries (user_id, schema_name, data, created_at)
        VALUES (?, ?, ?, datetime('now'))
    `).run(req.userId, schemaName, JSON.stringify(formData));

    res.json({ status: "saved" });
});


// -----------------------------------------------------------------------------
// ПОЛУЧЕНИЕ СОХРАНЁННЫХ ДАННЫХ ПОЛЬЗОВАТЕЛЯ
// -----------------------------------------------------------------------------
app.get("/history", authMiddleware, (req, res) => {
    const rows = db.prepare(
        "SELECT * FROM entries WHERE user_id=? ORDER BY created_at DESC"
    ).all(req.userId);

    // Конвертируем JSON-строку обратно в объект
    const result = rows.map(r => ({
        id: r.id,
        schema: r.schema_name,
        time: r.created_at,
        data: JSON.parse(r.data)
    }));

    res.json(result);
});


// -----------------------------------------------------------------------------
// ЗАПУСК СЕРВЕРА
// -----------------------------------------------------------------------------
chooseSchemaCLI().then(() => {
    app.listen(3000, () => {
        console.log("Сервер запущен на http://localhost:3000");
        console.log(`Активная схема: ${ACTIVE_SCHEMA}`);
    });
});

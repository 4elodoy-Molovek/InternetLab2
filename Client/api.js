// ------------------------------------------------------------
// api.js — модуль для запросов к серверу
// Все функции используют fetch и возвращают JSON
// ------------------------------------------------------------

// Адрес сервера (если сервер на другом домене — меняем здесь)
const API_URL = "http://localhost:3000";

// ------------------------------------------------------------
// Функция регистрации пользователя
// ------------------------------------------------------------
async function register(username, password) {
    const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    return res.json();
}

// ------------------------------------------------------------
// Функция входа в систему
// Возвращает JWT, если успех
// ------------------------------------------------------------
async function login(username, password) {
    const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    return res.json();
}

// ------------------------------------------------------------
// Получить активную схему
// ------------------------------------------------------------
async function getSchema(token) {
    const res = await fetch(`${API_URL}/schema`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    return res.json();
}

// ------------------------------------------------------------
// Отправить данные формы
// ------------------------------------------------------------
async function sendFormData(token, formData) {
    const res = await fetch(`${API_URL}/submit`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ formData })
    });

    return res.json();
}

// ------------------------------------------------------------
// Получить историю запросов пользователя
// ------------------------------------------------------------
async function getHistory(token) {
    const res = await fetch(`${API_URL}/history`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    return res.json();
}

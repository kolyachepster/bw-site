# 🎙️ BlooodWash Studio — Сайт студии

Сайт студии фандаба **BloodWash Studio**: релизы, команда, DUB-in платформа.

---

## 📁 Структура проекта

```
/
├── index.html              ← Главная страница (только HTML-разметка)
├── favicon.png             ← Иконка сайта
├── .gitignore
│
├── css/
│   └── style.css           ← Все стили сайта
│
├── config/
│   └── config.js           ← 🔑 Ключи Firebase, EmailJS, настройки
│
└── js/
    ├── app.js              ← Точка входа, инициализация, маршрутизация
    ├── core.js             ← Утилиты: toast, модалы, навигация, роли
    ├── auth.js             ← Авторизация, профиль пользователя
    ├── releases.js         ← Релизы, эпизоды, лайки, политика конф.
    ├── comments.js         ← Комментарии к релизам
    ├── team.js             ← Команда студии, страницы участников
    ├── users.js            ← Профили, подписки, управление ролями
    ├── achievements.js     ← Достижения пользователей
    └── dubin.js            ← DUB-in: архив проектов, загрузка файлов
```

## 📦 Используемые технологии

| Технология | Версия | Назначение |
|---|---|---|
| Firebase JS SDK | 10.8.1 | Auth + Firestore |
| EmailJS | 4.x | Отправка писем |
| SortableJS | 1.15.0 | Drag & drop в команде |
| Font Awesome | 6.0.0 | Иконки |

---

© 2024–2026 Sound Wave Studio
# 🩸 Blood Wash Studio — Сайт студии дубляжа

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Firebase](https://img.shields.io/badge/Firebase-10.8.1-orange)](https://firebase.google.com/)
[![EmailJS](https://img.shields.io/badge/EmailJS-4.x-blue)](https://www.emailjs.com/)

Современный веб-сайт для студии фандаба **Blood Wash Studio** с полным функционалом: релизы, команда, DUB-in платформа, заказ озвучки, система достижений и многое другое.

## ✨ Возможности

- 🎬 **Релизы** — просмотр, лайки, комментарии, списки
- 👥 **Команда** — страницы участников с правами доступа
- 🎙️ **DUB-in** — закрытый раздел для команды с файлами проектов
- 💰 **Заказ озвучки** — бесплатные предложения и платные заказы через Telegram
- 🏆 **Достижения** — автоматические и ручные (для админов)
- 🔐 **Авторизация** — через Firebase Auth с ролями (user/dub/moderator/admin)
- 📱 **Адаптивный дизайн** — работает на всех устройствах
- 🎥 **Встроенный плеер** — поддержка YouTube и Google Drive

## 🚀 Быстрый старт

### 1. Клонирование
```bash
git clone https://github.com/YOUR_USERNAME/blood-wash-studio.git
cd blood-wash-studio

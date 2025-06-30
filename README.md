# 🚀 Excel, CSV & PDF Analyzer с AI (OpenAI)

Веб-приложение для анализа и визуализации табличных данных с автоматическим AI-анализом (OpenAI). Поддерживает загрузку Excel, CSV и PDF, интерактивные графики, экспорт PDF-отчёта с результатами нейросетевого анализа.

---

## 📦 Возможности

- Загрузка файлов: **Excel (.xlsx, .xls), CSV, PDF**
- Автоматическое определение типов данных
- Базовая статистика и интерактивные диаграммы (Chart.js)
- Просмотр и экспорт данных
- **AI-анализ первых 15 строк** (через OpenAI API)
- Экспорт PDF-отчёта с AI-анализом
- Современный адаптивный интерфейс

---

## 🛠️ Установка и запуск

1. **Клонируйте репозиторий и перейдите в папку проекта:**
   ```bash
   git clone <repo_url>
   cd DZ5
   ```

2. **Установите зависимости:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Настройте AI:**
   В файле `config.env` укажите ваш OpenAI-совместимый API-ключ:
   ```env
   AI_2_API_KEY=your_openai_api_key_here
   AI_2_BASE_URL=https://api.proxyapi.ru/openai/v1
   AI_2_MODEL=gpt-4o-mini
   ```

4. **Запустите приложение:**
   ```bash
   python app.py
   ```
   Откройте [http://127.0.0.1:5000](http://127.0.0.1:5000) в браузере.

---

## 🗂️ Структура проекта

```
DZ5/
├── app.py               # Flask backend
├── ai_analyzer.py       # Модуль AI-анализа (OpenAI)
├── ai1_terminal.py      # Терминальный AI клиент 1 (опционально)
├── ai2_terminal.py      # Терминальный AI клиент 2 (опционально)
├── test_ai.py           # Тест AI модуля
├── static/              # CSS, JS, шрифты
│   ├── style.css
│   └── script.js
├── templates/
│   └── index.html       # Основной HTML-шаблон
├── uploads/             # Загруженные пользователем файлы
├── requirements.txt     # Зависимости Python
├── config.env           # Конфиг для AI (создать вручную)
├── README.md            # Документация
└── .gitignore
```

---

## 🤖 AI-анализ (OpenAI)

- Используется OpenAI API (или совместимый прокси)
- Анализируются первые 15 строк таблицы
- Ответ нейросети структурирован и включается в PDF-отчёт
- Язык анализа: **английский**

**Тестирование AI:**
```bash
python test_ai.py
```

---

## 🐍 Основные зависимости

- Flask
- pandas, numpy
- openai
- pdfplumber
- openpyxl, xlrd
- Chart.js (frontend)

---

## 🐛 Устранение неполадок

- Проверьте настройки в `config.env`
- Убедитесь, что все зависимости установлены
- Для AI проблем — запустите `python test_ai.py`
- Проверьте логи в консоли

---

## 📄 Лицензия

MIT License

---

## 📞 Поддержка

Если возникли вопросы — создайте issue или напишите!

---

## 🚀 Шпаргалка: как отправить изменения на GitHub

### 1. Настройка имени и email для git (один раз на компьютере)
```bash
git config --global user.name "Ваше Имя"
git config --global user.email "your@email.com"
```
Проверить:
```bash
git config --global --list
```

### 2. Проверить статус репозитория
```bash
git status
```

### 3. Добавить файлы в индекс
```bash
git add .
```
или только нужные файлы:
```bash
git add config.env.example README.md
```

### 4. Сделать коммит
```bash
git commit -m "Краткое описание изменений"
```

### 5. Отправить изменения на GitHub
Если работаете в своей ветке:
```bash
git push origin <branch_name>
```
Если в основной ветке:
```bash
git push origin main
```

### 6. Проверить результат на GitHub
Перейдите на сайт GitHub и убедитесь, что изменения появились.

--- 
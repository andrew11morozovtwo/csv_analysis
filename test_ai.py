#!/usr/bin/env python3
"""
Тестовый скрипт для проверки работы AI модуля
"""

import os
import sys
import json
from dotenv import load_dotenv

# Загружаем конфигурацию
load_dotenv('config.env')

def test_ai_module():
    """Тестирует AI модуль"""
    print("🧪 Тестирование AI модуля...")
    
    try:
        # Импортируем AI модуль
        from ai_analyzer import AIAnalyzer
        
        print("✅ AI модуль успешно импортирован")
        
        # Проверяем конфигурацию
        ai_2_api_key = os.getenv("AI_2_API_KEY", "your_openai_api_key_here")
        ai_2_base_url = os.getenv("AI_2_BASE_URL", "https://api.proxyapi.ru/openai/v1")
        ai_2_model = os.getenv("AI_2_MODEL", "gpt-4o-mini")
        
        print(f"📋 Конфигурация:")
        print(f"   API Key: {'*' * 10 if ai_2_api_key != 'your_openai_api_key_here' else 'НЕ НАСТРОЕН'}")
        print(f"   Base URL: {ai_2_base_url}")
        print(f"   Model: {ai_2_model}")
        
        if ai_2_api_key == "your_openai_api_key_here":
            print("❌ API ключ не настроен в config.env")
            print("📋 Добавьте AI_2_API_KEY в config.env")
            return False
        
        # Создаем экземпляр анализатора
        print("\n🔧 Создание AI анализатора...")
        analyzer = AIAnalyzer()
        print("✅ AI анализатор создан")
        
        # Проверяем статус подключения
        print("\n🔍 Проверка статуса подключения...")
        status = analyzer.get_status()
        
        if status['connected']:
            print(f"✅ Подключение установлено")
            print(f"   Модель: {status['model']}")
            print(f"   Статус: {status['status']}")
        else:
            print(f"❌ Ошибка подключения: {status['status']}")
            return False
        
        # Тестируем анализ данных
        print("\n📊 Тестирование анализа данных...")
        
        # Тестовые данные
        test_data = [
            {'name': 'Иван', 'age': 25, 'salary': 50000, 'department': 'IT'},
            {'name': 'Мария', 'age': 30, 'salary': 60000, 'department': 'HR'},
            {'name': 'Петр', 'age': 28, 'salary': 55000, 'department': 'IT'},
            {'name': 'Анна', 'age': 35, 'salary': 70000, 'department': 'Finance'},
            {'name': 'Сергей', 'age': 27, 'salary': 52000, 'department': 'IT'},
            {'name': 'Елена', 'age': 32, 'salary': 65000, 'department': 'HR'},
            {'name': 'Дмитрий', 'age': 29, 'salary': 58000, 'department': 'IT'},
            {'name': 'Ольга', 'age': 33, 'salary': 68000, 'department': 'Finance'},
            {'name': 'Алексей', 'age': 26, 'salary': 51000, 'department': 'IT'},
            {'name': 'Татьяна', 'age': 31, 'salary': 62000, 'department': 'HR'},
            {'name': 'Михаил', 'age': 34, 'salary': 72000, 'department': 'Finance'},
            {'name': 'Наталья', 'age': 28, 'salary': 54000, 'department': 'IT'},
            {'name': 'Андрей', 'age': 36, 'salary': 75000, 'department': 'Finance'},
            {'name': 'Юлия', 'age': 29, 'salary': 56000, 'department': 'IT'},
            {'name': 'Владимир', 'age': 32, 'salary': 67000, 'department': 'HR'}
        ]
        
        test_columns = ['name', 'age', 'salary', 'department']
        
        # Анализируем данные
        result = analyzer.analyze_data(test_data, test_columns)
        
        if result['success']:
            print("✅ Анализ данных успешно выполнен")
            print(f"   Модель: {result['model']}")
            print("\n📝 Результат анализа:")
            print("-" * 50)
            print(result['analysis'])
            print("-" * 50)
        else:
            print(f"❌ Ошибка анализа: {result['error']}")
            return False
        
        print("\n🎉 Все тесты пройдены успешно!")
        return True
        
    except ImportError as e:
        print(f"❌ Ошибка импорта AI модуля: {e}")
        return False
    except Exception as e:
        print(f"❌ Неожиданная ошибка: {e}")
        return False

def main():
    """Основная функция"""
    print("🚀 Запуск тестирования AI модуля...")
    print("=" * 50)
    
    success = test_ai_module()
    
    print("\n" + "=" * 50)
    if success:
        print("✅ Тестирование завершено успешно")
        print("🎯 AI модуль готов к использованию в веб-приложении")
    else:
        print("❌ Тестирование завершено с ошибками")
        print("🔧 Проверьте настройки в config.env")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main()) 
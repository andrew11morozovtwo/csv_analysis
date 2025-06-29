#!/usr/bin/env python3
"""
Программа для работы с первой OpenAI моделью через терминал
Использует ту же конфигурацию, что и основной бот
"""

import os
from dotenv import load_dotenv
from openai import OpenAI

# ===== ЗАГРУЗКА КОНФИГУРАЦИИ =====
load_dotenv('config.env')

# Получаем конфигурацию
AI_1_API_KEY = os.getenv("AI_1_API_KEY", "your_openai_api_key_here")
AI_1_BASE_URL = os.getenv("AI_1_BASE_URL", "https://api.proxyapi.ru/openai/v1")
AI_1_MODEL = os.getenv("AI_1_MODEL", "gpt-3.5-turbo-1106")

class AI1Terminal:
    """Класс для работы с первой OpenAI моделью через терминал"""
    
    def __init__(self):
        if AI_1_API_KEY == "your_openai_api_key_here":
            print("❌ Ошибка: API ключ для первой модели не настроен в config.env")
            print("📋 Убедитесь, что AI_1_API_KEY указан правильно")
            exit(1)
        
        self.client = OpenAI(
            api_key=AI_1_API_KEY,
            base_url=AI_1_BASE_URL,
        )
        print(f"✅ Подключение к {AI_1_MODEL} установлено")
    
    def send_message(self, message: str) -> str:
        """Отправка сообщения к первой модели"""
        try:
            chat_completion = self.client.chat.completions.create(
                model=AI_1_MODEL,
                messages=[
                    {
                        "role": "user",
                        "content": message
                    }
                ]
            )
            
            return chat_completion.choices[0].message.content
            
        except Exception as e:
            return f"❌ Ошибка: {str(e)}"
    
    def run_interactive(self):
        """Интерактивный режим работы"""
        print("\n" + "="*50)
        print("🤖 AI-1 Terminal (OpenAI GPT-3.5)")
        print("="*50)
        print(f"📋 Модель: {AI_1_MODEL}")
        print("💡 Введите ваш вопрос (или 'quit' для выхода)")
        print("="*50)
        
        while True:
            try:
                # Получаем ввод пользователя
                user_input = input("\n👤 Вы: ").strip()
                
                # Проверяем команды выхода
                if user_input.lower() in ['quit', 'exit', 'выход', 'q']:
                    print("👋 До свидания!")
                    break
                
                if not user_input:
                    print("⚠️ Введите сообщение")
                    continue
                
                # Отправляем запрос
                print("⏳ Обрабатываю запрос...")
                response = self.send_message(user_input)
                
                # Выводим ответ
                print(f"\n🤖 AI-1: {response}")
                
            except KeyboardInterrupt:
                print("\n\n👋 До свидания!")
                break
            except Exception as e:
                print(f"❌ Ошибка: {e}")

def main():
    """Основная функция"""
    print("🚀 Запуск AI-1 Terminal...")
    
    try:
        ai = AI1Terminal()
        ai.run_interactive()
    except Exception as e:
        print(f"❌ Критическая ошибка: {e}")
        print("📋 Проверьте настройки в config.env")

if __name__ == "__main__":
    main() 
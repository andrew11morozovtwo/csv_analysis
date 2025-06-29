#!/usr/bin/env python3
"""
Главный скрипт для запуска AI терминальных приложений
"""

import os
import sys

def show_menu():
    """Показывает меню выбора приложения"""
    print("\n" + "="*50)
    print("🤖 AI Terminal Applications")
    print("="*50)
    print("1. AI-1 Terminal (GPT-3.5-turbo)")
    print("2. AI-2 Terminal (GPT-4o-mini)")
    print("3. Выход")
    print("="*50)

def check_config():
    """Проверяет наличие конфигурационного файла"""
    if not os.path.exists('config.env'):
        print("❌ Ошибка: Файл config.env не найден!")
        print("📋 Создайте файл config.env с настройками API ключей")
        return False
    return True

def main():
    """Основная функция"""
    print("🚀 Запуск AI Terminal Applications...")
    
    # Проверяем конфигурацию
    if not check_config():
        return
    
    while True:
        show_menu()
        
        try:
            choice = input("\n🎯 Выберите приложение (1-3): ").strip()
            
            if choice == "1":
                print("\n🚀 Запуск AI-1 Terminal...")
                os.system(f"{sys.executable} ai1_terminal.py")
                
            elif choice == "2":
                print("\n🚀 Запуск AI-2 Terminal...")
                os.system(f"{sys.executable} ai2_terminal.py")
                
            elif choice == "3":
                print("👋 До свидания!")
                break
                
            else:
                print("⚠️ Неверный выбор. Попробуйте снова.")
                
        except KeyboardInterrupt:
            print("\n\n👋 До свидания!")
            break
        except Exception as e:
            print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    main() 
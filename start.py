#!/usr/bin/env python3
"""
Скрипт для запуска Excel & CSV Analyzer
"""

import os
import sys
import subprocess

def check_dependencies():
    """Проверяет установленные зависимости"""
    required_packages = ['flask', 'pandas', 'openpyxl', 'xlrd']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print("❌ Отсутствуют необходимые пакеты:")
        for package in missing_packages:
            print(f"   - {package}")
        print("\n📦 Установите зависимости командой:")
        print("   pip install -r requirements.txt")
        return False
    
    return True

def create_directories():
    """Создает необходимые директории"""
    directories = ['uploads', 'templates', 'static']
    
    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"✅ Создана папка: {directory}")

def main():
    """Основная функция"""
    print("🚀 Запуск Excel & CSV Analyzer")
    print("=" * 40)
    
    # Проверяем зависимости
    if not check_dependencies():
        sys.exit(1)
    
    # Создаем директории
    create_directories()
    
    print("\n✅ Все проверки пройдены!")
    print("🌐 Приложение будет доступно по адресу: http://127.0.0.1:5000")
    print("⏹️  Для остановки нажмите Ctrl+C")
    print("=" * 40)
    
    # Запускаем приложение
    try:
        subprocess.run([sys.executable, 'app.py'], check=True)
    except KeyboardInterrupt:
        print("\n👋 Приложение остановлено")
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Ошибка при запуске: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 
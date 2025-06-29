#!/usr/bin/env python3
"""
Модуль для анализа данных через Яндекс.GPT
Использует тот же подход, что и ai2_terminal.py
"""

import os
from dotenv import load_dotenv
from openai import OpenAI
import json

# ===== ЗАГРУЗКА КОНФИГУРАЦИИ =====
load_dotenv('config.env')

# Получаем конфигурацию
AI_2_API_KEY = os.getenv("AI_2_API_KEY", "your_openai_api_key_here")
AI_2_BASE_URL = os.getenv("AI_2_BASE_URL", "https://api.proxyapi.ru/openai/v1")
AI_2_MODEL = os.getenv("AI_2_MODEL", "gpt-4o-mini")

class AIAnalyzer:
    """Класс для анализа данных через Яндекс.GPT"""
    
    def __init__(self):
        if AI_2_API_KEY == "your_openai_api_key_here":
            raise ValueError("API ключ для AI не настроен в config.env. Убедитесь, что AI_2_API_KEY указан правильно.")
        
        self.client = OpenAI(
            api_key=AI_2_API_KEY,
            base_url=AI_2_BASE_URL,
        )
        self.model = AI_2_MODEL
    
    def format_table_data(self, data, columns):
        """Форматирует данные таблицы в читаемый вид"""
        if not data or not columns:
            return "Данные отсутствуют"
        
        # Создаем заголовок таблицы
        formatted_data = " | ".join(columns) + "\n"
        formatted_data += "-" * len(formatted_data) + "\n"
        
        # Добавляем строки данных
        for row in data:
            row_values = []
            for column in columns:
                value = row.get(column, '')
                # Ограничиваем длину значения для читаемости
                if isinstance(value, str) and len(value) > 50:
                    value = value[:47] + "..."
                row_values.append(str(value))
            formatted_data += " | ".join(row_values) + "\n"
        
        return formatted_data
    
    def create_analysis_prompt(self, table_data, columns):
        """Создает промпт для анализа данных"""
        formatted_data = self.format_table_data(table_data, columns)
        
        prompt = f"""You are an analytical system with extensive experience. Your task is to analyze tabular data, draw conclusions, and identify anomalies or interesting trends.

Here are the first 15 rows of the table:

{formatted_data}

Please analyze this data and provide a structured response in the following format:

### 1. Brief Description of Data Structure
[Describe the dataset structure, number of rows/columns, and data types]

### 2. Main Trends or Patterns
- [Trend 1]
- [Trend 2]
- [Trend 3]

### 3. Possible Anomalies or Unusual Values
- [Anomaly 1]
- [Anomaly 2]
- [Anomaly 3]

### 4. Practical Conclusions and Recommendations
- [Conclusion 1]
- [Conclusion 2]
- [Conclusion 3]

Please provide the analysis in English language with clear bullet points and structured formatting."""
        
        return prompt
    
    def analyze_data(self, table_data, columns):
        """Анализирует данные через Яндекс.GPT"""
        try:
            # Создаем промпт
            prompt = self.create_analysis_prompt(table_data, columns)
            
            # Отправляем запрос к AI
            chat_completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=2000,  # Ограничиваем длину ответа
                temperature=0.7   # Баланс между креативностью и точностью
            )
            
            response = chat_completion.choices[0].message.content
            return {
                'success': True,
                'analysis': response,
                'model': self.model
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"Ошибка при анализе данных: {str(e)}",
                'model': self.model
            }
    
    def get_status(self):
        """Проверяет статус подключения к AI"""
        try:
            # Простой тестовый запрос
            test_completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": "Тест подключения"
                    }
                ],
                max_tokens=10
            )
            return {
                'connected': True,
                'model': self.model,
                'status': 'Подключено'
            }
        except Exception as e:
            return {
                'connected': False,
                'model': self.model,
                'status': f'Ошибка подключения: {str(e)}'
            } 
#!/usr/bin/env python3
"""
Веб-приложение для анализа Excel, CSV и PDF файлов
"""

import os
import pandas as pd
import json
import csv
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import numpy as np
import pdfplumber

# Импортируем AI модуль
try:
    from ai_analyzer import AIAnalyzer
    AI_AVAILABLE = True
except ImportError:
    AI_AVAILABLE = False
    print("⚠️ AI модуль недоступен. Анализ через нейросеть отключен.")

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['SECRET_KEY'] = 'your-secret-key-here'

# Создаем папку для загрузок если её нет
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Разрешенные расширения файлов
ALLOWED_EXTENSIONS = {'xlsx', 'xls', 'csv', 'pdf'}

# Инициализируем AI анализатор
ai_analyzer = None
if AI_AVAILABLE:
    try:
        ai_analyzer = AIAnalyzer()
        print("✅ AI анализатор инициализирован")
    except Exception as e:
        print(f"❌ Ошибка инициализации AI анализатора: {e}")
        ai_analyzer = None

def allowed_file(filename):
    """Проверяет, является ли файл разрешенным"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def detect_csv_delimiter(filepath):
    """Автоматически определяет разделитель в CSV файле"""
    try:
        with open(filepath, 'r', encoding='utf-8') as file:
            sample = file.read(1024)
            if not sample.strip():
                return ','
            sniffer = csv.Sniffer()
            delimiter = sniffer.sniff(sample).delimiter
            return delimiter
    except:
        # Если не удалось определить, пробуем стандартные разделители
        delimiters = [',', ';', '\t', '|']
        for delimiter in delimiters:
            try:
                with open(filepath, 'r', encoding='utf-8') as file:
                    sample = file.read(1024)
                    if delimiter in sample:
                        return delimiter
            except:
                continue
        return ','  # По умолчанию запятая

def extract_pdf_table(filepath):
    """Извлекает первую таблицу из PDF файла"""
    try:
        with pdfplumber.open(filepath) as pdf:
            if not pdf.pages:
                raise Exception("PDF файл не содержит страниц")
            
            # Ищем таблицу на первой странице
            first_page = pdf.pages[0]
            tables = first_page.extract_tables()
            
            if not tables:
                raise Exception("На первой странице PDF не найдено таблиц")
            
            # Берем первую таблицу
            table = tables[0]
            
            if not table or len(table) == 0:
                raise Exception("Первая таблица пуста")
            
            # Убираем пустые строки
            table = [row for row in table if any(cell is not None and str(cell).strip() for cell in row)]
            
            if len(table) < 2:  # Нужна хотя бы заголовок и одна строка данных
                raise Exception("Таблица содержит недостаточно данных (нужны заголовок и хотя бы одна строка)")
            
            # Первая строка - заголовки
            headers = [str(cell).strip() if cell is not None else f'Column_{i}' for i, cell in enumerate(table[0])]
            
            # Остальные строки - данные
            data_rows = []
            for row in table[1:]:
                # Дополняем строку до длины заголовков
                while len(row) < len(headers):
                    row.append(None)
                # Обрезаем если длиннее
                row = row[:len(headers)]
                # Преобразуем в строки и очищаем
                cleaned_row = [str(cell).strip() if cell is not None else '' for cell in row]
                data_rows.append(cleaned_row)
            
            # Создаем DataFrame
            df = pd.DataFrame(data_rows, columns=pd.Index(headers))
            
            # Удаляем столбцы с пустыми заголовками
            df = df.loc[:, df.columns.map(lambda x: str(x).strip() != '')]
            
            # Удаляем полностью пустые строки и столбцы
            df = df.dropna(how='all')
            df = df.dropna(axis=1, how='all')
            
            if df.empty:
                raise Exception("После очистки таблица стала пустой")
            
            return df
            
    except Exception as e:
        raise Exception(f"Ошибка при извлечении таблицы из PDF: {str(e)}")

def read_file(filepath):
    """Читает файл в зависимости от его типа"""
    file_extension = filepath.rsplit('.', 1)[1].lower()
    
    try:
        if file_extension in ['xlsx', 'xls']:
            try:
                # Пробуем прочитать Excel файл с openpyxl
                if file_extension == 'xlsx':
                    df = pd.read_excel(filepath, engine='openpyxl')
                    return df
                else:
                    # Для .xls файлов используем xlrd
                    df = pd.read_excel(filepath, engine='xlrd')
                    return df
            except Exception as e:
                try:
                    # Пробуем альтернативный движок
                    if file_extension == 'xlsx':
                        df = pd.read_excel(filepath, engine='xlrd')
                    else:
                        df = pd.read_excel(filepath, engine='openpyxl')
                    return df
                except Exception as e2:
                    raise Exception(f"Не удалось прочитать Excel файл. Убедитесь, что файл не поврежден и имеет правильный формат.")
                    
        elif file_extension == 'csv':
            delimiter = detect_csv_delimiter(filepath)
            
            # Пробуем разные кодировки с современными параметрами
            encodings = ['utf-8', 'cp1251', 'latin-1', 'iso-8859-1']
            for encoding in encodings:
                try:
                    df = pd.read_csv(
                        filepath, 
                        delimiter=delimiter, 
                        encoding=encoding,
                        on_bad_lines='skip',  # Пропускаем проблемные строки
                        low_memory=False
                    )
                    if not df.empty:
                        return df
                except UnicodeDecodeError:
                    continue
                except Exception as e:
                    continue
            
            # Если ничего не работает, используем utf-8 с обработкой ошибок
            return pd.read_csv(
                filepath, 
                delimiter=delimiter, 
                encoding='utf-8', 
                on_bad_lines='skip',
                low_memory=False
            )
        
        elif file_extension == 'pdf':
            return extract_pdf_table(filepath)
        
        raise ValueError(f"Неподдерживаемый тип файла: {file_extension}")
        
    except Exception as e:
        raise Exception(f"Ошибка при чтении файла {filepath}: {str(e)}")

def detect_data_types(df):
    """Автоматически определяет типы данных в столбцах"""
    data_types = {}
    
    for column in df.columns:
        # Пропускаем столбцы с пустыми заголовками или полностью пустые
        if str(column).strip() == '' or df[column].isna().all():
            data_types[column] = 'empty'
            continue
            
        # Пробуем определить тип
        sample_data = df[column].dropna().head(100)
        
        if len(sample_data) == 0:
            data_types[column] = 'empty'
            continue
            
        # Проверяем на числовой тип
        try:
            pd.to_numeric(sample_data, errors='raise')
            data_types[column] = 'numeric'
        except:
            # Проверяем на дату с более строгими параметрами
            try:
                # Пробуем только стандартные форматы дат
                pd.to_datetime(sample_data, format='%Y-%m-%d', errors='raise')
                data_types[column] = 'datetime'
            except:
                try:
                    pd.to_datetime(sample_data, format='%d.%m.%Y', errors='raise')
                    data_types[column] = 'datetime'
                except:
                    try:
                        pd.to_datetime(sample_data, format='%m/%d/%Y', errors='raise')
                        data_types[column] = 'datetime'
                    except:
                        # Проверяем на категориальный (если уникальных значений мало)
                        unique_count = sample_data.nunique()
                        total_count = len(sample_data)
                        if total_count > 0:
                            unique_ratio = unique_count / total_count
                            if unique_ratio < 0.5 and unique_count < 50:
                                data_types[column] = 'categorical'
                            else:
                                data_types[column] = 'text'
                        else:
                            data_types[column] = 'text'
    
    return data_types

def generate_charts_data(df, data_types, selected_category=None):
    """Генерирует данные для диаграмм на основе типов данных"""
    charts = []
    
    # Ищем числовые столбцы для bar chart
    numeric_columns = [col for col, dtype in data_types.items() if dtype == 'numeric']
    categorical_columns = [col for col, dtype in data_types.items() if dtype == 'categorical']
    
    # Если выбрана категория, используем её
    if selected_category and selected_category in categorical_columns:
        categorical_columns = [selected_category]
    
    # Bar chart: категория + числовое значение
    if categorical_columns and numeric_columns:
        for cat_col in categorical_columns[:2]:  # Берем максимум 2 категориальных столбца
            for num_col in numeric_columns[:2]:   # Берем максимум 2 числовых столбца
                if cat_col != num_col:
                    # Группируем данные
                    grouped = df.groupby(cat_col)[num_col].sum().sort_values(ascending=False).head(10)
                    
                    charts.append({
                        'type': 'bar',
                        'title': f'{num_col} по {cat_col}',
                        'category': cat_col,
                        'value': num_col,
                        'data': {
                            'labels': grouped.index.tolist(),
                            'values': grouped.values.tolist()
                        }
                    })
                    break
            break
    
    # Line chart: дата + числовое значение
    datetime_columns = [col for col, dtype in data_types.items() if dtype == 'datetime']
    if datetime_columns and numeric_columns:
        for date_col in datetime_columns[:1]:  # Берем первый столбец с датами
            for num_col in numeric_columns[:1]:  # Берем первый числовой столбец
                if date_col != num_col:
                    # Группируем по дате
                    df_copy = df.copy()
                    df_copy[date_col] = pd.to_datetime(df_copy[date_col])
                    df_copy = df_copy.sort_values(date_col)
                    
                    # Берем последние 20 точек для читаемости
                    recent_data = df_copy.tail(20)
                    
                    charts.append({
                        'type': 'line',
                        'title': f'{num_col} по времени ({date_col})',
                        'category': date_col,
                        'value': num_col,
                        'data': {
                            'labels': recent_data[date_col].dt.strftime('%Y-%m-%d').tolist(),
                            'values': recent_data[num_col].tolist()
                        }
                    })
                    break
    
    return charts

def calculate_basic_stats(df, data_types):
    """Вычисляет базовую статистику по данным"""
    stats = {}
    
    for column in df.columns:
        dtype = data_types.get(column, 'text')
        
        try:
            if dtype == 'numeric':
                stats[column] = {
                    'type': 'numeric',
                    'sum': float(df[column].sum()),
                    'mean': float(df[column].mean()),
                    'min': float(df[column].min()),
                    'max': float(df[column].max()),
                    'count': int(df[column].count())
                }
            elif dtype == 'datetime':
                stats[column] = {
                    'type': 'datetime',
                    'min_date': str(df[column].min()),
                    'max_date': str(df[column].max()),
                    'count': int(df[column].count())
                }
            else:
                stats[column] = {
                    'type': dtype,
                    'unique_count': int(df[column].nunique()),
                    'total_count': int(df[column].count()),
                    'most_common': df[column].mode().iloc[0] if not df[column].mode().empty else None
                }
        except Exception as e:
            # Устанавливаем базовую статистику в случае ошибки
            stats[column] = {
                'type': 'error',
                'error': str(e),
                'count': int(df[column].count()) if len(df) > 0 else 0
            }
    
    return stats

@app.route('/')
def index():
    """Главная страница"""
    return render_template('index.html')

@app.route('/debug')
def debug():
    """Отладочная страница"""
    return send_from_directory('.', 'debug.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """Обработка загрузки файла"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Файл не выбран'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Файл не выбран'}), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename) if file.filename else 'unknown_file'
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            
            # Сохраняем файл
            file.save(filepath)
            
            try:
                # Читаем файл
                df = read_file(filepath)
                
                # Проверяем, что файл не пустой
                if df.empty:
                    return jsonify({'error': 'Файл пустой или не содержит данных'}), 400
                
                # Определяем типы данных
                data_types = detect_data_types(df)
                
                # Генерируем данные для диаграмм
                charts = generate_charts_data(df, data_types)
                
                # Вычисляем базовую статистику
                stats = calculate_basic_stats(df, data_types)
                
                # Подготавливаем первые 100 строк
                first_100 = df.head(100).fillna('').to_dict('records')
                
                # Получаем названия столбцов
                columns = df.columns.tolist()
                
                return jsonify({
                    'success': True,
                    'filename': filename,
                    'total_rows': len(df),
                    'columns': columns,
                    'data': first_100,
                    'data_types': data_types,
                    'charts': charts,
                    'stats': stats
                })
                
            except Exception as e:
                # Удаляем файл в случае ошибки
                if os.path.exists(filepath):
                    os.remove(filepath)
                return jsonify({'error': f'Ошибка при обработке файла: {str(e)}'}), 500
        
        return jsonify({'error': 'Неподдерживаемый формат файла. Поддерживаются: .xlsx, .xls, .csv, .pdf'}), 400
        
    except Exception as e:
        return jsonify({'error': f'Неожиданная ошибка: {str(e)}'}), 500

@app.route('/load_more', methods=['POST'])
def load_more():
    """Загрузка дополнительных строк"""
    data = request.get_json()
    filename = data.get('filename')
    offset = data.get('offset', 0)
    limit = data.get('limit', 100)
    
    if not filename:
        return jsonify({'error': 'Имя файла не указано'}), 400
    
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    if not os.path.exists(filepath):
        return jsonify({'error': 'Файл не найден'}), 404
    
    try:
        df = read_file(filepath)
        end_offset = min(offset + limit, len(df))
        
        if offset >= len(df):
            return jsonify({'data': [], 'has_more': False})
        
        more_data = df.iloc[offset:end_offset].fillna('').to_dict('records')
        has_more = end_offset < len(df)
        
        return jsonify({
            'data': more_data,
            'has_more': has_more,
            'offset': end_offset
        })
        
    except Exception as e:
        return jsonify({'error': f'Ошибка при загрузке данных: {str(e)}'}), 500

@app.route('/update_charts', methods=['POST'])
def update_charts():
    """Обновление диаграмм с выбранной категорией"""
    data = request.get_json()
    filename = data.get('filename')
    selected_category = data.get('selected_category')
    
    if not filename:
        return jsonify({'error': 'Имя файла не указано'}), 400
    
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    if not os.path.exists(filepath):
        return jsonify({'error': 'Файл не найден'}), 404
    
    try:
        df = read_file(filepath)
        data_types = detect_data_types(df)
        charts = generate_charts_data(df, data_types, selected_category)
        
        return jsonify({
            'success': True,
            'charts': charts
        })
        
    except Exception as e:
        return jsonify({'error': f'Ошибка при обновлении диаграмм: {str(e)}'}), 500

@app.route('/ai_analysis', methods=['POST'])
def ai_analysis():
    """Анализ данных через Яндекс.GPT"""
    try:
        data = request.get_json()
        filename = data.get('filename')
        
        if not filename:
            return jsonify({'error': 'Имя файла не указано'}), 400
        
        # Проверяем доступность AI анализатора
        if not AI_AVAILABLE or ai_analyzer is None:
            return jsonify({
                'error': 'AI анализатор недоступен. Проверьте настройки в config.env',
                'status': 'unavailable'
            }), 503
        
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'Файл не найден'}), 404
        
        # Читаем файл и берем первые 15 строк
        df = read_file(filepath)
        if df.empty:
            return jsonify({'error': 'Файл пустой или не содержит данных'}), 400
        
        # Берем первые 15 строк
        first_15_rows = df.head(15).fillna('').to_dict('records')
        columns = df.columns.tolist()
        
        # Анализируем данные через AI
        result = ai_analyzer.analyze_data(first_15_rows, columns)
        
        if result['success']:
            return jsonify({
                'success': True,
                'analysis': result['analysis'],
                'model': result['model'],
                'status': 'completed'
            })
        else:
            return jsonify({
                'error': result['error'],
                'model': result['model'],
                'status': 'error'
            }), 500
            
    except Exception as e:
        return jsonify({
            'error': f'Ошибка при анализе данных: {str(e)}',
            'status': 'error'
        }), 500

@app.route('/ai_status', methods=['GET'])
def ai_status():
    """Проверка статуса AI анализатора"""
    if not AI_AVAILABLE:
        return jsonify({
            'available': False,
            'status': 'AI модуль недоступен'
        })
    
    if ai_analyzer is None:
        return jsonify({
            'available': False,
            'status': 'AI анализатор не инициализирован'
        })
    
    try:
        status = ai_analyzer.get_status()
        return jsonify({
            'available': status['connected'],
            'model': status['model'],
            'status': status['status']
        })
    except Exception as e:
        return jsonify({
            'available': False,
            'status': f'Ошибка проверки статуса: {str(e)}'
        })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import random

app = Flask(__name__)
CORS(app)

# In-memory database (replace with real database later)
tasks = {}
completion_history = {}

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    return jsonify(list(tasks.values()))

@app.route('/api/tasks', methods=['POST'])
def create_task():
    data = request.json
    task_id = str(len(tasks) + 1)
    task = {
        'id': task_id,
        'name': data['name'],
        'expected_time': data['expected_time'],
        'created_at': datetime.now().isoformat(),
        'last_completed': None,
        'current_streak': 0,
        'status': 'pending'
    }
    tasks[task_id] = task
    completion_history[task_id] = []
    return jsonify(task)

@app.route('/api/tasks/<task_id>/complete', methods=['POST'])
def complete_task(task_id):
    if task_id in tasks:
        now = datetime.now()
        task = tasks[task_id]
        
        # Calculate time since last completion
        if task['last_completed']:
            last = datetime.fromisoformat(task['last_completed'])
            time_diff = (now - last).total_seconds() / 3600  # hours
        else:
            time_diff = 0
        
        # Update task
        task['last_completed'] = now.isoformat()
        task['current_streak'] += 1
        
        # Record completion
        completion = {
            'timestamp': now.isoformat(),
            'time_since_last': time_diff
        }
        completion_history[task_id].append(completion)
        
        return jsonify(task)
    return jsonify({'error': 'Task not found'}), 404

@app.route('/api/tasks/<task_id>/history', methods=['GET'])
def get_task_history(task_id):
    if task_id in completion_history:
        return jsonify(completion_history[task_id])
    return jsonify([])

if __name__ == '__main__':
    app.run(debug=True, port=5000)
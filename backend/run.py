from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime  
from app.task_storage.task_storage_handler import TaskStorageHandler

app = Flask(__name__)
CORS(app)

# Initialize storage handler
storage = TaskStorageHandler()

# In-memory database (replace with real database later)
tasks = {}
completion_history = {}

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    tasks = storage.get_all_tasks()
    tracking_items = storage.get_all_tracking_items()
    return jsonify(tasks + tracking_items)

@app.route('/api/tasks', methods=['POST'])
def create_task():
    """Create a new task or tracking item."""
    data = request.json

    if data.get('item_type') == 'tracking-item':
        item = storage.add_tracking_item(
            name=data['name'],
            target_unit='days',  # You might want to make this configurable
            target_value=data['expected_time'],
            description=data.get('description', '')
        )
    else:
        item = storage.add_task(
            name=data['name'],
            expected_time=data['expected_time'],
            description=data.get('description', '')
        )
    
    return jsonify(item)

@app.route('/api/tasks/<task_id>/complete', methods=['POST'])
def complete_task(task_id):
    """Record a task completion."""
    try:
        task = storage.record_task_completion(task_id)
        return jsonify(task)
    except ValueError as e:
        return jsonify({'error': str(e)}), 404

@app.route('/api/tasks/<task_id>/history', methods=['GET'])
def get_task_history(task_id):
    if task_id in completion_history:
        return jsonify(completion_history[task_id])
    return jsonify([])

if __name__ == '__main__':
    app.run(debug=True, port=5000)
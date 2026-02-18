import os
import json
import shutil
from datetime import datetime
from pathlib import Path
import uuid

class TaskStorageHandler:
    """
    Handles persistent storage for tasks and tracking items.
    Creates a structured file system to store all task data.
    """
    
    def __init__(self, base_dir=None):
        if base_dir is None:
            base_dir = os.getcwd()
        
        self.base_dir = Path(base_dir)
        self.data_dir = self.base_dir / 'data'
        self.tasks_dir = self.data_dir / 'tasks'
        self.tracking_dir = self.data_dir / 'tracking-items'
        
        # Create directory structure if it doesn't exist
        self._create_directory_structure()
        
        # Load existing tasks and tracking items
        self.tasks = self._load_all_items('tasks')
        self.tracking_items = self._load_all_items('tracking-items')
        
        print(f"TaskStorageHandler initialized at {self.data_dir}")
        print(f"Loaded {len(self.tasks)} tasks and {len(self.tracking_items)} tracking items")
    
    def _create_directory_structure(self):
        """Create the necessary directory structure."""
        self.data_dir.mkdir(exist_ok=True)
        self.tasks_dir.mkdir(exist_ok=True)
        self.tracking_dir.mkdir(exist_ok=True)
        
    
    def _load_all_items(self, item_type):
        items = {}
        source_dir = self.tasks_dir if item_type == 'tasks' else self.tracking_dir
        
        if not source_dir.exists():
            return items
        
        # Look for all subdirectories (each is an item)
        for item_dir in source_dir.iterdir():
            if item_dir.is_dir():
                metadata_file = item_dir / 'metadata.json'
                if metadata_file.exists():
                    try:
                        with open(metadata_file, 'r') as f:
                            item_data = json.load(f)
                            items[item_data['id']] = item_data
                    except Exception as e:
                        print(f"Error loading item from {item_dir}: {e}")
        
        return items
    
    def _get_item_dir(self, item_type, item_name, item_id=None):
        # Create a safe directory name from the item name
        safe_name = "".join(c for c in item_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        safe_name = safe_name.replace(' ', '_').lower()
        
        if item_id:
            dir_name = f"{safe_name}_{item_id[:8]}"
        else:
            dir_name = safe_name
        
        if item_type == 'task':
            return self.tasks_dir / dir_name
        else:
            return self.tracking_dir / dir_name
    
    def add_task(self, name, expected_time, description=""):
        task_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        task_data = {
            'id': task_id,
            'name': name,
            'description': description,
            'expected_time': expected_time,
            'type': 'task',
            'created_at': now,
            'last_completed': None,
            'current_streak': 0,
            'completion_count': 0,
            'history': []
        }
        
        # Create task directory
        task_dir = self._get_item_dir('task', name, task_id)
        task_dir.mkdir(exist_ok=True)
        
        # Save metadata
        metadata_file = task_dir / 'metadata.json'
        with open(metadata_file, 'w') as f:
            json.dump(task_data, f, indent=2)
        
        # Create history file
        history_file = task_dir / 'history.json'
        with open(history_file, 'w') as f:
            json.dump([], f, indent=2)
        
        # Add to in-memory cache
        self.tasks[task_id] = task_data
        
        print(f"Task '{name}' created with ID: {task_id}")
        return task_data
    
    def add_tracking_item(self, name, target_unit, target_value=None, description=""):
        item_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        item_data = {
            'id': item_id,
            'name': name,
            'description': description,
            'target_unit': target_unit,
            'target_value': target_value,
            'type': 'tracking-item',
            'created_at': now,
            'last_updated': None,
            'current_value': 0,
            'update_count': 0,
            'history': []
        }
        
        # Create item directory
        item_dir = self._get_item_dir('tracking-item', name, item_id)
        item_dir.mkdir(exist_ok=True)
        
        # Save metadata
        metadata_file = item_dir / 'metadata.json'
        with open(metadata_file, 'w') as f:
            json.dump(item_data, f, indent=2)
        
        # Create history file
        history_file = item_dir / 'history.json'
        with open(history_file, 'w') as f:
            json.dump([], f, indent=2)
        
        # Add to in-memory cache
        self.tracking_items[item_id] = item_data
        
        print(f"Tracking item '{name}' created with ID: {item_id}")
        return item_data
    
    def record_task_completion(self, task_id, notes=""):
        """
        Record a task completion event.
        """
        if task_id not in self.tasks:
            raise ValueError(f"Task with ID {task_id} not found")
        
        task = self.tasks[task_id]
        now = datetime.now().isoformat()
        
        # Calculate time since last completion
        if task['last_completed']:
            last = datetime.fromisoformat(task['last_completed'])
            current = datetime.now()
            hours_since = (current - last).total_seconds() / 3600
        else:
            hours_since = 0
        
        # Create completion record
        completion = {
            'timestamp': now,
            'hours_since_last': hours_since,
            'notes': notes
        }
        
        # Update task data
        task['last_completed'] = now
        task['current_streak'] += 1
        task['completion_count'] = task.get('completion_count', 0) + 1
        
        # Save to history
        task_dir = self._get_item_dir('task', task['name'], task_id)
        history_file = task_dir / 'history.json'
        
        history = []
        if history_file.exists():
            with open(history_file, 'r') as f:
                history = json.load(f)
        
        history.append(completion)
        
        with open(history_file, 'w') as f:
            json.dump(history, f, indent=2)
        
        # Update metadata
        metadata_file = task_dir / 'metadata.json'
        with open(metadata_file, 'w') as f:
            json.dump(task, f, indent=2)
        
        print(f"Task '{task['name']}' completed at {now}")
        return task
    
    def record_tracking_update(self, item_id, value, notes=""):
        """
        Record an update for a tracking item.
        """
        if item_id not in self.tracking_items:
            raise ValueError(f"Tracking item with ID {item_id} not found")
        
        item = self.tracking_items[item_id]
        now = datetime.now().isoformat()
        
        # Create update record
        update = {
            'timestamp': now,
            'value': value,
            'previous_value': item['current_value'],
            'notes': notes
        }
        
        # Update item data
        item['last_updated'] = now
        item['current_value'] = value
        item['update_count'] = item.get('update_count', 0) + 1
        
        # Save to history
        item_dir = self._get_item_dir('tracking-item', item['name'], item_id)
        history_file = item_dir / 'history.json'
        
        history = []
        if history_file.exists():
            with open(history_file, 'r') as f:
                history = json.load(f)
        
        history.append(update)
        
        with open(history_file, 'w') as f:
            json.dump(history, f, indent=2)
        
        # Update metadata
        metadata_file = item_dir / 'metadata.json'
        with open(metadata_file, 'w') as f:
            json.dump(item, f, indent=2)
        
        print(f"Tracking item '{item['name']}' updated to {value} at {now}")
        return item
    
    def get_task_history(self, task_id):
        """Get the completion history for a task."""
        if task_id not in self.tasks:
            raise ValueError(f"Task with ID {task_id} not found")
        
        task = self.tasks[task_id]
        task_dir = self._get_item_dir('task', task['name'], task_id)
        history_file = task_dir / 'history.json'
        
        if history_file.exists():
            with open(history_file, 'r') as f:
                return json.load(f)
        return []
    
    def get_tracking_history(self, item_id):
        """Get the update history for a tracking item."""
        if item_id not in self.tracking_items:
            raise ValueError(f"Tracking item with ID {item_id} not found")
        
        item = self.tracking_items[item_id]
        item_dir = self._get_item_dir('tracking-item', item['name'], item_id)
        history_file = item_dir / 'history.json'
        
        if history_file.exists():
            with open(history_file, 'r') as f:
                return json.load(f)
        return []
    
    def get_all_tasks(self):
        """Get all tasks."""
        return list(self.tasks.values())
    
    def get_all_tracking_items(self):
        """Get all tracking items."""
        return list(self.tracking_items.values())
    
    def get_item_by_id(self, item_id):
        """Get an item by ID (works for both tasks and tracking items)."""
        if item_id in self.tasks:
            return self.tasks[item_id]
        elif item_id in self.tracking_items:
            return self.tracking_items[item_id]
        else:
            return None
    
    def delete_item(self, item_id):
        # Check if it's a task
        if item_id in self.tasks:
            task = self.tasks[item_id]
            task_dir = self._get_item_dir('task', task['name'], item_id)
            
            if task_dir.exists():
                shutil.rmtree(task_dir)
            
            del self.tasks[item_id]
            print(f"Task '{task['name']}' deleted")
            return True
        
        # Check if it's a tracking item
        elif item_id in self.tracking_items:
            item = self.tracking_items[item_id]
            item_dir = self._get_item_dir('tracking-item', item['name'], item_id)
            
            if item_dir.exists():
                shutil.rmtree(item_dir)
            
            del self.tracking_items[item_id]
            print(f"Tracking item '{item['name']}' deleted")
            return True
        
        return False
    
    def export_all_data(self, export_path=None):
        """
        Export all data to a single JSON file.
        """
        if export_path is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            export_path = self.data_dir / f"export_{timestamp}.json"
        
        all_data = {
            'tasks': self.get_all_tasks(),
            'tracking_items': self.get_all_tracking_items(),
            'export_date': datetime.now().isoformat()
        }
        
        with open(export_path, 'w') as f:
            json.dump(all_data, f, indent=2)
        
        print(f"Data exported to {export_path}")
        return export_path

# Example usage
if __name__ == "__main__":
    storage = TaskStorageHandler()
    
    # Add a task
    task = storage.add_task("Clean kitchen", 30, "Wipe counters and sweep floor")
    
    # Add a tracking item
    tracking = storage.add_tracking_item("Water intake", "glasses", 8, "Daily water consumption")
    
    # Record completions/updates
    storage.record_task_completion(task['id'], "Did a thorough job")
    storage.record_tracking_update(tracking['id'], 2, "Morning water")
    storage.record_tracking_update(tracking['id'], 4, "After lunch")
    
    # Get history
    print("\nTask history:", storage.get_task_history(task['id']))
    print("Tracking history:", storage.get_tracking_history(tracking['id']))
    
    # Get all items
    print("\nAll tasks:", storage.get_all_tasks())
    print("All tracking items:", storage.get_all_tracking_items())
    
    # Export data
    storage.export_all_data()
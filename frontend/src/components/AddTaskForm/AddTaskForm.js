import React, { useState } from 'react';
import './AddTaskForm.css';

const AddTaskForm = ({ onAddTask }) => {
    const [taskName, setTaskName] = useState('');
    const [expectedTime, setExpectedTime] = useState('');
    const [itemType, setItemType] = useState('task'); // 'task' or 'tracking-item'

    const handleSubmit = (e) => {
        e.preventDefault();
        if (taskName.trim() && expectedTime) {
            onAddTask({
                name: taskName,
                expected_time: parseInt(expectedTime),
                item_type : itemType
            });
            setTaskName('');
            setExpectedTime('');
            setItemType('task')
        }
    };

  return (
    <form className="add-task-form" onSubmit={handleSubmit}>
      <h3>Add New Item</h3>
      
      {/* Compact radio group */}
      <div className="radio-group-compact">
        <label className={`radio-option ${itemType === 'task' ? 'active' : ''}`}>
          <input
            type="radio"
            name="itemType"
            value="task"
            checked={itemType === 'task'}
            onChange={(e) => setItemType(e.target.value)}
          />
          <span>Task</span>
        </label>

        <label className={`radio-option ${itemType === 'tracking-item' ? 'active' : ''}`}>
          <input
            type="radio"
            name="itemType"
            value="tracking-item"
            checked={itemType === 'tracking-item'}
            onChange={(e) => setItemType(e.target.value)}
          />
          <span>Tracking</span>
        </label>
      </div>

      <div className="form-group">
        <input
          type="text"
          placeholder={itemType === 'task' ? "Task name" : "Item name"}
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          required
        />
      </div>
      
      <div className="form-group">
        <input
          type="number"
          placeholder={itemType === 'task' ? "Expected time (Days)" : "Max Value"}
          value={expectedTime}
          onChange={(e) => setExpectedTime(e.target.value)}
          min="1"
          required
        />
      </div>

      <button type="submit" className="add-button">
        Add
      </button>
    </form>
  );
};

export default AddTaskForm;
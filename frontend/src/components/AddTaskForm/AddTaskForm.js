import React, { useState } from 'react';
import './AddTaskForm.css';

const AddTaskForm = ({ onAddTask }) => {
  const [taskName, setTaskName] = useState('');
  const [expectedTime, setExpectedTime] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (taskName.trim() && expectedTime) {
      onAddTask({
        name: taskName,
        expected_time: parseInt(expectedTime)
      });
      setTaskName('');
      setExpectedTime('');
    }
  };

  return (
    <form className="add-task-form" onSubmit={handleSubmit}>
      <h3>Add New Task</h3>
      <div className="form-group">
        <input
          type="text"
          placeholder="Task name (e.g., Clean kitchen)"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <input
          type="number"
          placeholder="Expected time (Days)"
          value={expectedTime}
          onChange={(e) => setExpectedTime(e.target.value)}
          min="1"
          required
        />
      </div>
      <button type="submit" className="add-button">Add Task</button>
    </form>
  );
};

export default AddTaskForm;
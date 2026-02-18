import React, { useState, useEffect } from 'react';
import './App.css';
import Task from './components/Task';
import AddTaskForm from './components/AddTaskForm';
import axios from 'axios';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/tasks');
      setTasks(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setLoading(false);
    }
  };

  const addTask = async (taskData) => {
    try {
      const response = await axios.post('http://localhost:5000/api/tasks', taskData);
      setTasks([...tasks, response.data]);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const completeTask = async (taskId) => {
    try {
      await axios.post(`http://localhost:5000/api/tasks/${taskId}/complete`);
      // Refresh tasks to get updated data
      fetchTasks();
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1> Domestic Tasks Tracker</h1>
        <p className="subtitle">Track your recurring household chores</p>
      </header>
      
      <main className="App-main">
        <AddTaskForm onAddTask={addTask} />
        
        <div className="tasks-container">
          <h2>Your Tasks</h2>
          {loading ? (
            <p>Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p className="no-tasks">No tasks yet. Add your first task above!</p>
          ) : (
            tasks.map(task => (
              <Task 
                key={task.id} 
                task={task} 
                onComplete={() => completeTask(task.id)}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
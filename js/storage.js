// Persists tasks in LocalStorage and provides safe read/write + first-run seeding.
window.TaskFlow = window.TaskFlow || {};

TaskFlow.Storage = (function () {
  const STORAGE_KEY = 'taskflow.tasks';

  function hasStoredTasks() {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  function loadTasks() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return { tasks: [], error: null };
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        throw new Error('Stored data is not a list of tasks.');
      }
      return { tasks: parsed, error: null };
    } catch (err) {
      console.warn('TaskFlow: failed to parse stored tasks, resetting.', err);
      return { tasks: [], error: 'Saved tasks were corrupted and have been reset.' };
    }
  }

  function saveTasks(tasks) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return { success: true, error: null };
    } catch (err) {
      console.error('TaskFlow: failed to save tasks.', err);
      return { success: false, error: err.message || 'Unknown storage error.' };
    }
  }

  function buildSampleTasks() {
    const now = new Date().toISOString();
    return [
      {
        id: 'seed-1',
        title: 'Renew domain registration',
        description: 'Domain expires soon, renew before it lapses.',
        priority: 'High',
        status: 'To Do',
        category: 'Work',
        dueDate: '2026-10-10',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'seed-2',
        title: 'Finish quarterly report',
        description: 'Pull numbers from dashboard and summarize key trends.',
        priority: 'Medium',
        status: 'In Progress',
        category: 'Personal',
        dueDate: '2026-10-15',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'seed-3',
        title: 'Learn CSS Grid subgrid',
        description: 'Go through the MDN guide and build a small demo.',
        priority: 'Low',
        status: 'To Do',
        category: 'Learning',
        dueDate: '2026-10-25',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'seed-4',
        title: 'Set up team standup notes',
        description: 'Shared doc for daily standup notes.',
        priority: 'Medium',
        status: 'Completed',
        category: 'Work',
        dueDate: '2026-10-05',
        createdAt: now,
        updatedAt: now
      }
    ];
  }

  function seedIfEmpty() {
    if (!hasStoredTasks()) {
      saveTasks(buildSampleTasks());
    }
  }

  return {
    loadTasks,
    saveTasks,
    seedIfEmpty
  };
})();

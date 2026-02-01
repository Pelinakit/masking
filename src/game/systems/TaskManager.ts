/**
 * TaskManager
 * Manages in-game tasks with YAML-driven content
 */

import type { TaskDefinition } from '@scripting/types/ScenarioTypes.js';

export interface Task {
  id: string;
  text: string;
  priority: 'low' | 'medium' | 'high';
  energyCost: number;
  timeRequired: number; // Minutes
  deadline: string | null; // HH:MM format
  completed: boolean;
  inProgress: boolean;
  timeSpent: number; // Minutes spent so far
  consequence_success?: string;
  consequence_failure?: string;
  startedAt?: string; // ISO timestamp
  completedAt?: string; // ISO timestamp
}

export type TaskFilterType = 'all' | 'incomplete' | 'in-progress' | 'completed' | 'overdue';
export type TaskSortType = 'priority' | 'deadline' | 'time-required';

export class TaskManager {
  private tasks: Map<string, Task> = new Map();
  private listeners: Set<(tasks: Task[]) => void> = new Set();
  private currentTime: string = '09:00'; // HH:MM format

  /**
   * Add a new task from a YAML definition
   */
  addTask(definition: TaskDefinition): void {
    const task: Task = {
      id: definition.id,
      text: definition.text,
      priority: definition.priority,
      energyCost: definition.energyCost,
      timeRequired: definition.timeRequired,
      deadline: definition.deadline,
      completed: definition.completed || false,
      inProgress: false,
      timeSpent: 0,
      consequence_success: definition.consequence_success,
      consequence_failure: definition.consequence_failure,
    };

    this.tasks.set(task.id, task);
    this.notifyListeners();

    console.log(`📋 New task: ${task.text}`);
  }

  /**
   * Start working on a task
   */
  startTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task || task.completed) {
      return false;
    }

    task.inProgress = true;
    task.startedAt = new Date().toISOString();
    this.notifyListeners();

    return true;
  }

  /**
   * Update progress on a task (called during action-based time)
   */
  updateTaskProgress(taskId: string, minutesWorked: number): void {
    const task = this.tasks.get(taskId);
    if (!task || !task.inProgress) return;

    task.timeSpent += minutesWorked;

    // Auto-complete if time requirement met
    if (task.timeSpent >= task.timeRequired) {
      this.completeTask(taskId);
    } else {
      this.notifyListeners();
    }
  }

  /**
   * Complete a task
   */
  completeTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task || task.completed) {
      return false;
    }

    task.completed = true;
    task.inProgress = false;
    task.completedAt = new Date().toISOString();
    this.notifyListeners();

    console.log(`✅ Task completed: ${task.text}`);

    if (task.consequence_success) {
      console.log(`  → ${task.consequence_success}`);
    }

    return true;
  }

  /**
   * Cancel/pause a task
   */
  pauseTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task && task.inProgress) {
      task.inProgress = false;
      this.notifyListeners();
    }
  }

  /**
   * Get a single task
   */
  getTask(taskId: string): Task | null {
    return this.tasks.get(taskId) || null;
  }

  /**
   * Get all tasks (optionally filtered)
   */
  getTasks(filter: TaskFilterType = 'all'): Task[] {
    const allTasks = Array.from(this.tasks.values());

    switch (filter) {
      case 'incomplete':
        return allTasks.filter(t => !t.completed);
      case 'in-progress':
        return allTasks.filter(t => t.inProgress);
      case 'completed':
        return allTasks.filter(t => t.completed);
      case 'overdue':
        return allTasks.filter(t => !t.completed && this.isOverdue(t));
      case 'all':
      default:
        return allTasks;
    }
  }

  /**
   * Get tasks sorted by priority, deadline, or time required
   */
  getTasksSorted(sortBy: TaskSortType = 'priority', filter: TaskFilterType = 'incomplete'): Task[] {
    const tasks = this.getTasks(filter);

    switch (sortBy) {
      case 'priority':
        return tasks.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

      case 'deadline':
        return tasks.sort((a, b) => {
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return this.timeToMinutes(a.deadline) - this.timeToMinutes(b.deadline);
        });

      case 'time-required':
        return tasks.sort((a, b) => a.timeRequired - b.timeRequired);

      default:
        return tasks;
    }
  }

  /**
   * Get incomplete tasks count
   */
  getIncompleteCount(): number {
    return Array.from(this.tasks.values()).filter(t => !t.completed).length;
  }

  /**
   * Get tasks by priority
   */
  getHighPriorityTasks(): Task[] {
    return Array.from(this.tasks.values()).filter(
      t => !t.completed && t.priority === 'high'
    );
  }

  /**
   * Get overdue tasks
   */
  getOverdueTasks(): Task[] {
    return this.getTasks('overdue');
  }

  /**
   * Check if a task is overdue
   */
  isOverdue(task: Task): boolean {
    if (!task.deadline || task.completed) return false;

    const deadlineMinutes = this.timeToMinutes(task.deadline);
    const currentMinutes = this.timeToMinutes(this.currentTime);

    return currentMinutes > deadlineMinutes;
  }

  /**
   * Get remaining time for a task with a deadline
   */
  getRemainingTime(taskId: string): number | null {
    const task = this.tasks.get(taskId);
    if (!task || !task.deadline) return null;

    const deadlineMinutes = this.timeToMinutes(task.deadline);
    const currentMinutes = this.timeToMinutes(this.currentTime);

    return Math.max(0, deadlineMinutes - currentMinutes);
  }

  /**
   * Get completion progress for a task (0-100)
   */
  getProgress(taskId: string): number {
    const task = this.tasks.get(taskId);
    if (!task) return 0;
    if (task.completed) return 100;

    return Math.min(100, (task.timeSpent / task.timeRequired) * 100);
  }

  /**
   * Set current game time (for deadline checks)
   */
  setCurrentTime(time: string): void {
    this.currentTime = time;
    this.notifyListeners();
  }

  /**
   * Delete a task
   */
  deleteTask(taskId: string): void {
    this.tasks.delete(taskId);
    this.notifyListeners();
  }

  /**
   * Clear all tasks
   */
  clearAll(): void {
    this.tasks.clear();
    this.notifyListeners();
  }

  /**
   * Subscribe to task changes
   */
  subscribe(listener: (tasks: Task[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    const tasks = this.getTasksSorted('priority', 'all');
    this.listeners.forEach(listener => listener(tasks));
  }

  /**
   * Convert HH:MM time string to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Export state for saving
   */
  exportState(): any {
    const tasksData: any[] = [];

    this.tasks.forEach(task => {
      tasksData.push({
        id: task.id,
        text: task.text,
        priority: task.priority,
        energyCost: task.energyCost,
        timeRequired: task.timeRequired,
        deadline: task.deadline,
        completed: task.completed,
        inProgress: task.inProgress,
        timeSpent: task.timeSpent,
        consequence_success: task.consequence_success,
        consequence_failure: task.consequence_failure,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
      });
    });

    return {
      tasks: tasksData,
      currentTime: this.currentTime,
    };
  }

  /**
   * Import state from save data
   */
  importState(data: any): void {
    if (!data) return;

    this.tasks.clear();
    this.currentTime = data.currentTime || '09:00';

    if (data.tasks) {
      data.tasks.forEach((taskData: any) => {
        this.tasks.set(taskData.id, taskData as Task);
      });
    }

    this.notifyListeners();
  }
}

// Export singleton instance
export const taskManager = new TaskManager();

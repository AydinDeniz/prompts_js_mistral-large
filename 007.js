class TaskQueue {
  constructor(concurrency = 3) {
    this.queue = [];
    this.activeTasks = 0;
    this.concurrency = concurrency;
  }

  addTask(task) {
    this.queue.push(task);
    this.processQueue();
  }

  async processQueue() {
    while (this.activeTasks < this.concurrency && this.queue.length > 0) {
      const task = this.queue.shift();
      this.activeTasks++;
      try {
        await task();
      } finally {
        this.activeTasks--;
        this.processQueue();
      }
    }
  }
}

// Example usage
const taskQueue = new TaskQueue();

taskQueue.addTask(async () => {
  console.log('Task 1 started');
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log('Task 1 completed');
});

taskQueue.addTask(async () => {
  console.log('Task 2 started');
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('Task 2 completed');
});

taskQueue.addTask(async () => {
  console.log('Task 3 started');
  await new Promise(resolve => setTimeout(resolve, 3000));
  console.log('Task 3 completed');
});

taskQueue.addTask(async () => {
  console.log('Task 4 started');
  await new Promise(resolve => setTimeout(resolve, 1500));
  console.log('Task 4 completed');
});
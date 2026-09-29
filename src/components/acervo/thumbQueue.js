let active = 0;
const queue = [];

function pump() {
  while (active < 2 && queue.length) {
    const job = queue.shift();
    active += 1;
    job.task()
      .then(job.resolve, job.reject)
      .finally(() => {
        active -= 1;
        pump();
      });
  }
}

export function schedule(task) {
  return new Promise((resolve, reject) => {
    queue.push({ task, resolve, reject });
    pump();
  });
}

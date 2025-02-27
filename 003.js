function dijkstra(graph, start, end) {
  const distances = {};
  const previous = {};
  const queue = [];

  for (let node in graph) {
    distances[node] = Infinity;
    previous[node] = null;
    queue.push(node);
  }

  distances[start] = 0;

  while (queue.length > 0) {
    let smallest = queue.reduce((min, node) => (distances[node] < distances[min] ? node : min), queue[0]);
    queue.splice(queue.indexOf(smallest), 1);

    if (smallest === end) {
      let path = [];
      let temp = end;
      while (temp) {
        path.push(temp);
        temp = previous[temp];
      }
      return { distance: distances[end], path: path.reverse() };
    }

    if (distances[smallest] === Infinity) {
      break;
    }

    for (let neighbor in graph[smallest]) {
      let alt = distances[smallest] + graph[smallest][neighbor];
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        previous[neighbor] = smallest;
      }
    }
  }

  return { distance: Infinity, path: [] };
}

// Example usage
const graph = {
  A: { B: 1, C: 4 },
  B: { A: 1, C: 2, D: 5 },
  C: { A: 4, B: 2, D: 1 },
  D: { B: 5, C: 1 }
};

const result = dijkstra(graph, 'A', 'D');
console.log(result);
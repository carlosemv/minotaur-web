class BinaryHeap {
  constructor(scoreMap) {
    this.content = [];
    this.scoreMap = scoreMap;
  }

  includes(element) {
    for (let i = 0; i < this.content.length; i++) {
      if (element.x == this.content[i].x && element.y == this.content[i].y)
        return true;
    }
    return false;
  }

  push(element) {
    this.content.push(element);
    this.sinkDown(this.content.length - 1);
  }

  pop() {
    var result = this.content[0];
    var end = this.content.pop();
    if (this.content.length > 0) {
      this.content[0] = end;
      this.bubbleUp(0);
    }
    return result;
  }

  remove(node) {
    var i = this.content.indexOf(node);
    var end = this.content.pop();

    if (i !== this.content.length - 1) {
      this.content[i] = end;

      if (this.scoreMap.get(end) < this.scoreMap.get(node)) {
        this.sinkDown(i);
      } else {
        this.bubbleUp(i);
      }
    }
  }

  size() {
    return this.content.length;
  }

  rescoreElement(node) {
    this.sinkDown(this.content.indexOf(node));
  }

  sinkDown(n) {
    var element = this.content[n];

    while (n > 0) {

      var parentN = ((n + 1) >> 1) - 1;
      var parent = this.content[parentN];
      if (this.scoreMap.get(element) < this.scoreMap.get(parent)) {
        this.content[parentN] = element;
        this.content[n] = parent;
        n = parentN;
      }
      else {
        break;
      }
    }
  }

  bubbleUp(n) {
    var length = this.content.length;
    var element = this.content[n];
    var elemScore = this.scoreMap.get(element);

    while (true) {
      var child2N = (n + 1) << 1;
      var child1N = child2N - 1;
      var swap = null;
      var child1Score;
      if (child1N < length) {
        var child1 = this.content[child1N];
        child1Score = this.scoreMap.get(child1);

        if (child1Score < elemScore) {
          swap = child1N;
        }
      }

      if (child2N < length) {
        var child2 = this.content[child2N];
        var child2Score = this.scoreMap.get(child2);
        if (child2Score < (swap === null ? elemScore : child1Score)) {
          swap = child2N;
        }
      }

      if (swap !== null) {
        this.content[n] = this.content[swap];
        this.content[swap] = element;
        n = swap;
      }
      else {
        break;
      }
    }
  }
};

class Astar {
  constructor(map) {
    this.map = map;
  }

  search(start, end) {
    var heuristic = manhattan;

    var cameFrom = new DefaultMap(null);
    var gScore = new DefaultMap(Infinity);
    var fScore = new DefaultMap(Infinity);

    var openHeap = new BinaryHeap(fScore);
    var closed = new Set();

    openHeap.push(start);
    gScore.set(start, 1);
    fScore.set(start, heuristic(start, end));

    while (openHeap.size() > 0) {
      var currNode = openHeap.pop();

      if (currNode.x == end.x && currNode.y == end.y) {
        return this.pathTo(cameFrom, currNode);
      }

      closed.add(currNode);
      var neighbors = this.map.neighbors(currNode, end);
      for (var i = 0, il = neighbors.length; i < il; ++i) {
        var neighbor = neighbors[i];

        if (closed.has(neighbor))
          continue;

        var currGScore = gScore.get(currNode) + 1;
        if (currGScore < gScore.get(neighbor)) {
          cameFrom.set(neighbor, currNode);
          gScore.set(neighbor, currGScore);
          fScore.set(neighbor, currGScore + heuristic(neighbor, end));
          if (!openHeap.includes(neighbor))
            openHeap.push(neighbor);
        }
      }
    }

    return [];
  }

  pathTo(cameFrom, node) {
    var path = [node];
    var curr = node;
    while (cameFrom.has(curr)) {
      curr = cameFrom.get(curr);
      path.unshift(curr);
    }
    return path;
  }
};

var manhattan = function manhattan(pos0, pos1) {
  var d1 = Math.abs(pos1.x - pos0.x);
  var d2 = Math.abs(pos1.y - pos0.y);
  return d1 + d2;
}

class DefaultMap extends WeakMap {
  get(key) {
    return super.get(key) || this.default;
  }
  
  constructor(defaultValue) {
    super();
    this.default = defaultValue;
  }
}
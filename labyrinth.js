class Labyrinth {
  constructor(rows) {
    this.size = rows;
    this.cells = 0;
    this.grid = new Array(this.size);

    this.build();
    this.setupNeighbors();
  }

  build() {
    var rowHeight = 1.0 / this.size;
    this.grid[0] = [new Cell(0, 0)];

    for (let row = 1; row < this.size; row++) {
      // inner radius
      var radius = row / this.size;
      var circumf = 2 * Math.PI * radius;

      var prevCount = this.grid[row - 1].length;
      var cellWidth = circumf / prevCount;

      // number of cells the same as prev row except
      // when cellwidth grows such that ratio >= 2
      var ratio = Math.round(cellWidth / rowHeight);
      var cells = prevCount * ratio;
      this.cells += cells;

      this.grid[row] = new Array(cells);
      for (let col = 0; col < cells; col++)
        this.grid[row][col] = new Cell(row, col);
    }
  }

  get(row, col) {
    if (row < 0 || row >= this.size)
      return null;

    return this.grid[row][col % this.grid[row].length];
  }

  setupNeighbors() {
    for (let row = 1; row < this.size; row++) {
      for (let col = 0; col < this.grid[row].length; col++) {
        var c = this.get(row, col);
        c.cw = this.get(row, col+1);
        c.ccw = this.get(row, col-1);

        var ratio = this.grid[row].length / this.grid[row-1].length;
        var parent = this.get(row-1, Math.floor(col/ratio));
        parent.outward.push(c);
        c.inward = parent;
      }
    }
  }

  randomCell() {
    var row = Math.floor(random(this.size));
    var col = Math.floor(random(this.grid[row].length));
    return this.get(row, col);
  }

  getWalls(centerx, centery, cellSz) {
    var arcs = [];
    var lines = []

    for (let row = 1; row < this.size; row++) {
      var theta = 2 * Math.PI / this.grid[row].length;
      var innerRadius = row * cellSz;
      var outerRadius = (row + 1) * cellSz;

      for (let col = 0; col < this.grid[row].length; ++col) {
        var c = this.get(row, col);

        var thetaCcw = col * theta;
        var thetaCw = (col + 1) * theta;

        var cx = centerx + innerRadius * Math.cos(thetaCw);
        var cy = centery + innerRadius * Math.sin(thetaCw);
        var dx = centerx + outerRadius * Math.cos(thetaCw);
        var dy = centery + outerRadius * Math.sin(thetaCw);


        if (!c.linked[c.inward.id]) {
          var arc = {start: thetaCcw, end: thetaCw, r: innerRadius};
          arcs.push(arc);
        }

        if (!c.linked[c.cw.id]) {
          var line = {startx: cx, starty: cy, endx: dx, endy: dy};
          lines.push(line);
        }

      }
    }

    arcs.push({start: 0, end: 2*Math.PI, r: this.size*cellSz});

    return {arcs: arcs, lines: lines};
  }

  draw(centerx, centery, cellSz) {
    noFill();
    strokeWeight(10);
    stroke(255);

    var walls = this.getWalls(centerx, centery, cellSz);
    for (let i = 0; i < walls.arcs.length; i++) {
      var a = walls.arcs[i];
      arc(centerx, centery, 2*a.r,
        2*a.r, a.start, a.end);
    }
    for (let i = 0; i < walls.lines.length; i++) {
      var l = walls.lines[i];
      line(l.startx, l.starty, l.endx, l.endy);
    }
  }
}

class Cell {
  constructor(row, col) {
    this.row = row;
    this.col = col;
    this.id = [this.row, this.col].toString();
    this.linked = {};

    this.cw, this.ccw, this.inward = null;
    this.outward = new Array();
  }

  neighbors() {
    var neighList = new Array();

    if (this.cw)
      neighList.push(this.cw);

    if (this.ccw)
      neighList.push(this.ccw);

    if (this.inward)
      neighList.push(this.inward);

    if (this.outward)
      neighList.concat(this.outward);

    return neighList;
  }
}

class Kruskal {
  constructor(grid) {
    this.grid = grid;
    this.edges = new Array();
    this.ds = new DisjointSet(
      grid.grid.flat());

    for (let row = 1; row < grid.size; row++) {
      for (let col = 0; col < grid.grid[row].length; col++) {
        var cell = grid.get(row, col);

        if (cell.cw)
          this.edges.push([cell, cell.cw]);
        if (cell.inward)
          this.edges.push([cell, cell.inward]);        
      }
    }
  }

  run() {
    this.shuffleEdges();

    while (this.ds.n > 1) {
      let [c1, c2] = this.edges.pop();
      if (this.ds.merge(c1, c2))
        c1.linked[c2.id] = true;
    }
  }

  shuffleEdges() {
    var j, x;
    for (let i = this.edges.length - 1; i > 0; i--) {
      j = Math.floor(random(i + 1));
      x = this.edges[i];
      this.edges[i] = this.edges[j];
      this.edges[j] = x;
    }
  }
}

class DisjointSet {
  constructor(elements) {
    this.n = elements.length;
    this.rank = {};
    this.parent = {};

    for (let i = 0; i < this.n; i++) {
      this.rank[elements[i].id] = 0;
      this.parent[elements[i].id] = elements[i];
    }
  }

  find(i) {
    if (this.parent[i.id].id != i.id)
      this.parent[i.id] = this.find(this.parent[i.id]);

    return this.parent[i.id];
  }

  merge(x, y) {
    var rootX = this.find(x);
    var rootY = this.find(y);

    if (rootX.id === rootY.id)
      return false;

    if (this.rank[rootX.id] < this.rank[rootY.id]) {
      this.parent[rootX.id] = rootY;
    } else if (this.rank[rootX.id] > this.rank[rootY.id]) {
      this.parent[rootY.id] = rootX;
    } else {
      this.parent[rootY.id] = rootX;
      this.rank[rootX.id] += 1;
    }

    this.n -= 1;
    return true;
  }

  isTreeDebug() {
    for (const [key, value] of Object.entries(this.parent)) {
      console.log(key, value.id);
    }
  }
}

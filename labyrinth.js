var labyrinth;
var map;

var pov = {w: 201, h: 201};
var gridSz = 201;
var centerTile = {x: Math.floor(gridSz/2), y: Math.floor(gridSz/2)}
var res = undefined;
var tileSz = undefined;
var mapSz = undefined;

var layers = 10;
var mapRadius = undefined; // px
var layerSz = undefined; // px

function setup() {
  res = {w: 600, h: 600};
  if (res.w / pov.w != res.h / pov.h)
    throw "Invalid resolution proportions";

  randomSeed(1);
  createCanvas(res.w, res.h);

  tileSz = res.w / pov.w;
  mapSz = gridSz * tileSz;
  mapRadius = 0.99*mapSz / 2;
  layerSz = mapRadius / layers;

  labyrinth = new Labyrinth(layers);
  gen = new Kruskal(labyrinth);
  gen.run();
  map = new World(labyrinth);
}

function draw() {
  background(0);
  map.draw(layerSz);
}

class World {
  constructor(labyrinth) {
    this.labyrinth = labyrinth;
    this.floor = new Array(gridSz*gridSz);

    var walls = this.labyrinth.getWalls(
      centerTile.x, centerTile.y, layerSz/tileSz);
    for (let i = 0; i < walls.arcs.length; i++) {
      this.plotArc(centerTile.x, centerTile.y, walls.arcs[i]);
    }
    for (let i = 0; i < walls.lines.length; i++) {
      var line = walls.lines[i];
      this.plotLine(Math.round(line.startx), Math.round(line.starty),
        Math.round(line.endx), Math.round(line.endy));
    }
  }

  draw(cellSz) {
    // this.labyrinth.draw(width/2, height/2, cellSz);
    for (let i = 0; i < gridSz; i++) {
      for (let j = 0; j < gridSz; j++) {
        noStroke();
        if (this.wallType(i, j) == 1) {
          fill(0xef, 0x20, 0x20);
        } else if (this.wallType(i, j) == 2) {
          fill(0x20, 0xef, 0x20);
        }else {
          noFill();
        }
        rect(i*tileSz, j*tileSz,
          tileSz, tileSz);
      }
    }
  }

  plotLine(startx, starty, endx, endy) {
    if (startx > endx) {
      [startx, endx] = [endx, startx];
      [starty, endy] = [endy, starty];
    }
    var rad = Math.atan2(starty - centerTile.y,
      startx - centerTile.x);
    if (rad < 0)
      rad += 2 * Math.PI;
    var oct = Math.ceil(8*rad/(2*Math.PI));
    var quadrant = Math.floor(oct/2) % 4;
    var offset = (quadrant < 1 || quadrant > 2) ? -1 : 1;
    var hdir = quadrant % 2 == 1;

    this.plotSingleLine(startx, starty, endx, endy, 1);
    if (hdir)
      this.plotSingleLine(startx+offset, starty, endx+offset, endy, 2);
    else
      this.plotSingleLine(startx, starty+offset, endx, endy+offset, 2);
  }

  plotSingleLine(startx, starty, endx, endy, color) {
    var dx = endx - startx;
    var dy = endy - starty;

    var xInc = dx;
    var yInc = dy;

    if (xInc != 0)
      xInc = (xInc > 0) ? 1 : -1;
    if (yInc != 0)
      yInc = (yInc > 0) ? 1 : -1;

    dx = Math.abs(dx);
    dy = Math.abs(dy);

    var swapped = false;
    if (dy > dx) {
      [dx, dy] = [dy, dx];
      swapped = true;
    }

    var pk = 2 * dy - dx;
    var i0 = 2 * dy;
    var i1 = i0 - 2 * dx;

    var x = startx;
    var y = starty;
    this.paintPoint(x, y, color);

    for (var p = 1; p <= dx; p++) {
      if (pk < 0) {
        if (swapped)
          y += yInc;
        else
          x += xInc;
        pk += i0;
      } else {
        y += yInc;
        x += xInc;
        pk += i1;
      }
      this.paintPoint(x, y, color);
    }
  }

  plotArc(centerx, centery, arc) {
    var x = 0;
    var y = Math.round(arc.r);

    var d = 1 - Math.round(arc.r);
    var dl = 3;
    var dse = -2*y + 5;

    this.plotArcPoint(centerx, centery, x, y, arc);
    while (y > x) {
      if (d < 0) {
        d += dl;
        dse += 2;
      } else {
        d += dse;
        dse += 4;
        y--;
      }
      dl += 2;
      x++;
      this.plotArcPoint(centerx, centery, x, y, arc);
    }
  }

  plotArcPoint(centerx, centery, x, y, arc) {
    var sign = [-1, 1];
    var bool = [true, false];

    for (let xs = 0; xs <= 1; xs++) {
      for (let ys = 0; ys <= 1; ys++) {
        for (let flip = 0; flip <= 1; flip++) {
          var i = centerx;
          var j = centery;

          if (bool[flip]) {
            i += sign[xs] * y;
            j += sign[ys] * x;
          } else {
            i += sign[xs] * x;
            j += sign[ys] * y;
          }

          var rad = Math.atan2(j - centery, i - centerx);
          if (rad < 0)
            rad += 2 * Math.PI;

          if (rad >= arc.start && rad <= arc.end) {
            this.paintPoint(i, j, 1);

            // draw inward point
            var oct = Math.ceil(8*rad/(2*Math.PI));
            var dir = (oct < 4 || oct > 7) ? -1 : 1;
            if (flip)
              this.paintPoint(i, j+dir, 2);
            else
              this.paintPoint(i+dir, j, 2);
          }
        }
      }
    }
  }

  paintPoint(i, j, c) {
    if (i < 0)
      i = 0;
    if (i >= gridSz)
      i = gridSz - 1;

    if (j < 0)
      j = 0;
    if (j >= gridSz)
      j = gridSz - 1;

    var idx = j * gridSz + i;
    if (idx < 0 || idx >= this.floor.length) {
      throw "Invalid access at index " + idx;
    }

    this.floor[idx] = c;
  }

  wallType(i, j) {
    var idx = j * gridSz + i;
    if (idx < 0 || idx >= this.floor.length) {
      throw "Invalid access at index " + idx;
    }

    return this.floor[idx];
  }
}

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
    strokeWeight(2);
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

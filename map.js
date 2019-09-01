var TileType = {"none":1, "basic":2, "wall":3};
Object.freeze(TileType);

class Tile {
  constructor(type, x, y, distance) {
    this.x = x;
    this.y = y;

    this.type = type;
    this.entity = null;
    this.items = [];
    this.distance = distance;
  }

  hasItem() {
    return !this.items.empty;
  }

  occupied() {
    return (this.entity != null);
  }

  available() {
    return (this.type == TileType.basic && !this.occupied())
  }

  insert(entity) {
    this.entity = entity;
  }

  place(item) {
    this.items.push(item);
  }

  evict() {
    this.entity = null;
  }

  clearItems() {
    this.items = [];
  }

  removeItemAt(index) {
    this.items.splice(index, 1);
  }

  draw(x, y) {
    stroke(180, 0, 0);
    switch (this.type) {
      case TileType.basic:
        stroke(150);
        strokeWeight(1);
        fill(165+this.distance*32);
        break;
      case TileType.wall:
        fill(30+this.distance*100, 0, 0);
        stroke(10);
        strokeWeight(1);
        break;
      default:
        noFill();
        noStroke();
    }

    rect(x, y, tile.size, tile.size, tile.c);
    if (this.hasItem()) {
      for (let i = 0; i < this.items.length; i++)
        this.items[i].draw(x, y);
    }
    if (this.occupied())
      this.entity.draw(x, y);
  }
}

class TileGrid {
  constructor(labyrinth) {
    this.labyrinth = labyrinth;
    this.floor = new Array(gridSz*gridSz);
    this.size = gridSz;
    this.void = new Tile(TileType.none, -1, -1, Infinity);

    this.center = centerTile;
    this.r2 = (mapRadius/tileSz)*(mapRadius/tileSz);
    for (var x = 0; x < this.size; x++) {
      for (var y = 0; y < this.size; y++) {
        if (Math.pow(this.center.x-x, 2)+Math.pow(this.center.y-y, 2) < this.r2)
          this.createTile(x, y, TileType.basic);
        else
          this.createTile(x, y, TileType.none);
      }
    }

    var walls = this.labyrinth.getWalls(
      centerTile.x, centerTile.y, layerSz/tileSz);
    for (let i = 0; i < walls.arcs.length; i++) {
      this.plotArc(centerTile.x, centerTile.y, walls.arcs[i], TileType.wall);
    }
    for (let i = 0; i < walls.lines.length; i++) {
      var line = walls.lines[i];
      this.plotLine(Math.round(line.startx), Math.round(line.starty),
        Math.round(line.endx), Math.round(line.endy), TileType.wall);
    }

    this.astar = new Astar(this);
  }

  draw(cellSz) {
    this.labyrinth.draw(width/2, height/2, cellSz);
  }

  wallType(i, j) {
    var idx = j * gridSz + i;
    if (idx < 0 || idx >= this.floor.length) {
      throw "Invalid access at index " + idx;
    }

    return this.floor[idx];
  }

  isBorder(x, y) {
    return (x == 0 || y == 0 || x == this.size-1 || y == this.size-1);
  }

  isOut(x, y) {
    return (x < 0 || x > this.size || y < 0 || y > this.size);
  }

  key(x, y) {
    if (this.isOut(x, y))
      return undefined;

    return x * this.size + y;
  }

  get(x, y) {
    var t = this.floor[this.key(x, y)];
    if (t)
      return t;
    else
      return this.void;
  }

  neighbors(pos, tgtPos) {
    var ns = [];
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i == j && i == 0)
          continue;

        if (pos.x+i === tgtPos.x && pos.y+j === tgtPos.y)
          ns.push(tgtPos);
        else if (this.get(pos.x+i, pos.y+j).available())
          ns.push({x:pos.x+i, y:pos.y+j});
      }
    }
    return ns;
  }

  createTile(x, y, type) {
    var k = this.key(x, y);
    var dist = Math.sqrt(Math.pow(this.center.x-x, 2)
      + Math.pow(this.center.y-y, 2)) / Math.sqrt(this.r2);
    this.floor[k] = new Tile(type, x, y, dist);
    if (!this.floor[k])
      throw "unable to create tile at " + x + ", " + y;
  }

  setTile(x, y, type) {
    var k = this.key(x, y);
    this.floor[k].type = type;
  }

  insert(entity) {
    this.get(entity.x, entity.y).insert(entity);
  }

  place(item) {
    this.get(item.x, item.y).place(item);
  }

  evict(x, y) {
    this.get(x, y).evict();
  }

  plotLine(startx, starty, endx, endy, type) {
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

    this.plotSingleLine(startx, starty, endx, endy, type);
    if (hdir)
      this.plotSingleLine(startx+offset, starty, endx+offset, endy, type);
    else
      this.plotSingleLine(startx, starty+offset, endx, endy+offset, type);
  }

  plotSingleLine(startx, starty, endx, endy, type) {
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
    this.setTile(x, y, type);

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
      this.setTile(x, y, type);
    }
  }

  plotArc(centerx, centery, arc, type) {
    var x = 0;
    var y = Math.round(arc.r);

    var d = 1 - Math.round(arc.r);
    var dl = 3;
    var dse = -2*y + 5;

    this.plotArcPoint(centerx, centery, x, y, arc, type);
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
      this.plotArcPoint(centerx, centery, x, y, arc, type);
    }
  }

  plotArcPoint(centerx, centery, x, y, arc, type) {
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

          var error = tileSz/mapRadius;
          if (rad+error >= arc.start && rad-error <= arc.end) {
            this.setTile(i, j, type);

            // draw inward point
            var oct = Math.ceil(8*rad/(2*Math.PI));
            var dir = (oct < 4 || oct > 7) ? -1 : 1;
            var vertical = (oct > 1 && oct < 4) || (oct > 5 && oct < 8);
            if (vertical)
              this.setTile(i, j+dir, type);
            else
              this.setTile(i+dir, j, type);
          }
        }
      }
    }
  }

}
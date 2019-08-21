class Tile {
  constructor(type) {
    this.type = type;
    this.entity = null;
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

  evict() {
    this.entity = null;
  }

  draw(x, y) {
    stroke(180, 0, 0);
    switch (this.type) {
      case TileType.basic:
        strokeWeight(0);
        fill(0xdd);
        break;
      case TileType.wall:
        strokeWeight(0);
        fill(0x77)
        break;
      case TileType.border:
        strokeWeight(3);
        fill(0);
        break;
      default:
        strokeWeight(0);
        fill(0);
    }
    rect(x*tile.size, y*tile.size,
      tile.size, tile.size, tile.c);
    if (this.occupied())
      this.entity.draw(x, y);
  }
}

class TileGrid {
  constructor(size) {
    this.size = size;
    this.floor = new Array(size*size);
    this.void = new Tile(TileType.none);

    for (var x = 0; x < this.size; x++) {
      for (var y = 0; y < this.size; y++) {
        if (this.isBorder(x, y))
          this.set(x, y, new Tile(TileType.border));
        else
          this.set(x, y, new Tile(random([TileType.basic,
            TileType.wall])));
      }
    }
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
    if (this.key(x, y) === undefined) {
      return this.void;
    }
    return this.floor[this.key(x, y)];
  }

  set(x, y, value) {
    this.floor[this.key(x, y)] = value;
  }

  insert(x, y, entity) {
    this.get(x, y).insert(entity);
  }

  evict(x, y) {
    this.get(x, y).evict();
  }
}
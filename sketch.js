var map = undefined;

var tile = undefined;
var pov = undefined;

var player = undefined;

function preload() {
  // randomSeed(2);
}

function setup() {
  tile = { w: 50, h: 50, c: 3};
  tile.hw = tile.w/2;
  tile.hh = tile.h/2;

  pov = { w: 11, h: 11 };
  pov.hw = Math.floor(pov.w/2);
  pov.hh = Math.floor(pov.h/2);

  createCanvas(pov.w*tile.w, pov.h*tile.h);

  player = new Player();

  var mapSz = 256;
  map = new Map(mapSz);

  var enemyImg = loadImage("assets/enemy.png");
  for (var i = 0; i < mapSz*10; ++i) {
    var enemy = createSprite(0, 0,
      tile.w, tile.h);
    enemy.addImage(enemyImg);
    do {
      var x = Math.floor(random(mapSz));
      var y = Math.floor(random(mapSz));
    } while(!map.get(x, y).available());
    map.insert(x, y, enemy);
  }
  console.log("done spawning");

}

function draw() {
  background(0);

  player.move();

  stroke(180, 0, 0);

  for (var dx = -pov.hw; dx <= pov.hw; dx++) {
    for (var dy = -pov.hh; dy <= pov.hh; dy++) {
      var entities = false;
      var t;
      if (dx == 0 && dy == 0) {
        strokeWeight(3);
        fill(100, 100, 255);
      } else {
        t = map.get(player.x+dx, player.y+dy);
        if (t.type === TileType.basic) {
          strokeWeight(3);
          if (t.isOccupied()) {
            fill(255, 100, 100);
            entities = true;
          } else {
            fill(0xdd);
          }
        } else if (t.type === TileType.wall) {
          strokeWeight(3);
          fill(0x77)
        } else if (t.type === TileType.border) {
          strokeWeight(3);
          fill(0);
        } else {
          strokeWeight(0);
          fill(0);
        }
      }
      rect((dx+pov.hw)*tile.w, (dy+pov.hh)*tile.h,
        tile.w, tile.h, tile.c);
      if (entities)
        t.drawEntities(dx+pov.hw, dy+pov.hh);
    }
  }

  drawSprite(player.sprite);
}

var TileType = {"none":1, "basic":2, "wall":3, "border":4}
Object.freeze(TileType);

class Tile {
  constructor(type) {
    this.type = type;
    this.entities = new Array();
  }

  drawEntities(x, y) {
    for (var i = 0; i < this.entities.length; i++) {
      this.entities[i].position.x = x*tile.w + tile.hw;
      this.entities[i].position.y = y*tile.h + tile.hh;
      drawSprite(this.entities[i]);
    }
  }

  isOccupied() {
    return (this.entities.length > 0);
  }

  available() {
    return (this.type == TileType.basic && !this.isOccupied())
  }

  insert(entity) {
    this.entities.push(entity);
  }
}


class Player {
  constructor() {
    this.sprite = createSprite(width/2, height/2,
      tile.w, tile.h);
    var playerImg = loadImage("assets/player.png");
    this.sprite.addImage(playerImg);
    this.x = 1;
    this.y = 1;
  }

  move() {
    var ox = this.x;
    var oy = this.y;

    if (keyWentDown(LEFT_ARROW) && player.x > 0)
      this.x -= 1;
    if (keyWentDown(RIGHT_ARROW) && player.x < map.size)
      this.x += 1;
    if (keyWentDown(UP_ARROW) && player.y > 0)
      this.y -= 1;
    if (keyWentDown(DOWN_ARROW) && player.y < map.size)
      this.y += 1;

    if (map.get(this.x, this.y).type != TileType.basic) {
      this.x = ox;
      this.y = oy;
    }
  }
}

class Map {
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

  key(x, y) {
    if (x < 0 || x > this.size || y < 0 || y > this.size) {
      return undefined;
    }

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
}
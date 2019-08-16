var map = undefined;

var tile = undefined;
var pov = undefined;

var player = undefined;

var TileType = {"none":1, "basic":2, "wall":3, "border":4};
Object.freeze(TileType);

var EnemyType = {"simple":1};
Object.freeze(EnemyType);

var enemySprites = {};

function preload() {
  // randomSeed(2);
}

// function keyPressed() {
//   console.log(keyCode);
// }

function setup() {
  tile = { w: 50, h: 50, c: 3};
  tile.hw = tile.w/2;
  tile.hh = tile.h/2;

  pov = { w: 11, h: 11 };
  pov.hw = Math.floor(pov.w/2);
  pov.hh = Math.floor(pov.h/2);

  createCanvas(pov.w*tile.w, pov.h*tile.h);

  var mapSz = 256;
  map = new Map(mapSz);

  player = new Player();
  map.insert(1, 1, player);

  enemies = new Array();
  enemySprites[EnemyType.simple] = loadImage("assets/enemy.png");

  for (var i = 0; i < mapSz*10; ++i) {
    var enemy = new Enemy(EnemyType.simple);
    enemies.push(enemy);
    do {
      var x = Math.floor(random(mapSz));
      var y = Math.floor(random(mapSz));
    } while(!map.get(x, y).available());
    map.insert(x, y, enemy);
  }
}

function draw() {
  background(0);

  player.move();

  for (var dx = -pov.hw; dx <= pov.hw; dx++) {
    for (var dy = -pov.hh; dy <= pov.hh; dy++) {
      var t = map.get(player.x+dx, player.y+dy);
      t.draw(dx+pov.hw, dy+pov.hh);
    }
  }
}

class Tile {
  constructor(type) {
    this.type = type;
    this.entity = null;
  }

  isOccupied() {
    return (this.entity != null);
  }

  available() {
    return (this.type == TileType.basic && !this.isOccupied())
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
        strokeWeight(3);
        fill(0xdd);
        break;
      case TileType.wall:
        strokeWeight(3);
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
    rect(x*tile.w, y*tile.h,
      tile.w, tile.h, tile.c);
    if (this.isOccupied())
      this.entity.draw(x, y);
  }
}

class Enemy {
  constructor(type) {
    this.sprite = enemySprites[type];
  }

  draw(x, y) {
    imageMode(CENTER);
    image(this.sprite, x*tile.w+tile.hw, y*tile.h+tile.hh);
  }
}

class Player {
  constructor() {
    this.sprite = loadImage("assets/player.png");
    this.x = 1;
    this.y = 1;
  }

  move() {
    var ox = this.x;
    var oy = this.y;

    if (keyWentDown(35) || keyWentDown(36) || keyWentDown(37))
      this.x -= 1;
    if (keyWentDown(33) || keyWentDown(34) || keyWentDown(39))
      this.x += 1;
    if (keyWentDown(33) || keyWentDown(36) || keyWentDown(38))
      this.y -= 1;
    if (keyWentDown(34) || keyWentDown(35) || keyWentDown(40))
      this.y += 1;

    if (map.get(this.x, this.y).type != TileType.basic
        || map.isOut(this.x, this.y)) {
      this.x = ox;
      this.y = oy;
    } else {
      map.evict(ox, oy);
      map.insert(this.x, this.y, this);
    }
  }

  draw() {
    imageMode(CENTER);
    image(this.sprite, width/2, height/2);
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
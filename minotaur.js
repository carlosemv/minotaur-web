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
  tile = { w: 10, h: 10, c: 0};
  tile.hw = tile.w/2;
  tile.hh = tile.h/2;

  pov = { w: 51, h: 51 };
  pov.hw = Math.floor(pov.w/2);
  pov.hh = Math.floor(pov.h/2);

  createCanvas(pov.w*tile.w, pov.h*tile.h);

  var mapSz = 256;
  map = new Map(mapSz);

  player = new Player(map);

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

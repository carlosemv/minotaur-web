var pov = {w: 51, h: 51}; // tiles
var gridSz = 201; // tiles
var centerTile = {x: Math.floor(gridSz/2), y: Math.floor(gridSz/2)};
var res = undefined; // pixels
var tileSz = undefined; // pixels
var tile; // aux tile info
var mapSz = undefined; // pixels

var layers = 10;
var mapRadius = undefined; // pixels
var layerSz = undefined; // pixels

var map;

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
  res = {w: 600, h: 600};
  if (res.w / pov.w != res.h / pov.h)
    throw "Invalid resolution proportions";

  tileSz = res.w / pov.w;
  mapSz = gridSz * tileSz;
  mapRadius = 0.99 * mapSz / 2;
  layerSz = mapRadius / layers;

  tile = {size: tileSz, hsize: tileSz/2, c: 1};

  pov.hw = Math.floor(pov.w/2);
  pov.hh = Math.floor(pov.h/2);

  createCanvas(res.w, res.h);

  // labyrinth = new Labyrinth(layers);
  // gen = new Kruskal(labyrinth);
  // gen.run();
  map = new TileGrid(gridSz);

  player = new Player(map);

  enemies = new Array();
  enemySprites[EnemyType.simple] = loadImage("assets/enemy.png");

  for (var i = 0; i < gridSz*10; ++i) {
    var enemy = new Enemy(EnemyType.simple);
    enemies.push(enemy);
    do {
      var x = Math.floor(random(gridSz));
      var y = Math.floor(random(gridSz));
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

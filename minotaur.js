var pov = {w: 11, h: 11}; // tiles
var gridSz = 161; // tiles
var centerTile = {x: Math.floor(gridSz/2), y: Math.floor(gridSz/2)};
var res = undefined; // pixels
var tileSz = undefined; // pixels
var tile; // aux tile info
var mapSz = undefined; // pixels

var layers = 9;
var mapRadius = undefined; // pixels
var layerSz = undefined; // pixels

var map;

var TileType = {"none":1, "basic":2, "wall":3};
Object.freeze(TileType);

var EnemyType = {"simple":1};
Object.freeze(EnemyType);

var enemySprites = {};

function preload() {
  // randomSeed(38);
}

// function keyPressed() {
//   console.log(keyCode);
// }

function setup() {
  res = {w: 640, h: 340};
  // if (res.w / pov.w != res.h / pov.h) {
  //   if (res.w/pov.w < res.h/pov.h)
  //     tileSz = 
  //   tileSz = Math.min(res.w/pov.w, )
  //   // throw "Invalid resolution proportions";
  // }
  if (pov.w % 2 == 0 || pov.h % 2 == 0)
    throw "Camera has no center tile";

  tileSz = Math.min(res.w/pov.w, res.h/pov.h);
  mapSz = gridSz * tileSz;
  mapRadius = 0.99 * mapSz / 2;
  layerSz = mapRadius / layers;

  tile = {size: tileSz, hsize: tileSz/2, c: 1};

  pov.hw = Math.floor(pov.w/2);
  pov.hh = Math.floor(pov.h/2);

  createCanvas(res.w, res.h);

  labyrinth = new Labyrinth(layers);
  gen = new Kruskal(labyrinth);
  gen.run();
  map = new TileGrid(labyrinth);

  player = new Player(map);

  // enemies = new Array();
  // enemySprites[EnemyType.simple] = loadImage("assets/enemy.png");

  // var maxTries = 100;
  // for (var i = 0; i < gridSz*10; ++i) {
  //   var enemy = new Enemy(EnemyType.simple);
  //   enemies.push(enemy);
  //   var tries = 0;
  //   do {
  //     var x = Math.floor(random(gridSz));
  //     var y = Math.floor(random(gridSz));
  //     tries++;
  //   } while(!map.get(x, y).available() && tries < maxTries);
  //   if (tries < maxTries)
  //     map.insert(x, y, enemy);
  // }
}

function draw() {
  background(0);
  // map.draw(layerSz);

  player.move();

  var gridOrigin = {x:width-(tileSz*pov.w), y: 0}

  for (var dx = -pov.hw; dx <= pov.hw; dx++) {
    for (var dy = -pov.hh; dy <= pov.hh; dy++) {
      var t = map.get(player.x+dx, player.y+dy);
      var x = gridOrigin.x + tile.size*(dx+pov.hw);
      var y = gridOrigin.y + tile.size*(dy+pov.hh);
      t.draw(x, y);
    }
  }
}

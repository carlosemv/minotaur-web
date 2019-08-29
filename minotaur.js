var pov = {w: 17, h: 17}; // tiles
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
var enemies;

function preload() {
  randomSeed(49);
}

// function keyPressed() {
//   console.log(keyCode);
// }

function setup() {
  res = {w: 600, h: 600};
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

  nullSprite = loadImage("assets/null.png");
  player = new Player(map);

  enemies = new Set();
  for (let i = 0; i < enemyRanks.length; i++) {
    var e = enemyRanks[i];
    enemySprites[e] = loadImage("assets/enemies/"+e+".png");
  }
  
  enemySprites["minotaur"] = loadImage(
    "assets/enemies/minotaur.png");
  var mino = new Enemy(map, centerTile.x, centerTile.y, "minotaur");
  enemies.add(mino);

  var maxTries = 100;
  var numEnemies = gridSz*gridSz*0.01;
  for (var i = 0; i < numEnemies; ++i) {
    var tries = 0;
    do {
      var x = Math.floor(random(gridSz));
      var y = Math.floor(random(gridSz));
      tries++;
    } while(!map.get(x, y).available() && tries < maxTries);
    if (tries < maxTries) {
      var dist = 1 - map.get(x, y).distance;
      var rank = Math.floor(dist*enemyRanks.length);
      var enemy = new Enemy(map, x, y, enemyRanks[rank]);
      enemies.add(enemy);
    } else {
      console.log("unable to place enemy");
    }
  }
}

function draw() {
  background(0);

  if (player.move()) {
    let playerPos = {x: player.x, y: player.y};
    for (let e of enemies)
      e.move(playerPos);
  }

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

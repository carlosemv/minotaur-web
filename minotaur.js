var pov = {w: 23, h: 17}; // tiles
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
var logs = [];

function preload() {
  randomSeed(49);
}

// function keyPressed() {
//   console.log(keyCode);
// }

function setup() {
  res = {w: 960, h: 540};
  // if (res.w / pov.w != res.h / pov.h) {
  //   if (res.w/pov.w < res.h/pov.h)
  //     tileSz = 
  //   tileSz = Math.min(res.w/pov.w, )
  //   // throw "Invalid resolution proportions";
  // }
  if (pov.w % 2 == 0 || pov.h % 2 == 0)
    throw "Camera has no center tile";

  var mapRes = {w: res.w*0.75, h: res.h*0.95};
  tileSz = Math.min(mapRes.w/pov.w, mapRes.h/pov.h);
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
  player = new Player(map, logs);

  setupEnemies();
  setupItems();
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

  drawHelpBar();
  drawLog();
}

function drawLog() {
  var origin = {x: res.w*0.01, y: res.h*0.02};
  textAlign(LEFT, TOP);
  
  fill(255);
  noStroke();
  textSize(15);
  var logsText = "";

  var numLogs = 6;
  var start = Math.max(logs.length-numLogs, 0);
  for (let i = start; i < logs.length; i++)
    logsText += logs[i] + "\n";
  text(logsText, origin.x, origin.y,
    res.w-(tileSz*pov.w+origin.x), res.h/5);
}

function drawHelpBar() {
  var origin = {x:Math.round(res.w*0.05), y:tileSz*pov.h};
  // rect(origin.x, origin.y, res.w-2*origin.x, res.h-origin.y);
  var center = {x: res.w/2, y: origin.y+(res.h-origin.y)/2};

  var barText = "(Esc) Menu\t\t(i) Inventory\t\t(e) "
    + "Equipment\t\t(z) Rest\t\t(t) Talk\t\t(?) Help";

  fill(255);
  noStroke();
  textSize(18);
  textAlign(CENTER, CENTER);
  text(barText, center.x, center.y);
}

function setupEnemies() {
  enemies = new Set();
  for (let i = 0; i < enemyRanks.length; i++) {
    var e = enemyRanks[i];
    enemySprites[e] = loadImage("assets/enemies/"+e+".png");
  }
  
  enemySprites["minotaur"] = loadImage(
    "assets/enemies/minotaur.png");
  var mino = new Enemy(map, logs, centerTile.x, centerTile.y, "minotaur");
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
      var enemy = new Enemy(map, logs, x, y, enemyRanks[rank]);
      enemies.add(enemy);
    } else {
      console.log("unable to place enemy");
    }
  }
}

function setupItems() {
  for (let i = 0; i < itemTypes.length; i++) {
    var t = itemTypes[i];
    if (t == "weapons") {
      for (let j = 0; j < weaponTypes.length; j++) {
        for (let rank = 1; rank <= 3; rank++) {
          var name = t+"/"+weaponTypes[j]+"/"+rank;
          itemSprites[name] = loadImage("assets/items/"+name+".png");
        }
      }
    } else {
      for (let rank = 1; rank <= 3; rank++) {
        var name = t+"/"+rank;
        itemSprites[name] = loadImage("assets/items/"+name+".png");
      }
    }
  }

  var maxTries = 100;
  var numItems = Math.ceil(gridSz*gridSz*0.005);
  for (var i = 0; i < numItems; i++) {
    var tries = 0;
    do {
      var x = Math.floor(random(gridSz));
      var y = Math.floor(random(gridSz));
      tries++;
    } while(!map.get(x, y).available() && tries < maxTries);
    if (tries < maxTries) {
      var dist = 1 - map.get(x, y).distance;
      var rank = 1;
      if (dist > 0.8)
        rank = 3;
      else if (dist > 0.5)
        rank = 2;
  
      var type = itemTypes[Math.floor(random(itemTypes.length))];
      var subtype = null;
      if (type == "weapons")
        subtype = weaponTypes[Math.floor(random(weaponTypes.length))];
      var item = new Item(map, x, y, type, subtype, rank);      
    } else {
      console.log("unable to place item");
    }
  }
}
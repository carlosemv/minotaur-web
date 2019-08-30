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

var seed;
var map;
var enemies;
var logs = [];

function preload() {
  seed = Math.floor(random(100000000));
  randomSeed(seed);
  logs.push("Games start, seed: "+seed);
}

// function keyPressed() {
//   console.log(keyCode);
// }

function setup() {
  res = {w: 960, h: 540};
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

  statsOrigin = {x: res.w*0.01, y: 0};
  statsWidth = res.w-(tileSz*pov.w+2*statsOrigin.x);

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

function itemInfo() {
  fill(0);
  noStroke();
  rect(res.w/3, res.h/3, 100, 100);
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

  // gui
  drawHelpBar();
  drawLog();
  drawStats();
  drawInventory();

  var firstNum = 49;
  for (let i = 0; i < 9; i++) {
    if (keyWentDown(firstNum+i) && i < player.pack.equipped.length) {
      var item = player.pack.equipped[i];
      if (keyIsDown(16)) {
        item = player.pack.equipped.splice(i,1)[0];
        player.unequip(item);
        player.pack.items.push(item);
      } else {
        // itemInfo();
        // console.log("info "+(i+1));
      }
    }
  }

  var firstLetter = 65;
  for (let i = 0; i < 26; i++) {
    if (keyWentDown(firstLetter+i) && i < player.pack.items.length) {
      var id = String.fromCharCode("a".charCodeAt(0)+i);
      var item = player.pack.items[i];
      if (keyIsDown(16)) {
        item = player.pack.items.splice(i,1)[0];
        player.equip(item);
        player.pack.equipped.push(item);
      } else {
        // itemInfo();
        // console.log("info "+id);
      }
    }
  }
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
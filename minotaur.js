var pov = {w: 23, h: 17}; // tiles shown to player
var gridSz = 161; // length of (square) map in tiles
var centerTile = {x: Math.floor(gridSz/2), y: Math.floor(gridSz/2)};
var res; // game screen resolution in pixels
var tileSz; // (square) tile length in pixels
var tile; // aux tile info
var mapSz; // length of (square) map in pixels

var layers = 9; // layers in labyrinth
var mapRadius; // approximate labyrinth radius in pixels
var layerSz; // approximate distance between labyrinth layers in pixels

var turns = 0; // turns played in current game
var logs = []; // game log
var maxSeed = Math.pow(10, 8); // maximum seed value
var seed = null; // seed used to generate game
var map; // game map
var enemies; // set of enemies

var GameState = {"menu":1, "intro": 2,
  "game":3, "victory":4, "defeat":5};
Object.freeze(GameState);
var state = GameState.menu;

function preload() {
  athenianSprite = loadImage("assets/athenian.png");
  nullSprite = loadImage("assets/null.png");
  menuSprite = loadImage("assets/minotaur-head.png");
}

function keyPressed() {
  console.log(keyCode);
}

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
}

function draw() {
  background(0);

  if (state == GameState.menu) {
    mainMenuControl();
    drawMainMenu();
  } else if (state == GameState.game) {
    gameControl();
    drawGame();
  } else if (state == GameState.intro) {
    if (keyWentDown(13)) {
      intro.remove();
      state = GameState.game;
    }
  } else if (state == GameState.victory
      || state == GameState.defeat) {
    endMenuControl();
    if (state == GameState.victory)
      drawEndMenu(true);
    else
      drawEndMenu(false);
  } else {
    throw "Invalid game state "+state;
  }
}

function newGame() {
  turns = 0;
  logs = [];

  if (seed) {
    randomSeed(seed);
  } else {
    // seed = Math.floor(random(maxSeed));
    seed = 58566483;
    randomSeed(seed);
  }
  logs.push("Games start, seed: "+seed);

  labyrinth = new Labyrinth(layers);
  gen = new Kruskal(labyrinth);
  gen.run();
  map = new TileGrid(labyrinth);

  player = new Player(map, logs);

  setupEnemies();
  setupAthenians();
  setupItems();

  optSelect = 0;
  state = GameState.intro;
  showIntro();
}

function drawGame() {
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

  if (menuItem)
    drawItemMenu();

  if (gameMenu)
    drawGameMenu();
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

function setupAthenians() {
  athenianSprite = loadImage("assets/athenian.png");

  var maxTries = 100;
  for (var i = 0; i < 13; ++i) {
    var tries = 0;
    do {
      var x = Math.floor(random(gridSz));
      var y = Math.floor(random(gridSz));
      tries++;
    } while(!map.get(x, y).available() && tries < maxTries);
    if (tries < maxTries) {
      var a = new Athenian(map, logs, x, y);
    } else {
      throw "Unable to place athenian";
    }
  }
}

function gameControl() {
  if ((equipIdx != null || invIdx != null) 
      && (menuItem == null)) {
    if (keyWentDown(13)) {
      // enter
      if (equipIdx != null)
        menuItem = player.pack.equipped[equipIdx];
      else
        menuItem = player.pack.items[invIdx];
      optSelect = 0;
    } else if (keyWentDown(38)) {
      // up
      if (equipIdx > 0) {
        equipIdx--;
      } else if (invIdx > 0) {
        invIdx--;
      } else if (invIdx == 0 && player.pack.equipped.length > 0) {
        invIdx = null;
        equipIdx = player.pack.equipped.length - 1;
      }
    } else if (keyWentDown(40)) {
      // down
      if (invIdx != null && invIdx < player.pack.items.length-1) {
        invIdx++;
      } else if (equipIdx != null && equipIdx < player.pack.equipped.length-1) {
        equipIdx++;
      } else if (equipIdx == player.pack.equipped.length-1
          && player.pack.items.length > 0) {
        equipIdx = null;
        invIdx = 0;
      }
    }
  } else if (keyIsDown(16)) {
    // shift + (letter or number)

    // equipment menu
    var firstNum = 49;
    for (let i = 0; i < 9; i++) {
      if (keyWentDown(firstNum+i) && i < player.pack.equipped.length) {
        var item = player.pack.equipped[i];
        menuItem = item;
        optSelect = 0;
      }
    }

    // inventory menu
    var firstLetter = 65;
    for (let i = 0; i < 26; i++) {
      if (keyWentDown(firstLetter+i) && i < player.pack.items.length) {
        var id = String.fromCharCode("a".charCodeAt(0)+i);
        var item = player.pack.items[i];
        menuItem = item;
        optSelect = 0;
      }
    }
  } else if (menuItem == null && keyWentDown(69)) {
    // e
    if (player.pack.equipped.length > 0) {
      equipIdx = 0;
      invIdx = null;
    } else if (player.pack.items.length > 0) {
      invIdx = 0;
      equipIdx = null;
    }
  } else if (menuItem == null && keyWentDown(73)) {
    // i
    if (player.pack.items.length > 0) {
      invIdx = 0;
      equipIdx = null;
    } else if (player.pack.equipped.length > 0) {
      equipIdx = 0;
      invIdx = null;
    }
  } else if (keyWentDown(27)) {
    // esc
    if (menuItem) {
      menuItem = null;
      optSelect = 0;
    } else if (equipIdx != null || invIdx != null) {
      equipIdx = null;
      invIdx = null;
    } else if (gameMenu){
      gameMenu = false;
      optSelect = 0;
    } else {
      gameMenu = true;
    }
  } else if (menuItem) {
    if (keyWentDown(39)) {
      // right arrow
      optSelect = 1;
    } else if (keyWentDown(37)) {
      // left arrow
      optSelect = 0;
    } else if (keyWentDown(69) 
        || (keyWentDown(13) && optSelect == 0)) {
      // e
      if (menuItem.equipped)
        player.unequip(menuItem);
      else
        player.equip(menuItem);
      menuItem = null; optSelect = 0;
      invIdx = null; equipIdx = null;
    }
    else if (keyWentDown(68) 
        || (keyWentDown(13) && optSelect == 1)) {
      // d
      player.drop(menuItem);
      menuItem = null; optSelect = 0;
      invIdx = null; equipIdx = null;
    }
  } else if (gameMenu) {
    if (keyWentDown(39)) {
      // right arrow
      optSelect = 1;
    } else if (keyWentDown(37)) {
      // left arrow
      optSelect = 0;
    } else if (keyWentDown(81) 
        || (keyWentDown(13) && optSelect == 0)) {
      // q
      state = GameState.menu;
      gameMenu = false;
    } else if (keyWentDown(72)
        || (keyWentDown(13) && optSelect == 1)) {
      // h
      gameMenu = false;
    }
  } else if (player.move()) {
    turns++;
    let playerPos = {x: player.x, y: player.y};
    for (let e of enemies)
      e.move(playerPos);
  }
}

function endMenuControl() {
  if (keyWentDown(39)) {
    // right arrow
    optSelect = 1;
  } else if (keyWentDown(37)) {
    // left arrow
    optSelect = 0;
  } else if (keyWentDown(84) 
      || (keyWentDown(13) && optSelect == 0)) {
    // t
    seed = null;
    newGame();
  } else if (keyWentDown(77)
      || (keyWentDown(13) && optSelect == 1)) {
    // m
    optSelect = 0;
    state = GameState.menu;
  }
}

function mainMenuControl() {
  if (keyWentDown(38)) {
    // up
    if (optSelect > 0)
      optSelect--;
  } else if (keyWentDown(40)) {
    // down
    if (optSelect < 3)
      optSelect++;
  } else if (loadSeed && keyWentDown(13)) {
    // enter
    loadSeed = false;
    seed = Math.floor(Number(seedInput.value()));
    if (!seed) seed = null;
    newGame();
    seedInput.remove();
  } else if (keyWentDown(78)
      || (keyWentDown(13) && optSelect == 0)) {
    // n
    seed = null;
    newGame();
  } else if (keyWentDown(76)
      || (keyWentDown(13) && optSelect == 1)) {
      // l
    getSeed();
  } else if (keyWentDown(83)
      || (keyWentDown(13) && optSelect == 2)) {
    // s
  } else if (keyWentDown(72)
      || (keyWentDown(13) && optSelect == 3)) {
    // h
  }
}

function getSeed() {
  loadSeed = true;
  textSize(stdTextSz);
  seedInput = createInput();
  var inputWidth = textWidth(String(maxSeed)+" ");
  seedInput.position((windowWidth-inputWidth)/2,
    windowHeight/2+lineHeight*7.5);
  seedInput.size(inputWidth, lineHeight);
  seedInput.attribute("placeholder", "seed");
  seedInput.elt.focus();
}
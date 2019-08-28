class Attributes {
  constructor(hpmax, attack, damage, defense) {
    this.hpMax = hpmax;
    this.attack = attack;
    this.damage = damage;
    this.defense = defense;
  }
}

var enemyRanks = ["caveLizard", "giantBat", "gargantuanSpider",
  "tartareanBeetle", "golem", "elemental", "cacoDaemon",
  "lamia", "basilisk", "manticore", "keres"];

var enemies = {
  "caveLizard": new Attributes(10, 1, 2, 1),
  "giantBat": new Attributes(5, 2, 1, 2),
  "gargantuanSpider": new Attributes(20, 3, 5, 2),
  "tartareanBeetle": new Attributes(30, 2, 5, 2),
  "golem": new Attributes(40, 3, 6, 3),
  "elemental": new Attributes(40, 4, 10, 2),
  "cacoDaemon": new Attributes(30, 4, 10, 4),
  "lamia": new Attributes(40, 6, 20, 4),
  "basilisk": new Attributes(60, 6, 18, 5),
  "manticore": new Attributes(70, 6, 20, 4),
  "keres": new Attributes(60, 8, 20, 5),
  "minotaur": new Attributes(110, 10, 25, 8)
}

var enemySprites = {};

class Enemy {
  constructor(type) {
    this.sprite = enemySprites[type];
  }

  draw(x, y) {
    // console.log("drawing enemy at ", x, " ", y);
    imageMode(CENTER);
    image(this.sprite, x+tile.hsize,
      y+tile.hsize, tile.size, tile.size);
  }
}

class Player {
  constructor(map) {
    this.sprite = loadImage("assets/player.png");
    this.map = map;

    var tries = 0, maxTries = 1000;
    var r = Math.sqrt(map.r2) - layerSz/(2*tileSz);
    do {
      var theta = random(2*Math.PI);
      this.x = Math.round(r*Math.sin(theta))+map.center.x;
      this.y = Math.round(r*Math.cos(theta))+map.center.y;
      tries++;
    } while(!map.get(this.x, this.y).available() && tries < maxTries);
    
    if (tries >= maxTries)
      throw "Unable to place player";
    this.map.insert(this.x, this.y, this);

    this.level = 1;
    this.xp = 0;
    this.attrs = new Attributes(50, 1, 5, 1);
    this.hp = this.attrs.hpMax;
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

    if (this.map.get(this.x, this.y).type != TileType.basic
        || this.map.isOut(this.x, this.y)) {
      this.x = ox;
      this.y = oy;

      return;
    }

    // if (map.get(this.x, this.y).)


    this.map.evict(ox, oy);
    this.map.insert(this.x, this.y, this);
  }

  draw(x, y) {
    imageMode(CENTER);
    // var x = pov.hw*tile.size+tile.hsize;
    // var y = pov.hh*tile.size+tile.hsize;
    image(this.sprite, x+tile.hsize, y+tile.hsize,
      tile.size, tile.size);
  }
}
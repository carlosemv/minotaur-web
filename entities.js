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

var enemyAttrs = {
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
};

var enemySprites = {};

class Enemy {
  constructor(map, x, y, type) {
    this.x = x;
    this.y = y;
    this.map = map;
    map.insert(this);

    this.sprite = enemySprites[type];
    this.attrs = enemyAttrs[type];
    this.hp = this.attrs.hpMax;
    this.aggro = false;
  }

  move(distance) {
    if (distance < 5)
      return;

    var ox = this.x;
    var oy = this.y;

    switch (this.type) {
      case "giantBat":
        [this.x, this.y] = this.randomMove();
        break;
      // case "golem":
      // case "manticore":
      //   aggroMove();
      //   break;
      default:
        // rangeMove();
        [this.x, this.y] = this.randomMove();
    }

    if (this.x == ox && this.y == oy)
      return;

    if (this.map.get(this.x, this.y).type != TileType.basic
       || this.map.isOut(this.x, this.y)) {
      this.x = ox;
      this.y = oy;

      return;
    }

    if (map.get(this.x, this.y).occupied()) {
      var tgt = map.get(this.x, this.y).entity;
      this.attack(tgt);

      this.x = ox;
      this.y = oy;
      return;
    }

    this.map.evict(ox, oy);
    this.map.insert(this);
  }

  attack(target) {
    var attRoll = Math.ceil(random(3));
    var defRoll = Math.ceil(random(3));
    if (this.attrs.attack + attRoll >= target.attrs.defense + defRoll) {
      var dmgRange = Math.ceil(0.1*this.attrs.damage);
      var dmgRoll = Math.floor(random(2*dmgRange+1)) - dmgRange;
      target.hit(this.attrs.damage+dmgRoll);
    }
  }

  randomMove() {
    var ox = this.x;
    var oy = this.y;

    var dx = Math.floor(random(3))-1; // [-1, 0, 1]
    var dy = Math.floor(random(3))-1;
    return [this.x+dx, this.y+dy];
  }

  draw(x, y) {
    if (this.hp <= this.attrs.hpMax/2) {
      fill(200, 0, 0, 150);
      noStroke();
      rect(x, y, tile.size, tile.size, tile.c);
    }
    imageMode(CENTER);
    image(this.sprite, x+tile.hsize,
      y+tile.hsize, tile.size, tile.size);
  }

  hit(dmg) {
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.map.evict(this.x, this.y);
      enemies.delete(this);
    }
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
    this.map.insert(this);

    this.level = 1;
    this.xp = 0;
    this.attrs = new Attributes(50, 2, 5, 2);
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

    if (this.x == ox && this.y == oy)
      return false;

    if (this.map.get(this.x, this.y).type != TileType.basic
        || this.map.isOut(this.x, this.y)) {
      this.x = ox;
      this.y = oy;

      return false;
    }

    if (map.get(this.x, this.y).occupied()) {
      var tgt = map.get(this.x, this.y).entity;
      this.attack(tgt);

      this.x = ox;
      this.y = oy;
      return true;
    }

    this.map.evict(ox, oy);
    this.map.insert(this);
    return true;
  }

  draw(x, y) {
    if (this.hp <= this.attrs.hpMax/2) {
      fill(200, 0, 0, 150);
      noStroke();
      rect(x, y, tile.size, tile.size, tile.c);
    }
    imageMode(CENTER);
    image(this.sprite, x+tile.hsize, y+tile.hsize,
      tile.size, tile.size);
  }

  hit(dmg) {
    this.hp -= dmg;
  }

  attack(target) {
    var attRoll = Math.ceil(random(3));
    var defRoll = Math.ceil(random(3));
    if (this.attrs.attack + attRoll >= target.attrs.defense + defRoll) {
      console.log("hit");
      var dmgRange = Math.ceil(0.1*this.attrs.damage);
      var dmgRoll = Math.floor(random(2*dmgRange+1)) - dmgRange;
      target.hit(this.attrs.damage+dmgRoll);
    } else {
      console.log("miss");
    }
  }
}
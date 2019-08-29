class Attributes {
  constructor(hpmax, attack, damage, defense) {
    this.hpMax = hpmax;
    this.att = attack;
    this.damage = damage;
    this.def = defense;
  }
}

class Entity {
  constructor(attrs, x, y, map) {
    this.hpMax = attrs.hpMax;
    this.att = attrs.att;
    this.damage = attrs.damage;
    this.def = attrs.def;
    this.hp = this.hpMax;

    this.x = x;
    this.y = y;
    this.map = map;
    map.insert(this);
  }

  draw(x, y) {
    if (this.hp <= this.hpMax/2) {
      fill(200, 0, 0, 150);
      noStroke();
      rect(x, y, tile.size, tile.size, tile.c);
    }
    imageMode(CENTER);
    image(this.sprite, x+tile.hsize,
      y+tile.hsize, tile.size, tile.size);
  }

  attack(target) {
    var attRoll = Math.ceil(random(3));
    var defRoll = Math.ceil(random(3));
    if (this.att + attRoll >= target.def + defRoll) {
      console.log(this.name+" hit "+target.name);
      var dmgRange = Math.ceil(0.1*this.damage);
      var dmgRoll = Math.floor(random(2*dmgRange+1)) - dmgRange;
      target.hit(this.damage+dmgRoll);
    } else {
      console.log(this.name+" missed "+target.name);
    }
  }

  death() {
    throw "Not implemented";
  }

  hit(dmg) {
    this.hp -= dmg;
    if (this.hp <= 0)
      this.death();
  }

  distance(x, y) {
    let dist = Math.pow(this.x-x, 2)+Math.pow(this.y-y, 2);
    return Math.sqrt(dist);
  }
}

class Enemy extends Entity {
  constructor(map, x, y, type) {
    super(enemyAttrs[type], x, y, map);
    this.name = enemyNames[type];
    this.sprite = enemySprites[type];
    this.aggro = false;
  }

  move(playerPos) {
    var ox = this.x;
    var oy = this.y;

    switch (this.type) {
      case "giantBat":
        [this.x, this.y] = this.randomMove(playerPos);
        break;
      // case "golem":
      // case "manticore":
      //   aggroMove();
      //   break;
      default:
        // rangeMove();
        [this.x, this.y] = this.randomMove(playerPos);
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

  randomMove(playerPos) {
    if (this.distance(playerPos.x, playerPos.y) > 10)
      return [this.x, this.y];

    var dx = Math.floor(random(3))-1; // [-1, 0, 1]
    var dy = Math.floor(random(3))-1;
    return [this.x+dx, this.y+dy];
  }

  death() {
    this.map.evict(this.x, this.y);
    enemies.delete(this);
    console.log(this.name+" perished");
  }
}

class Player extends Entity {
  constructor(map) {
    var tries = 0, maxTries = 1000;
    var r = Math.sqrt(map.r2) - layerSz/(2*tileSz);
    var x, y;
    do {
      var theta = random(2*Math.PI);
      x = Math.round(r*Math.sin(theta))+map.center.x;
      y = Math.round(r*Math.cos(theta))+map.center.y;
      tries++;
    } while(!map.get(x, y).available() && tries < maxTries);
    
    if (tries >= maxTries)
      throw "Unable to place player";

    var attrs = new Attributes(50, 2, 5, 2);
    super(attrs, x, y, map);

    this.sprite = loadImage("assets/player.png");
    this.name = "Theseus";
    this.level = 1;
    this.xp = 0;
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

  death() {
    console.log("player death");
  }
}

var enemyRanks = ["caveLizard", "giantBat", "gargantuanSpider",
  "tartareanBeetle", "golem", "elemental", "cacodaemon",
  "lamia", "basilisk", "manticore", "keres"];

var enemyAttrs = {
  "caveLizard": new Attributes(10, 1, 2, 1),
  "giantBat": new Attributes(5, 2, 1, 2),
  "gargantuanSpider": new Attributes(20, 3, 5, 2),
  "tartareanBeetle": new Attributes(30, 2, 5, 2),
  "golem": new Attributes(40, 3, 6, 3),
  "elemental": new Attributes(40, 4, 10, 2),
  "cacodaemon": new Attributes(30, 4, 10, 4),
  "lamia": new Attributes(40, 6, 20, 4),
  "basilisk": new Attributes(60, 6, 18, 5),
  "manticore": new Attributes(70, 6, 20, 4),
  "keres": new Attributes(60, 8, 20, 5),
  "minotaur": new Attributes(110, 10, 25, 8)
};

var enemyNames = {
  "caveLizard": "Cave Lizard",
  "giantBat": "Giant Bat",
  "gargantuanSpider": "Gargantuan Spider",
  "tartareanBeetle": "Tartarean Beetle",
  "golem": "Golem",
  "elemental": "Elemental",
  "cacodaemon": "Cacodaemon",
  "lamia": "Lamia",
  "basilisk": "Basilisk",
  "manticore": "Manticore",
  "keres": "Keres",
  "minotaur": "Minotaur",
};

var enemySprites = {};
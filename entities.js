class Attributes {
  constructor(hpmax, attack, damage, defense) {
    this.hpMax = hpmax;
    this.att = attack;
    this.damage = damage;
    this.def = defense;
  }
}

class Entity {
  constructor(attrs, x, y, map, logs) {
    this.hpMax = attrs.hpMax;
    this.att = attrs.att;
    this.damage = attrs.damage;
    this.def = attrs.def;
    this.hp = this.hpMax;
    this.rested = 0;

    this.level = 1;
    this.xp = 0;

    this.x = x;
    this.y = y;
    this.map = map;
    map.insert(this);

    this.logs = logs;

    this.name = null;
    this.sprite = nullSprite;
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
    if (this.name === target.name)
      return;

    var attRoll = Math.ceil(random(3));
    var defRoll = Math.ceil(random(3));
    if (this.att + attRoll >= target.def + defRoll) {
      this.logs.push(this.name+" hit "+target.name);
      var dmgRange = Math.ceil(0.1*this.damage);
      var dmgRoll = Math.floor(random(2*dmgRange+1)) - dmgRange;
      var killed = target.hit(this.damage+dmgRoll);
      if (killed)
        this.gainXp(target.xpValue());
    } else {
      this.logs.push(this.name+" missed "+target.name);
    }
  }

  death() {
    throw "Not implemented";
  }

  pos() {
    return {x: this.x, y: this.y};
  }

  rest() {
    if (this.hp == this.hpMax)
      return;

    this.rested += 1;
    if (this.rested > 3) {
      this.rested = 0;
      this.hp++;
    }
  }

  gainXp(xp) {
    this.xp += xp;
    if (this.xp > this.nextLevel()) {
      this.xp = 0;
      this.level++;
      this.att++;
      this.damage++;
      this.def++;
    }
  }

  nextLevel() {
    return 3+this.level*2;
  }

  xpValue() {
    return Math.ceil((this.att+this.damage+this.def)/2);
  }

  hit(dmg) {
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.death();
      return true;
    }

    return false;
  }

  distance(x, y) {
    let dist = Math.pow(this.x-x, 2)+Math.pow(this.y-y, 2);
    return Math.sqrt(dist);
  }
}

class Enemy extends Entity {
  constructor(map, logs, x, y, type) {
    super(enemyAttrs[type], x, y, map, logs);
    this.type = type;
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
      case "caveLizard":
      case "gargantuanSpider":
      case "tartareanBeetle":
      case "golem":
        [this.x, this.y] = this.dumbMove(playerPos);
        break;
      case "lamia":
      case "basilisk":
      case "manticore":
        [this.x, this.y] = this.selfPreservingMove(playerPos);
        break;
      default:
        [this.x, this.y] = this.relentlessMove(playerPos);
    }

    if (this.x == ox && this.y == oy) {
      this.rest();
      return;
    }

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

    this.rest();
    this.map.evict(ox, oy);
    this.map.insert(this);
  }

  dumbMove(playerPos) {
    var d = this.distance(playerPos.x, playerPos.y);
    if (d > 6)
      return [this.x, this.y];

    var dx = Math.round((playerPos.x-this.x)/d);
    var dy = Math.round((playerPos.y-this.y)/d);
    return [this.x+dx, this.y+dy];
  }

  relentlessMove(playerPos) {
    var d = this.distance(playerPos.x, playerPos.y);
    if (d > 6)
      return [this.x, this.y];

    return this.smartMove(playerPos);
  }

  smartMove(playerPos) {
    var path = this.map.astar.search(this.pos(), playerPos);
    if (path && path.length > 1)
      return [path[1].x, path[1].y];
    return [this.x, this.y];
  }

  selfPreservingMove(playerPos) {
    var d = this.distance(playerPos.x, playerPos.y);
    if (d > 6)
      return [this.x, this.y];

    if (this.hp <= this.hpMax/2)
      return this.retreatMove(playerPos);
    else
      return this.smartMove(playerPos);
  }

  retreatMove(playerPos) {
    var d = this.distance(playerPos.x, playerPos.y);
    var dx = Math.round((this.x-playerPos.x)/d);
    var dy = Math.round((this.y-playerPos.y)/d);
    return [this.x+dx, this.y+dy];
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
    this.logs.push(this.name+" perished");
  }
}

class Inventory {
  constructor() {
    this.equipped = [];
    this.items = [];
  }

  pickUp(item) {
    this.items.push(item);
  }
}

class Player extends Entity {
  constructor(map, logs) {
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
    super(attrs, x, y, map, logs);

    this.sprite = loadImage("assets/player.png");
    this.name = "Theseus";
    this.rested = 0;

    this.pack = new Inventory();
  }

  equip(item) {
    var idx = player.pack.items.indexOf(item);
    if (idx == -1)
      throw "Item "+item+" not in player inventory";

    for (let i = 0; i < this.pack.equipped.length; i++) {
      var equipment = this.pack.equipped[i];
      if (equipment.type === item.type)
        this.unequip(equipment);
    }

    this.pack.items.splice(idx, 1);
    this.pack.equipped.push(item);

    item.equipped = true;
    this.att += item.att;
    this.def += item.def;
    this.damage += item.damage;
    return true;
  }

  unequip(item) {
    var idx = player.pack.equipped.indexOf(item);
    if (idx == -1)
      throw "Item "+item+" not in player equipment";

    this.pack.equipped.splice(idx, 1);
    this.pack.items.push(item);

    item.equipped = false;
    this.att -= item.att;
    this.def -= item.def;
    this.damage -= item.damage;
    return true;
  }

  pickUp(item) {
    this.pack.pickUp(item);
  }

  drop(item) {
    if (item.equipped)
      this.unequip(item);

    var idx = player.pack.items.indexOf(item);
    if (idx == -1)
      throw "Item "+item+" not in player inventory";
    this.pack.items.splice(idx, 1);
    item.place(this.x, this.y);
  }

  move() {
    var ox = this.x;
    var oy = this.y;


    if(keyWentDown(12)) {
      this.rest();
      return true;
    }

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

    var tgt = this.map.get(this.x, this.y);
    if (tgt.type != TileType.basic
        || this.map.isOut(this.x, this.y)) {
      this.x = ox;
      this.y = oy;

      return false;
    }

    if (tgt.occupied()) {
      var tgt = map.get(this.x, this.y).entity;
      this.attack(tgt);

      this.x = ox;
      this.y = oy;
      return true;
    }

    if (tgt.hasItem()) {
      for (let i = 0; i < tgt.items.length; i++) {
        this.logs.push("Picked up "+tgt.items[i].name);
        this.pickUp(tgt.items[i]);
      }
      tgt.clearItems();
    }

    this.rest();
    this.map.evict(ox, oy);
    this.map.insert(this);
    return true;
  }

  death() {
    this.logs.push("player death");
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
var nullSprite;
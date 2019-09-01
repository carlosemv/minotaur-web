class Attributes {
  constructor(hpmax, attack, dmg, defense) {
    this.hpMax = hpmax;
    this.att = attack;
    this.dmg = dmg;
    this.def = defense;
  }
}

class Entity {
  constructor(attrs, x, y, map, logs) {
    this.hpMax = attrs.hpMax;
    this.att = attrs.att;
    this.dmg = attrs.dmg;
    this.def = attrs.def;
    this.hp = this.hpMax;
    this.immune = false;
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
    if (this.name == "Minotaur") {
      push();
      fill(255, 255, 255, 100);
      noStroke();
      rect(x, y, tile.size, tile.size, 10);
      pop();
    }

    if (this.hp <= this.hpMax/2) {
      fill(200, 0, 0, 150);
      noStroke();
      rect(x, y, tile.size, tile.size);
    }

    imageMode(CENTER);
    image(this.sprite, x+tile.hsize,
      y+tile.hsize, tile.size, tile.size);
  }

  attack(target) {
    if (this.name === target.name || target.immune)
      return;

    var attVar = Math.ceil(random(this.att*0.25));
    var defVar = Math.ceil(random(this.def*0.25));
    var attRoll = Math.ceil(random(attVar));
    var defRoll = Math.ceil(random(defVar));

    var killed = false;
    if (this.att + attRoll >= target.def + defRoll) {
      var dmgRange = Math.ceil(0.1*this.dmg);
      var dmgRoll = Math.floor(random(2*dmgRange+1)) - dmgRange;
      this.logs.push(this.name+" hit "+target.name);
      var killed = target.hit(this.dmg+dmgRoll);
      if (killed) {
        target.death();
        this.gainXp(target.xpValue());
        return true;
      }
    } else {
      this.logs.push(this.name+" missed "+target.name);
    }

    return false;
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
    var xpNeeded = this.nextLevel();
    if (this.xp >= xpNeeded) {
      this.xp -= xpNeeded;
      this.level++;

      this.hpMax += 2;
      this.hp += 2;
      this.att++;
      this.dmg += 2;
      this.def++;
      return true;
    }
    return false;
  }

  nextLevel() {
    return this.levelXp(this.level);
  }

  levelXp(level) {
    return 5+level*15;
  }

  xpValue() {
    return Math.ceil((this.att+this.def+this.dmg)/2);
  }

  hit(dmg) {
    this.hp -= dmg;
    if (this.hp <= 0)
      return true;

    return false;
  }

  distance(x, y) {
    let dist = Math.pow(this.x-x, 2)+Math.pow(this.y-y, 2);
    return Math.sqrt(dist);
  }
}


class Athenian extends Entity {
  constructor(map, logs, x, y) {
    var attrs = new Attributes(10, 1, 5, -10);
    super(attrs, x, y, map, logs);
    this.sprite = athenianSprite;
    this.name = "Athenian";
    this.immune = true;
  }

  death() {
    this.map.evict(this.x, this.y);
    this.logs.push(this.name+" rescued!");
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

    if (this.map.get(this.x, this.y).occupied()) {
      var tgt = this.map.get(this.x, this.y).entity;
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

    var attrs = new Attributes(20, 1, 3, 1);
    super(attrs, x, y, map, logs);

    this.sprite = loadImage("assets/player.png");
    this.name = "Theseus";

    this.resting = false;
    this.maxLevel = 10;
    this.points = 0;
    this.rescued = 0;
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
    this.hpMax += item.hpMax;
    this.hp += item.hpMax;
    this.att += item.att;
    this.def += item.def;
    this.dmg += item.dmg;
    return true;
  }

  unequip(item) {
    var idx = player.pack.equipped.indexOf(item);
    if (idx == -1)
      throw "Item "+item+" not in player equipment";

    this.pack.equipped.splice(idx, 1);
    this.pack.items.push(item);

    item.equipped = false;
    this.hp -= item.hpMax;
    this.hpMax -= item.hpMax;
    this.att -= item.att;
    this.def -= item.def;
    this.dmg -= item.dmg;
    return true;
  }

  pickUp(item) {
    return this.pack.pickUp(item);
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
    if (keyWentDown(12)) {
      this.resting = false;
      this.rest();
      return true;
    }

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

    if (this.x == ox && this.y == oy) {
      // did not move
      if (this.resting) {
        // if on extended rest
        if (this.hp < this.hpMax) {
          // rest, if necessary
          this.rest();
          return true;
        } else {
          // or stop resting
          this.resting = false;
        }
      } else {
        // not a turn if did not move or rest
        return false;
      }
    } else if (this.resting) {
      // if moved while on extended rest, stop resting
      this.resting = false;
    }

    // wall collision
    var tgt = this.map.get(this.x, this.y);
    if (tgt.type != TileType.basic
        || this.map.isOut(this.x, this.y)) {
      this.x = ox;
      this.y = oy;

      return false;
    }

    // entity collision
    if (tgt.occupied()) {
      var tgt = this.map.get(this.x, this.y).entity;
      this.attack(tgt);

      this.x = ox;
      this.y = oy;
      return true;
    }

    // moving over item(s)
    if (tgt.hasItem()) {
      for (let i = 0; i < tgt.items.length; i++) {
        if (this.pickUp(tgt.items[i])) {
          this.logs.push("Picked up "+tgt.items[i].name);
          tgt.removeItemAt(i);
        } else {
          this.logs.push("Carrying too much weight");
        }
      }
    }

    this.rest();
    this.map.evict(ox, oy);
    this.map.insert(this);
    return true;
  }

  gainXp(xp) {
    if (this.level < this.maxLevel) {
      var leveled = super.gainXp(xp);
      if (leveled)
        this.points += this.level*100;
      if (this.level == this.maxLevel)
        this.xp = 0;
      return leveled;
    }

    return false;
  }

  attack(target) {
    if (target.name == "Athenian") {
      target.death();
      this.points += 1000;
      this.rescued++;
    } else {
      var killed = super.attack(target);
      if (killed && target.type == "minotaur") {
        this.points += 10000;
        state = GameState.victory;
      }
    }
  }

  hit(dmg) {
    if (this.resting) {
      this.logs.push("Resting interrupted");
      this.resting = false;
    }
    return super.hit(dmg);
  }


  death() {
    state = GameState.defeat;
  }
}

class Inventory {
  constructor() {
    this.equipped = [];
    this.items = [];
    this.capacity = 13;
  }

  occupation() {
    return this.items.length + this.equipped.length;
  }

  pickUp(item) {
    if (this.occupation() >= this.capacity)
      return false;
    this.items.push(item);
    return true;
  }
}

var enemyRanks = ["caveLizard", "giantBat", "gargantuanSpider",
  "tartareanBeetle", "golem", "elemental", "cacodaemon",
  "lamia", "basilisk", "manticore", "keres"];

var enemyAttrs = {
  "caveLizard": new Attributes(8, 1, 3, 1),
  "giantBat": new Attributes(5, 3, 3, 1),
  "gargantuanSpider": new Attributes(15, 3, 4, 2),
  "tartareanBeetle": new Attributes(30, 4, 8, 3),
  "golem": new Attributes(40, 5, 10, 4),
  "elemental": new Attributes(40, 6, 12, 4),
  "cacodaemon": new Attributes(30, 6, 15, 5),
  "lamia": new Attributes(40, 9, 20, 6),
  "basilisk": new Attributes(60, 12, 18, 7),
  "manticore": new Attributes(70, 12, 20, 6),
  "keres": new Attributes(60, 16, 20, 8),
  "minotaur": new Attributes(120, 20, 25, 10)
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
var athenianSprite;
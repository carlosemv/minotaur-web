class Enemy {
  constructor(type) {
    this.sprite = enemySprites[type];
  }

  draw(x, y) {
    imageMode(CENTER);
    image(this.sprite, x*tile.w+tile.hw,
      y*tile.h+tile.hh, tile.w, tile.h);
  }
}

class Player {
  constructor(map) {
    this.sprite = loadImage("assets/player.png");
    this.map = map;
    this.x = 1;
    this.y = 1;
    this.map.insert(this.x, this.y, this);
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

  draw() {
    imageMode(CENTER);
    image(this.sprite, width/2, height/2,
      tile.w, tile.h);
  }
}
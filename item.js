var itemTypes = ["armors", "helms", "necklaces", "shoes", "weapons"];
var weaponTypes = ["axes", "spears", "swords"];
var itemSprites = {};

class Item {
	constructor(map, x, y, type, subtype, rank) {
		this.id = type;
		if (subtype)
			this.id += "/"+subtype;
		this.id += "/"+rank;
		this.sprite = itemSprites[this.id];

		this.x = x;
		this.y = y;
		this.map = map;
		map.place(this);

		this.name = null;
	}

  draw(x, y) {
    imageMode(CENTER);
    image(this.sprite, x+tile.hsize,
      y+tile.hsize, tile.size, tile.size);
  }
}
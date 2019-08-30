var itemTypes = ["armors", "helms", "necklaces", "shoes", "weapons"];
var weaponTypes = ["axes", "spears", "swords"];
var itemSprites = {};

var rankNames = {1: "Worn", 2: "Ordinary", 3: "Glorious"};
var typeNames = {"armors": "Armor", "helms": "Helm",
  "necklaces": "Necklace", "shoes": "Shoes"};
var subtypeNames = {"axes": "Axe", "spears": "Spear", "swords": "Sword"};

var creatures = ["Centaur", "Cyclops", "Dryad", "Griffin", "Sphinx",
  "Unicorn", "Phoenix", "Satyr", "Siren"];
var heroes = ["Orpheus", "Prometheus", "Perseus", "Odysseus", "Jason",
  "Heracles", "Achilles", "Ajax", "Hector", "Leonidas"];
var gods = ["Zeus", "Hera", "Poseidon", "Demeter", "Athena",
  "Apollo", "Artemis", "Ares", "Aphrodite", "Hephaestus",
  "Hermes", "Hestia", "Dionysus"];

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

    this.name = rankNames[rank]+" ";
    if (subtype)
      this.name += subtypeNames[subtype];
    else
      this.name += typeNames[type];
    this.name += " of ";

    if (rank === 1)
      this.name += "the "+creatures[Math.floor(random(creatures.length))];
    else if (rank === 2)
      this.name += heroes[Math.floor(random(heroes.length))];
    else if (rank === 3)
      this.name += gods[Math.floor(random(gods.length))];
    else
      this.name += "Void";

    this.att = 0;
    this.def = 0;
    this.damage = 0;

    if (type == "weapons" || type == "necklaces" || type == "shoes")
      this.att = rank*Math.ceil(random(3));
    if (type == "weapons" || type == "necklaces" || type == "helms")
      this.damage = rank*Math.ceil(random(4));
    if (type == "helms" || type == "armors")
      this.def = rank*Math.ceil(random(3));

    this.equipped = false;
  }

  draw(x, y) {
    imageMode(CENTER);
    image(this.sprite, x+tile.hsize,
      y+tile.hsize, tile.size, tile.size);
  }
}
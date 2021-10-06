var statsOrigin, statsWidth; // position/size of stats/inventory column
var lineHeight = 15; // standard heigh of GUI line
var stdTextSz = 15; // standard GUI text size
var menuItem = null; // item which has its menu open, if any
var gameMenu = false; // if game menu is up
var help = false; // if help menu is up
var equipIdx = null, invIdx = null; // for inventory selection
var optSelect = 0; // for menu option selection
var menuSprite; // minotaur head menu sprite
var seedInput; // seed input html element
var loadSeed = false; // if seed is being input
var intro; // intro text html element

function drawLog() {
  var logHeight = res.h*0.3;

  statsOrigin.y = res.h*0.02;

  textAlign(LEFT, TOP);
  fill(255);
  noStroke();
  textSize(stdTextSz);

  var logsText = "";
  var lineCharLimit = 30;
  var lineLimit = 8;
  var lines = 0;
  for (let i = logs.length-1; i >= 0; i--) {
    // print(logs[i]);
    // print(Math.floor(logs[i]./lineCharLimit));
    lines += Math.ceil(logs[i].length/lineCharLimit);
    // print(lines)
    if (lines <= lineLimit) {
      logsText += "• " + logs[i] + "\n";
    }
  }
  text(logsText, statsOrigin.x, statsOrigin.y,
    statsWidth, logHeight);

  stroke(200, 0, 0);
  strokeWeight(2);
  noFill();
  rect(statsOrigin.x/2, statsOrigin.y/2,
    statsWidth+statsOrigin.x/2, logHeight+statsOrigin.y);

  statsOrigin.y += logHeight+lineHeight;
}

function drawStats() {
  // draw health bar
  strokeWeight(1);
  stroke(255);
  noFill();
  rect(statsOrigin.x, statsOrigin.y,
    statsWidth, lineHeight);

  noStroke();
  var health = player.hp/player.hpMax;
  if (health <= 0.2)
    fill(90, 0, 0);
  else
    fill(0, 90, 0);
  rect(statsOrigin.x, statsOrigin.y,
    statsWidth*health, lineHeight);

  fill(255);
  textAlign(CENTER, CENTER);
  text("Health: "+player.hp+" / "+player.hpMax,
    statsOrigin.x+statsWidth/2, statsOrigin.y+lineHeight/2);

  // draw xp bar
  statsOrigin.y += 1.5*lineHeight;
  stroke(255);
  noFill();
  rect(statsOrigin.x, statsOrigin.y,
    statsWidth, lineHeight);

  noStroke();
  var progress = player.xp/player.nextLevel();
  fill(0, 0, 90);
  rect(statsOrigin.x, statsOrigin.y,
    statsWidth*progress, lineHeight);

  fill(255);
  textAlign(CENTER, CENTER);
  text("Xp: "+player.xp+" / "+player.nextLevel(),
    statsOrigin.x+statsWidth/2, statsOrigin.y+lineHeight/2);

  // draw combat stats
  statsOrigin.y += 1.5*lineHeight;
  textAlign(LEFT, CENTER);
  text("Level: "+player.level, statsOrigin.x,
    statsOrigin.y+lineHeight/2);
  textAlign(RIGHT, CENTER);
  text("Points: "+player.points, statsWidth,
    statsOrigin.y+lineHeight/2);

  statsOrigin.y += lineHeight;
  textAlign(LEFT, CENTER);
  text("Attack: "+player.att, statsOrigin.x,
    statsOrigin.y+lineHeight/2);
  statsOrigin.y += lineHeight;
  text("Damage: "+player.dmg, statsOrigin.x,
    statsOrigin.y+lineHeight/2);
  statsOrigin.y += lineHeight;
  text("Defense: "+player.def, statsOrigin.x,
    statsOrigin.y+lineHeight/2);
  statsOrigin.y += lineHeight/2;
}

function drawInventory() {
  textAlign(LEFT, CENTER);
  statsOrigin.y += lineHeight;
  stroke(255);

  strokeWeight(2);
  line(statsOrigin.x, statsOrigin.y,
    statsOrigin.x+statsWidth, statsOrigin.y);

  strokeWeight(0);
  statsOrigin.y += lineHeight;
  text("Equipment:", statsOrigin.x, statsOrigin.y);

  stroke(100, 100, 0);
  for (let i = 0; i < player.pack.equipped.length; i++) {
    if (i == equipIdx) {
      drawSelection(statsOrigin.x, statsOrigin.y+lineHeight/2,
        statsWidth, lineHeight);
    }
    var item = player.pack.equipped[i];
    statsOrigin.y += lineHeight;
    var id = i+1;
    text(id+": "+item.name, statsOrigin.x, statsOrigin.y);
  }

  statsOrigin.y += lineHeight;
  stroke(255);
  strokeWeight(2);
  line(statsOrigin.x, statsOrigin.y,
    statsOrigin.x+statsWidth, statsOrigin.y);

  strokeWeight(0);
  statsOrigin.y += lineHeight;
  text("Inventory:", statsOrigin.x, statsOrigin.y);

  for (let i = 0; i < player.pack.items.length; i++) {
    if (i == invIdx) {
      drawSelection(statsOrigin.x, statsOrigin.y+lineHeight/2,
        statsWidth, lineHeight);
    }
    var item = player.pack.items[i];
    statsOrigin.y += lineHeight;
    var id = String.fromCharCode("a".charCodeAt(0)+i);
    text(id+": "+item.name, statsOrigin.x, statsOrigin.y);
  }
}

function drawHelpBar() {
  var origin = {x:Math.round(res.w*0.05), y:tileSz*pov.h};
  var center = {x: res.w/2, y: origin.y+(res.h-origin.y)/2};

  var barText = "(Esc) Menu\t\t(i) Inventory\t\t(e) "
    + "Equipment\t\t(z) Rest\t\t(h) Help";

  fill(255);
  noStroke();
  textSize(stdTextSz+3);
  textAlign(CENTER, CENTER);
  text(barText, center.x, center.y);
}

function drawItemMenu() {
  var menuWidth = res.w/3;
  fill(0);
  stroke(255);
  strokeWeight(1);
  rect(menuWidth, res.h/3, menuWidth, 9*lineHeight);

  var menuLine = res.h/3 + lineHeight;
  fill(255);
  noStroke();
  textAlign(CENTER, TOP);

  text(menuItem.name, res.w/2, menuLine);
  menuLine += lineHeight;

  var prevItem = {att: 0, dmg: 0, def: 0, hpMax: 0};
  if (!menuItem.equipped) {
    for (let i = 0; i < player.pack.equipped.length; i++) {
      var equipment = player.pack.equipped[i];
      if (equipment.type === menuItem.type) {
        prevItem = equipment;
        break;
      }
    }
  }

  let attText = "Attack: "+menuItem.att;
  if (!menuItem.equipped) {
    attText += " (";
    attText += prevItem.att <= menuItem.att ? "+" : "-";
    attText += Math.abs(menuItem.att-prevItem.att)+")";
  }
  text(attText, res.w/2, menuLine);
  menuLine += lineHeight;

  let dmgText = "Damage: "+menuItem.dmg;
  if (!menuItem.equipped) {
    dmgText += " (";
    dmgText += prevItem.dmg <= menuItem.dmg ? "+" : "-";
    dmgText += Math.abs(menuItem.dmg-prevItem.dmg)+")";
  }
  text(dmgText, res.w/2, menuLine);
  menuLine += lineHeight;

  let defText = "Defense: "+menuItem.def;
  if (!menuItem.equipped) {
    defText += " (";
    defText += prevItem.def <= menuItem.def ? "+" : "-";
    defText += Math.abs(menuItem.def-prevItem.def)+")";
  }
  text(defText, res.w/2, menuLine);
  menuLine += lineHeight;

  let hpText = "HP Bonus: "+menuItem.hpMax;
  if (!menuItem.equipped) {
    hpText += " (";
    hpText += prevItem.hpMax <= menuItem.hpMax ? "+" : "-";
    hpText += Math.abs(menuItem.hpMax-prevItem.hpMax)+")";
  }
  text(hpText, res.w/2, menuLine);
  menuLine += 2*lineHeight;

  var spacing = menuWidth/6;

  var opt1 = menuItem.equipped ? "(e) Unequip" : "(e) Equip";
  var opt2 = "(d) Drop";

  if (optSelect == 0) {
    var selWidth = textWidth(opt1)*1.2;
    drawSelection(res.w/2-spacing-selWidth/2, menuLine,
      selWidth, lineHeight);
  } else if (optSelect == 1) {
    var selWidth = textWidth(opt2)*1.2;
    drawSelection(res.w/2+spacing-selWidth/2, menuLine,
      selWidth, lineHeight);
  }

  text(opt1, res.w/2-spacing, menuLine);
  text(opt2, res.w/2+spacing, menuLine);
}

function drawSelection(x, y, w, h) {
  push();
  fill(255, 30, 30, 150);
  rect(x, y, w, h);
  pop();
}

function drawMainMenu() {
  var ypos = res.h/6;

  var spriteScale = 0.5;
  var spriteWidth = menuSprite.width * spriteScale;
  var spriteHeight = menuSprite.height * spriteScale;
  imageMode(CORNER);
  image(menuSprite, (res.w-spriteWidth)/2, ypos,
    spriteWidth, spriteHeight);

  textAlign(CENTER, TOP);
  textSize(stdTextSz*3);
  var title = "MINOTAUR";
  var titleWidth = textWidth(title);
  ypos += spriteHeight + textAscent()/2;

  fill(255);
  strokeWeight(3);
  stroke(200, 0, 0);
  text(title, width/2, ypos);

  ypos = height/2+lineHeight*4;
  textSize(stdTextSz);
  noStroke();
  var opts = ["(n) New Game", "(l) Load Seed", "(s) Highscores", "(h) Help"];
  for (let i = 0; i < opts.length; i++) {
    if (optSelect == i) {
      var selWidth = textWidth(opts[i])*1.2;
      drawSelection(width/2-selWidth/2, ypos,
        selWidth, lineHeight);
    }
    text(opts[i], width/2, ypos);
    if (i == 1 && loadSeed)
      ypos += lineHeight*4;
    else
      ypos += lineHeight*2;
  }
}

function drawGameMenu() {
  var menuWidth = res.w/4;
  fill(0);
  stroke(255);
  strokeWeight(1);
  rect((res.w-menuWidth)/2, res.h/3,
    menuWidth, 8*lineHeight);

  var menuLine = res.h/3 + lineHeight;
  fill(255);
  noStroke();
  textAlign(CENTER, TOP);

  var endStats = [
    "Level "+player.level,
    player.rescued+" athenians rescued",
    turns+" turns",
    "Playing seed "+seed
  ];

  for (let i = 0; i < endStats.length; ++i) {
    text(endStats[i], res.w/2, menuLine);
    menuLine += lineHeight;
  }

  menuLine += lineHeight;
  var spacing = menuWidth/5;
  var opt1 = "(q) Quit";
  var opt2 = "(h) Help";

  if (optSelect == 0) {
    var selWidth = textWidth(opt1)*1.1;
    drawSelection(res.w/2-spacing-selWidth/2, menuLine,
      selWidth, lineHeight);
  } else if (optSelect == 1) {
    var selWidth = textWidth(opt2)*1.1;
    drawSelection(res.w/2+spacing-selWidth/2, menuLine,
      selWidth, lineHeight);
  }
  text(opt1, res.w/2-spacing, menuLine);
  text(opt2, res.w/2+spacing, menuLine);
}


function drawEndMenu(victory) {
  var menuWidth = res.w/4;
  fill(0);
  stroke(255);
  strokeWeight(1);
  rect((res.w-menuWidth)/2, res.h/3,
    menuWidth, 11*lineHeight);

  var menuLine = res.h/3 + lineHeight;
  fill(255);
  noStroke();
  textAlign(CENTER, TOP);

  push();
  if (victory)
    stroke(255, 215, 0);
  else
    stroke(200, 0, 0);
  strokeWeight(3);
  textSize(3*stdTextSz);
  text(victory ? "Victory!" : "Defeat",
    res.w/2, menuLine);
  menuLine += 3*lineHeight;
  pop();

  var endStats = [
    "Level "+player.level,
    player.rescued+" athenians rescued",
    turns+" turns",
    player.points+" points total!"
  ];

  textSize(stdTextSz);
  for (let i = 0; i < endStats.length; ++i) {
    text(endStats[i], res.w/2, menuLine);
    menuLine += lineHeight;
  }

  menuLine += lineHeight;
  var spacing = menuWidth/5;
  var opt1 = "(t) Try again";
  var opt2 = "(m) Menu";

  if (optSelect == 0) {
    var selWidth = textWidth(opt1)*1.1;
    drawSelection(res.w/2-spacing-selWidth/2, menuLine,
      selWidth, lineHeight);
  } else if (optSelect == 1) {
    var selWidth = textWidth(opt2)*1.1;
    drawSelection(res.w/2+spacing-selWidth/2, menuLine,
      selWidth, lineHeight);
  }
  text(opt1, res.w/2-spacing, menuLine);
  text(opt2, res.w/2+spacing, menuLine);
}

function drawHelp() {
  var menuWidth = res.w/2;
  var menuHeight = 16*lineHeight;

  fill(0);
  stroke(255);
  strokeWeight(1);

  var ypos = (res.h-menuHeight)/2;
  rect((res.w-menuWidth)/2, ypos, menuWidth, menuHeight);

  var menuLine = ypos + lineHeight;
  fill(255);
  noStroke();
  textAlign(CENTER, TOP);

  var helpText = "Navigate the labyrinth, find the Minotaur in its center,"
    + " and slay it! Move using a keypad (vertically, horizontally,"
    + " AND diagonally), moving towars enemies to attack them."
    + " \n\nNavigate menus with arrows and Enter key,"
    + " or with shortcuts indicated between parenthesis (such as (h) for help)."
    + " You can access item menus in this way (i or e then arrows and Enter)"
    + " or you can simply press Shift + the item's ID (1-9 for equipped items"
    + " or a-z for inventory).\n\nTip: Rescue the 13 other athenians"
    + " in the labyrinth for bonus points!";

  var margins = menuWidth*0.05;
  text(helpText, (res.w-menuWidth)/2+margins/2, menuLine,
    menuWidth-margins, menuHeight)
}

function showIntro() {
  var introText = `
    <center><font color="white" size="5">The city of
    <b>Athens</b> had a debt with the kingdom of <b>Crete</b>,
    a debt that had to be paid with blood. Every year the king
    of Athens, Egeus, had to send <b>fourteen youths</b> to Crete.
    There, they would have to face the <b>labyrinth</b> which
    housed an <b>unspeakable monstrosity</b>. <b>Theseus</b>,
    the king's son, a courageous prince, volunteered to
    <b>take the place</b> of one of those youths. Now he must
    <b>face the labyrinth, kill the beast therein, and restore
    peace back to his city!</b><br><br>&lt;Enter&gt;</font></center>
  `;
  intro = createDiv(introText);
  intro.size(width/2, height/2);
  var ypos = (windowHeight - height)/2 + height/4;
  intro.position(windowWidth/2-width/4,
    ypos);
}
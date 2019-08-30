var statsOrigin, statsWidth;
var lineHeight = 15;
function drawLog() {
  var logHeight = res.h/5;

  statsOrigin.y = res.h*0.02;

  textAlign(LEFT, TOP);
  fill(255);
  noStroke();
  textSize(14);

  var logsText = "";
  var numLogs = 6;
  var start = Math.max(logs.length-numLogs, 0);
  for (let i = start; i < logs.length; i++)
    logsText += logs[i] + "\n";
  text(logsText, statsOrigin.x, statsOrigin.y,
    statsWidth, logHeight);

  stroke(200, 0, 0);
  strokeWeight(2);
  noFill();
  rect(statsOrigin.x/2, statsOrigin.y/2,
    statsWidth+statsOrigin.x/2, logHeight+statsOrigin.y/2);
}

function drawStats() {
  statsOrigin.y = res.h/5+res.h*0.03;

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

  statsOrigin.y += lineHeight;
  textAlign(LEFT, CENTER);
  text("Attack: "+player.att, statsOrigin.x,
    statsOrigin.y+lineHeight/2);

  statsOrigin.y += lineHeight;
  textAlign(LEFT, CENTER);
  text("Damage: "+player.damage, statsOrigin.x,
    statsOrigin.y+lineHeight/2);

  statsOrigin.y += lineHeight;
  textAlign(LEFT, CENTER);
  text("Defense: "+player.def, statsOrigin.x,
    statsOrigin.y+lineHeight/2);
}

function drawInventory() {
  statsOrigin.y += lineHeight;
  stroke(255);

  strokeWeight(2);
  line(statsOrigin.x, statsOrigin.y,
    statsOrigin.x+statsWidth, statsOrigin.y);
  strokeWeight(0);

  stroke(100, 100, 0);
  for (let i = 0; i < player.pack.equipped.length; i++) {
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

  for (let i = 0; i < player.pack.items.length; i++) {
    var item = player.pack.items[i];
    statsOrigin.y += lineHeight;
    var id = String.fromCharCode("a".charCodeAt(0)+i);
    text(id+": "+item.name, statsOrigin.x, statsOrigin.y);
  }
}

function drawHelpBar() {
  var origin = {x:Math.round(res.w*0.05), y:tileSz*pov.h};
  // rect(origin.x, origin.y, res.w-2*origin.x, res.h-origin.y);
  var center = {x: res.w/2, y: origin.y+(res.h-origin.y)/2};

  var barText = "(Esc) Menu\t\t(i) Inventory\t\t(e) "
    + "Equipment\t\t(z) Rest\t\t(t) Talk\t\t(?) Help";

  fill(255);
  noStroke();
  textSize(18);
  textAlign(CENTER, CENTER);
  text(barText, center.x, center.y);
}
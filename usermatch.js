const fs = require("fs");
const { run } = require("node:test");
const readline = require("readline");

var groups = [];
var users = [];

async function main() {
  var start_time = Date.now();
  console.log("Loading group data on ./group-data.txt");

  try {
    console.log("Loading group data on ./group-data.txt");
    await loadGroupData();
    console.log("Loading user data on ./user-votes.txt");
    await loadUserData();
    console.log("Finished Loading User Data");

    var doLazyMatching = false;
    if (doLazyMatching) {
      lazyMatch();
      console.log("Lazy Matching Ergebnisse: ");
      console.log(lazyMatch);
    }

    console.log("Executing Bruteforce");

    recursiveBruteforceMatching(0, users, groups, 0);

    //    scrambleGroupCast();

    //    optimizedMatching();
    var collective_price = 0;

    groups = bestGrp;

    var content = "";

    for (var i = 0; i < groups.length; i++) {
      console.log("#############################");
      console.log("        " + groups[i].name);
      console.log("#############################");

      content += "-------------------------------------- \n";
      content += "          " + groups[i].name + "\n";
      for (var j = 0; j < groups[i].cast.length; j++) {
        var p = getPrice(groups[i].cast[j], i);
        collective_price += p;
        console.log(users[groups[i].cast[j]].name + "[" + groups[i].cast[j] + "] || " + p);
        content += users[groups[i].cast[j]].name + "\n";
      }
    }

    console.log("------------------------------------");
    console.log("             STATISIKEN             ");
    console.log("------------------------------------");
    console.log("Anzahl rekursiver Aufrufe : " + n);

    console.log("Ausführungszeit: " + (Date.now() - start_time) + "ms");
    console.log("Anzahl Verschiebungen: " + collective_price);

    fs.writeFile("./result.txt", content, (err) => {
      if (err) {
        console.error(err);
      } else {
        // file written successfully
      }
    });
  } catch (e) {
    console.log(e);
  }
}

function getPrice(user_id, group_id) {
  var usr = users[user_id];

  return usr.votes.indexOf(group_id);
}

async function loadGroupData() {
  const rl = readline.createInterface({
    input: fs.createReadStream("./group-data.txt", { encoding: "utf8" }),
    console: false,
    crlfDelay: Infinity,
  });

  var jobs = 0;
  var lineCount = 0;
  var id_counter = 0;

  //event called to read a line
  rl.on("line", async function (line) {
    jobs++;
    lineCount++;

    // wenn erste zeile dann skippe, da csv header
    if (lineCount === 1) {
      return;
    }

    var data = line.split(",");
    var g_id = id_counter;
    var g_name = data[0];
    var g_max = data[1] * 1;

    //bau das gruppenobjekt.
    var obj = {
      id: g_id,
      name: g_name,
      max: g_max,
      cast: [],
    };

    //füge es in das gruppen array ein.
    groups.push(obj);

    id_counter++;
    //beende den job
    jobs--;
  });

  //if finished reading the file
  rl.on("close", async function () {
    jobs = 0;
  });
  await sleep(100);
  while (jobs > 0) {
    console.log(jobs);
    await sleep(100);
  }

  return;
}

async function loadUserData() {
  const rl = readline.createInterface({
    input: fs.createReadStream("./user-votes.txt", { encoding: "utf8" }),
    console: false,
    crlfDelay: Infinity,
  });

  var jobs = 0;
  var lineCount = 0;
  var id_counter = 0;

  //event called to read a line
  rl.on("line", async function (line) {
    jobs++;
    lineCount++;

    // wenn erste zeile dann skippe, da csv header
    if (lineCount === 1) {
      return;
    }

    var data = line.split(",");
    var u_id = id_counter;
    var u_name = data[0];
    //get rid of the u_id, u-name
    var u_votes = data.slice(1);
    for (var i = 0; i < u_votes.length; i++) {
      //convert the text to a number
      u_votes[i] = u_votes[i] * 1;
    }

    var obj = {
      id: u_id,
      name: u_name,
      votes: u_votes,
    };

    users.push(obj);

    id_counter++;
    jobs--;
  });

  //if finished reading the file
  rl.on("close", async function () {
    jobs = 0;
  });
  await sleep(100);
  while (jobs > 0) {
    console.log(jobs);
    await sleep(100);
  }

  return;
}
/**
 *  We start off by "lazy matching",
 *  everyone will be put into their favourite group ,
 *  if that group is full, then the person will be put in the next best, and so on
 */
function lazyMatch() {
  var alreadyOptimal = true;
  for (var i = 0; i < users.length; i++) {
    var r = 0;
    while (true) {
      var target_group_id = getGroupOfRank(users[i].votes, r);

      if (checkGroupHasSpace(target_group_id)) {
        groups[target_group_id].cast.push(i);
        break;
      } else {
        r++;
        alreadyOptimal = false;
      }
    }
  }

  if (alreadyOptimal) {
    console.log("Everybody has their primary chocie");
  }
}

function getGroupOfRank(votes, rank) {
  for (var x = 0; x < votes.length; x++) {
    if (votes[x] === rank) {
      return x;
    }
  }

  return -1;
}

function checkGroupHasSpace(id) {
  var gMax = groups[id].max;
  var gCastL = groups[id].cast.length;

  return gCastL < gMax;
}

function scrambleGroupCast() {
  for (var x = 0; x < groups.length; x++) {
    var cast = groups[x].cast;
    for (var i = 0; i < cast.length; i++) {
      var r = Math.floor(Math.random() * cast.length);
      var val = cast[i];
      cast.splice(i, 1);
      cast.splice(r, 0, val);
    }

    groups[x].cast = cast;
  }
}
/**
 *  Optimierung der Ergebnisse,
 *  Wir suchen so lange nach verbesserungen, bis es keine mehr gibt
 *  Eine Verbesserung, ist wenn durch einen Tausch
 *
 */
function optimizedMatching() {
  //generiere eine liste mit allen gruppen und deren wünschen
  // O(n) = n^2
  var group_votes = Array(groups.length);
  for (var i = 0; i < group_votes.length; i++) {
    group_votes[i] = { id: i, votes: [], max: groups[i].max };
  }

  //get every voters preference
  for (var i = 0; i < users.length; i++) {
    for (var j = 0; j < users[i].votes.length; j++) {
      group_votes[users[i].votes[j]].votes.push([i, j]);
    }
  }

  //die gruppen werden nun nach (nMax-nInteresse) aufsteigend sortiert
  var run = true;
  var change = true;

  var n = 50;
}

var minInconveinience = -1;
var bestGrp;
var n = 0;

function recursiveBruteforceMatching(u_id, users, groups, cost) {
  if (u_id + 1 < users.length) {
    if (cost > minInconveinience && minInconveinience > -1) {
      return;
    }
    var gs = JSON.parse(JSON.stringify(groups));
    for (var x = 0; x < users[u_id].votes.length; x++) {
      var chocie = users[u_id].votes[x];
      var grp = JSON.parse(JSON.stringify(gs));
      if (grp[chocie].cast.length < grp[chocie].max) {
        grp[chocie].cast.push(u_id);
        n++;
        recursiveBruteforceMatching(u_id + 1, users, grp, cost + x * x);
      }
    }
  } else {
    if (minInconveinience === -1 || minInconveinience > cost) {
      bestGrp = groups;
      minInconveinience = cost;
    }
  }
  // call down u_id + 1, inconvenience
}

// jetzt

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

main();

/*****************************************************************************************
 * Gamma:
 * The winnenr.
 * Contributed by: Matt Lewis & Brian Lai
 ****************************************************************************************/
var msg = [];
var ID;
var homeBase = [-1, -1];
var troop = [];
var totalUnits = 0;

onmessage=function(e){for(var t in e.data){switch(t){case"setID":ID=e.data[t];while(msg.length>0){msg.pop()}break;default:dataResponse(e)}}};


(function (context) {
    /*****************************************************************************************
     * Utility Functions
     ****************************************************************************************/

    var isUnitInBase = function (base, unit) {
        var x = base.locx - unit.locx;
        var y = base.locy - unit.locy;
        if (x * x + y * y < base.R * base.R) {
            return true;
        }
        return false;
    };


    //check if enemies are inside a base
    var isEnemyInBase = function (b, foes) {
        for (var i = 0; i < foes.length; i++) {
            if (IsUnitInBase(b, foes[i])) {
                return true;
            }
        }
        return false;
    };

    //checks if an enemy unit is in attacking range.  If there are multiple, select the weakest
    var enemyInRange = function (me, them) {
        targetLife = 999;
        target = -1;
        for (var i = 0; i < them.length; i++) {
            if (them[i].health <= 0) {
                continue;
            }
            var x = me.locx - them[i].locx;
            var y = me.locy - them[i].locy;
            if (x * x + y * y < me.atkRadius * me.atkRadius &&
                them[i].health < targetLife) {
                targetLife = them[i].health;
                target = them[i].id;
            }
        }
        return target;
    };

    //find nearest unoccupied base, excluding an id
    var closestOpenBase = function (bases, x, y, exid) {
        var minDist = 9999;
        var minBase = {};
        for (var i = 0; i < bases.length; i++) {
            if (bases[i].allegiance >= 0 || bases[i].id == exid) {
                continue;
            }
            var dist = Math.abs(bases[i].locx - x) +
                Math.abs(bases[i].locy - y);
            if (dist < minDist) {
                minDist = dist;
                minBase = bases[i];
            }
        }
        return minBase;
    };

    //find a base that I am currently owning
    var ownedBase = function (bases) {
        for (var i = 0; i < bases.length; i++) {
            if (bases[i].allegiance == ID) {
                return bases[i];
            }
        }
        return -1;
    };

    //identify the direction i should move in to get to a target destination
    var getDir = function (x1, y1, x2, y2) {
        var w = x1 - x2;
        var h = y1 - y2;
        if (Math.abs(w) > Math.abs(h)) {
            if (w < 0) {
                return "right";
            } else {
                return "left";
            }
        } else {
            if (h < 0) {
                return "down";
            } else {
                return "up";
            }
        }
        return "";
    };

    //move unit
    var unitMove = function (unit, dir) {
        switch (dir) {
        case "up":
            unit.locy--;
            break;
        case "left":
            unit.locx--;
            break;
        case "right":
            unit.locx++;
            break;
        case "down":
            unit.locy++;
            break;
        }
    };

    var myUnits = function (ev) {
        var myGuys = [];
        u = ev.data["Data"].units;
        b = ev.data["Data"].bases;

        for (var i = 0; i < u.length; i++) {
            if (u[i].allegiance == this.ID) {
                myGuys.push(u[i]);
            }
        }
        return myGuys;
    };

    var enemyUnits = function (ev, team) {
        var units = [];
        u = ev.data["Data"].units;
        b = ev.data["Data"].bases;

        for (var i = 0; i < u.length; i++) {
            if (u[i].allegiance != this.ID) {
                units.push(u[i]);
            }
        }
        return units;
    };

    var shouldWeAttack = function (ev) {
        var allyCount = myUnits(ev).length,
            enemyCount = enemyUnits(ev).length;

        if (allyCount > enemyCount * 0.5) {
            return true;
        }
        return false;
    };

    /**
     * @param a   unit
     * @param b   unit or base
     * @returns   dir
     */
    var unitMoveTo = function (a, b) {
        var dir = getDir(a.locx, a.locy, b.locx, b.locy);
        unitMove(a, dir);

        return dir;
    };

    //create new orders for my units
    context.dataResponse = function (ev) {
        //sort through given data
        var orders = [];
        var units = ev.data["Data"].units;
        var bases = ev.data["Data"].bases;

        myGuys = myUnits(ev);
        enemies = enemyUnits(ev);

        //if this is my first turn, identify what base I am in
        if (homeBase[0] == -1) {
            homeBase[0] = ownedBase(bases);
            homeBase[1] =
                closestOpenBase(bases, homeBase[0].locx, homeBase[0].locy);
            //split army into 2 troops for later reference
            troop[0] = myGuys;
            troop[1] = [];
            totalUnits = units.length;
        }

        //look for newly created units and place into appropriate troop
        if (totalUnits < units.length) {
            for (var i = totalUnits; i < units.length; i++) {
                if (units[i].allegiance == ID) {
                    //a new unit for me!  place in appropriate troop
                    if (isUnitInBase(homeBase[0], units[i])) {
                        troop[0].push(units[i]);
                    }
                    else {
                        troop[1].push(units[i]);
                    }
                }
            }
            totalUnits = units.length;
        }

        //check if there are any enemies in my bases.  If so, pick a new base and split up
        for (var i = 0; i < enemies.length; i++) {
            if (isUnitInBase(homeBase[0], enemies[i])) {
                //first base is being attacked.  pick a new base
                homeBase[0] =
                    closestOpenBase(bases, homeBase[0].locx, homeBase[0].locy,
                        homeBase[1].id);
                for (var j = 0; j < troop[0].length; j++) {
                    troop[1].push(troop[0].splice(j, 1)[0]);
                    j++;
                }
                break;
            }
            if (isUnitInBase(homeBase[1], enemies[i])) {
                //second base is being attacked.  pick a new base
                homeBase[1] =
                    closestOpenBase(bases, homeBase[1].locx, homeBase[1].locy,
                        homeBase[0].id);
                for (var j = 0; j < troop[1].length; j++) {
                    troop[0].push(troop[1].splice(j, 1)[0]);
                    j++;
                }
                break;
            }
        }

        //move to troop's base.  If already in base, start farming
        for (var i = 0; i < troop[0].length; i++) {
            var dir = unitMoveTo(troop[0][i], homeBase[0]);
            var mark = enemyInRange(troop[0][i], enemies);

            if (mark > 0) {

                orders.push({

                    "unitID": troop[0][i].id,
                    "move": "",
                    "dash": "",
                    "attack": mark,
                    "farm": false

                });

            }

            else if (isUnitInBase(homeBase[0], troop[0][i])) {
                orders.push({
                    "unitID": troop[0][i].id,
                    "move": dir,
                    "dash": "",
                    "attack": "",
                    "farm": true
                });
            }
            else {
                orders.push({
                    "unitID": troop[0][i].id,
                    "move": dir,
                    "dash": dir,
                    "attack": "",
                    "farm": false
                });
                unitMove(troop[0][i], dir);
            }
        }
        for (var i = 0; i < troop[1].length; i++) {
            var dir = unitMoveTo(troop[1][i], homeBase[1]);
            var mark = enemyInRange(troop[1][i], enemies);

            if (mark > 0) {

                orders.push({

                    "unitID": troop[1][i].id,
                    "move": "",
                    "dash": "",
                    "attack": mark,
                    "farm": false

                });

            }

            else if (isUnitInBase(homeBase[1], troop[1][i])) {
                orders.push({
                    "unitID": troop[1][i].id,
                    "move": dir,
                    "dash": "",
                    "attack": "",
                    "farm": true
                });
            }
            else {
                orders.push({
                    "unitID": troop[1][i].id,
                    "move": dir,
                    "dash": dir,
                    "attack": "",
                    "farm": false
                });
                unitMove(troop[1][i], dir);
            }
        }

        //post message back to AI Manager
        postMessage({"Orders": orders});
    };

}(this));

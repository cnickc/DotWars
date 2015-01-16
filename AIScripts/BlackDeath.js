/*****************************************************************************************
 * Farmer:
 * Virus-like behavior.  Randomly selects a target base and moves all units to it, 
 * attacking anything in its path.  Once at the target base, all units will hang around 
 * the center and attack anything that comes close, including farmed units.  Once this 
 * army claims ownership of the target base, it selects a new target and repeats the 
 * process
 * Contributed by: Ray Wang
 ****************************************************************************************/
var ass = {};
var msg = [];
var ID;
 
onmessage = function ( ev ) {
	for( var cmd in ev.data ) {
        switch( cmd ) {
			case "setID":
				//used so I can identify which units the game has classified as 'mine'
				ID = ev.data[cmd];
				while (msg.length > 0) {
		    		msg.pop();
				}
				break;
			default:
				//strategy response
				dataResponse( ev );
		}
	}	

};

//create new orders for my units
dataResponse = function ( ev ) {
	//sort through given data
	orders = [];
	myGuys = [];
	enemies = [];
	u = ev.data["Data"].units;
	b = ev.data["Data"].bases;
	for( var i = 0; i < u.length; i++ ) {
		if( u[i].allegiance == this.ID ) {
			myGuys.push( u[i] );
		} else {
            if (u[i].id != -1)
                enemies.push( u[i] );
		}
	}
    
    // assign everyone
    reassignAllAssigned(myGuys);
    assignAllUnassigned(myGuys);
    var unass = getUnassigned(myGuys);
    var farmers = getAssigned(myGuys, "f");
    var warriors = getAssigned(myGuys, "w");
    var expanders = getAssigned(myGuys, "e");
	
    // find as many enemies as warriors
    for (var i = 0; i < warriors.length; i++) {
        orders.push( findEnemy(warriors[i], enemies) );
    }
    
	//attack any units in range, or move towards target
	for (var i = 0; i < farmers.length; i++ ) {
        orders.push( {"unitID" : farmers[i].id, "move" : "", "dash" : "", "attack" : "", "farm" : true} );	
	}

	//post message back to AI Manager
	postMessage( { "Orders" : orders } );	
}

function abs (val1, val2) {
    if (val1 >= val2)
        return val1 - val2;
    else
        return val2 - val1;
}

function twotimes (val1, val2) {
    if (val1 >= val2 * 2)
        return true;
    if (val2 >= val1 * 2)
        return true;
    return false;
}

function radius (val1, val2) {
    return Math.sqrt((val1 * val1) + (val2 * val2));
}

function findEnemy (warrior, units) {
    var curDistance = 99999;
    var curEnemy = "";
    var curDistX = "";
    var curDistY = "";
    for (var i = 0; i < units.length; i++) {
        var distX = abs(warrior.locx, units[i].locx);
        var distY = abs(warrior.locy, units[i].locy);
        if ((distX + distY) < curDistance) {
            curDistance = distX + distY;
            curEnemy = units[i];
            curDistX = distX;
            curDistY = distY;
        }
    }
    var action = actionEnemy(warrior, curEnemy, curDistance, curDistX, curDistY);
    return action;
}

function actionEnemy (warrior, enemy, distTot, distX, distY) {
    var mainDir = "";
    var altDir = "";
    if (distX > distY) {
        if (warrior.locx > enemy.locx) {
            mainDir = "left";
            if (warrior.locy > enemy.locy)
                altDir = "up";
            else
                altDir = "down";
        }
        else {
            mainDir = "right";
            if (warrior.locy > enemy.locy)
                altDir = "up";
            else
                altDir = "down";
        }
        if (twotimes(distX, distY))
            altDir = mainDir;
    }
    else {
        if (warrior.locy > enemy.locy) {
            mainDir = "up";
            if (warrior.locx > enemy.locx)
                altDir = "left";
            else
                altDir = "right";
        }
        else {
            mainDir = "down";
            if (warrior.locx > enemy.locx)
                altDir = "left";
            else
                altDir = "right";
        }
        if (twotimes(distX, distY))
            altDir = mainDir;
    }
    
    if (radius(distX, distY) >= 10) {
        return {"unitID" : warrior.id, "move" : mainDir, "dash" : altDir, "attack" : "", "farm" : false};
    } else {
        return {"unitID" : warrior.id, "move" : mainDir, "dash" : "", "attack" : enemy.id, "farm" : false};
    }
}

function getUnassigned (units) {
    var ret = [];
    for (var i = 0; i < units.length; i++) {
        if (!this.ass[units[i].id]) {
            ret.push(units[i]);
        }
    }
    return ret;
}

function getAssigned (units, type) {
    var ret = [];
    for (var i = 0; i < units.length; i++) {
        if (this.ass[units[i].id]) {
            if (this.ass[units[i].id] == type) {
                ret.push(units[i]);
            }
        }
    }
    return ret;
}

function reassignAllAssigned (units) {
    for (var i = 0; i < units.length; i++) {
        if (this.ass[units[i].id])
            assign(units[i], this.ass[units[i].id]);
    }
}

function assignAllUnassigned (units) {
    var unass = getUnassigned(units);
    for (var i = 0; i < unass.length; i++) {
        assign(unass[i], pickType(units));
    }
}

function assign (unit, type) {
    unit.type = type;
    this.ass[unit.id] = type;
}

function pickType (units) {
    var farmers = getAssigned(units, "f");
    var warriors = getAssigned(units, "w");
    var expanders = getAssigned(units, "e");
    
    if (farmers.length <= warriors.length)
        return "f";
    else
        return "w";
}
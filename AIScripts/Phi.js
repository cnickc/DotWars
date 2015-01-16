/*****************************************************************************************
 * Phi:
 * Peter and Aditya AI
 ****************************************************************************************/
 /*****************************************************************************************
 * Gamma:
 * The hunter.  Takes a moment to strengthen its army, then selects a target unit to track
 * down.  Ignore everything else en-route.
 ****************************************************************************************/
var msg = [];
var ID;
var targetUnit = -1;

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

/*****************************************************************************************
 * Utility Functions
 ****************************************************************************************/
//checks if an enemy unit is in attacking range.  If there are multiple, select the 
//weakest
enemyInRange = function( me, them ) {
	targetLife = 999;
	target = -1;
	for( var i = 0;  i < them.length; i++ ) {
		if( them[i].health <= 0 ) {
			continue;
		}
		var x = me.locx - them[i].locx;
		var y = me.locy - them[i].locy;
		if( x*x + y*y < me.atkRadius*me.atkRadius && them[i].health < targetLife ) {
			targetLife = them[i].health;
			target = them[i].id;
		}
	}
	return target;
};

//identify the direction i should move in to get to a target destination
getDir = function( x1, y1, x2, y2 ) {
	var w = x1 - x2;
	var h = y1 - y2;
	if( Math.abs( w ) > Math.abs( h ) ){
		if( w < 0 ) {
			return "right";
		} else {
			return "left";
		}
	} else {
		if( h < 0 ) {
			return "down";
		} else {
			return "up";
		}
	}
	return "";
};

isUnitInBase = function ( base, unit ) {
	var x = base.locx - unit.locx;
	var y = base.locy - unit.locy;
	if ( x*x + y*y < base.R*base.R ) {
		return true;
	}	
	return false;
}
//check if enemies are inside a base
isEnemyInBase = function( b, foes ) {
	for( var i = 0; i < foes.length; i++ ) {
		if( IsUnitInBase( b, foes[i] ) ) {
			return true;
		}
	}
	return false;
};

//find nearest unoccupied base, excluding an id
closestOpenBase = function( bases, x, y, exid ) {
	var minDist = 9999;
	var minBase = {};
	for( var i = 0; i < bases.length; i++ ) {
		if( bases[i].allegiance >= 0 || bases[i].id == exid ) {
			continue;
		}
		var dist = Math.abs(bases[i].locx - x) + Math.abs(bases[i].locy - y);
		if( dist < minDist ) {
			minDist = dist;
			minBase = bases[i];
		} 
	}
	return minBase;
};

//find a base that I am currently owning
ownedBase = function( bases ) {
	for( var i = 0; i < bases.length; i++ ) {
		if( bases[i].allegiance == ID ) {
			return bases[i];
		}
	}
	return -1;
}

ownedBases = function( bases ) {
	var b = [];
	for( var i = 0; i < bases.length; i++ ) {
		if( bases[i].allegiance == ID ) {
			b.push( bases[i] );
		}
	}
	return b;
}

openBases = function( bases ) {
	var b = [];
	for( var i = 0; i < bases.length; i++ ) {
		if( bases[i].allegiance <=0 ) {
			b.push( bases[i] );
		}
	}
	return b;
}

//move unit
unitMove = function( unit, dir ) {
	switch( dir ) {
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

moveToBaseFarm = function( troopIndex ) {
	for( var i = 0; i < troop[troopIndex].length; i++ ) {			
		var mark = enemyInRange( troop[troopIndex][i], enemies );
		if( mark > 0 ) {
			//attack if someone is in my space
			orders.push( {"unitID" : troop[troopIndex][i].id, "move" : "", "dash" : "", "attack" : mark, "farm" : false} );
			return;
		} else {
			//farm
			var dir = getDir( troop[troopIndex][i].locx, troop[troopIndex][i].locy, homeBase[troopIndex].locx, homeBase[troopIndex].locy ); 
			unitMove( troop[troopIndex][i], dir );
			if( isUnitInBase( homeBase[troopIndex], troop[troopIndex][i] ) ) {
				orders.push( {"unitID" : troop[troopIndex][i].id, "move" : dir, "dash" : "", "attack" : "", "farm" : true} );
				return;
			}
			else {
				orders.push( {"unitID" : troop[troopIndex][i].id, "move" : dir, "dash" : dir, "attack" : "", "farm" : false} );					
				unitMove( troop[troopIndex][i], dir );
				return;
			}
			return;
		}
	}
}

splitAttack = function( troopIndex ) {
	if( targetUnit == -1 && troop[troopIndex].length < 6 ) {
		for( var i = 0; i < troop[troopIndex].length; i++ ) {
			var mark = enemyInRange( troop[troopIndex][i], enemies );
			if( mark > 0 ) {
				//attack if someone is in my space
				orders.push( {"unitID" : troop[troopIndex][i].id, "move" : "", "dash" : "", "attack" : mark, "farm" : false} );	
			} else {
				//farm
				orders.push( {"unitID" : troop[troopIndex][i].id, "move" : "", "dash" : "", "attack" : "", "farm" : true} );
			}
		}	
	} 
	else
	{
		//find a new target
		while( targetUnit == -1 || u[targetUnit].health <= 0) {
			targetUnit = enemies[Math.floor(Math.random() * enemies.length)].id;
		}

		//chase down that target 
		for( var i = 0; i < troop[troopIndex].length; i++ ) {
			var mark = enemyInRange( troop[troopIndex][i], [ u[targetUnit] ] );
			if( mark > 0 ) {
				orders.push( {"unitID" : troop[troopIndex][i].id, "move" : "", "dash" : "", "attack" : mark, "farm" : false} );	
			} else {
				var dir = getDir( troop[troopIndex][i].locx, troop[troopIndex][i].locy, u[targetUnit].locx, u[targetUnit].locy ); 
				orders.push( {"unitID" : troop[troopIndex][i].id, "move" : dir, "dash" : dir, "attack" : "", "farm" : false} );
			}
		}
	}
}
var homeBase = [-1, -1];
var troop = [];
var totalUnits = 0;
var targetIndex = -1;
var u;
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
			enemies.push( u[i] );
		}
	}

	//if this is my first turn, identify what base I am in
	if( homeBase[0] == -1 ) {
		homeBase[0] = ownedBase( b );
		homeBase[1] = closestOpenBase( b, homeBase[0].locx, homeBase[0].locy );

		//split army into multiiple troops for later reference
		troop[0] = myGuys;
		troop[1] = [];
		totalUnits = u.length;
	}

	if( troop[0].length <= 6 ) {
		moveToBaseFarm(0);
	}
	else {
		splitAttack(0);
	}
	if( troop[1].length <= 6 ) {
		moveToBaseFarm(1);
	}
	else {
		splitAttack(1);
	}

	//build a stockpile before going hunting

	

	//post message back to AI Manager
	postMessage( { "Orders" : orders } );	
}
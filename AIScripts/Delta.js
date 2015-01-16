/*****************************************************************************************
 * Delta:
 * The coward.  Will abandon its current base when an enemy approaches, then split 
 * into two groups.  When in a base, it will attempt to farm new units.
 * Contributed by: Cameron Christou
 ****************************************************************************************/
var msg = [];
var ID;
var homeBase = [-1, -1];
var troop = [];
var totalUnits = 0;

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
		//split army into 2 troops for later reference
		troop[0] = myGuys;
		troop[1] = [];
		totalUnits = u.length;
	}

	//look for newly created units and place into appropriate troop
	if( totalUnits < u.length ) {
		for( var i = totalUnits; i < u.length; i++ ) {
			if( u[i].allegiance == ID ) {
				//a new unit for me!  place in appropriate troop
				if( isUnitInBase( homeBase[0], u[i] ) ) {
					troop[0].push( u[i] );
				}
				else {
					troop[1].push( u[i] );
				}
			}
		}
		totalUnits = u.length;
	}

	//check if there are any enemies in my bases.  If so, pick a new base and split up
	for( var i = 0; i < enemies.length; i++ ) {
		if( isUnitInBase( homeBase[0], enemies[i] ) ) {
			//first base is being attacked.  pick a new base
			homeBase[0] = closestOpenBase( b, homeBase[0].locx, homeBase[0].locy, homeBase[1].id );
			for( var j = 0; j < troop[0].length; j++ ) {
				troop[1].push( troop[0].splice(j, 1)[0] );
				j++;
			}
			break;
		}
		if( isUnitInBase( homeBase[1], enemies[i] ) ) {
			//second base is being attacked.  pick a new base
			homeBase[1] = closestOpenBase( b, homeBase[1].locx, homeBase[1].locy, homeBase[0].id );
			for( var j = 0; j < troop[1].length; j++ ) {
				troop[0].push( troop[1].splice(j, 1)[0] );
				j++;
			}
			break;
		}		
	}
	
	//move to troop's base.  If already in base, start farming
	for( var i = 0; i < troop[0].length; i++ ) {
		var dir = getDir( troop[0][i].locx, troop[0][i].locy, homeBase[0].locx, homeBase[0].locy ); 
		unitMove( troop[0][i], dir );
		if( isUnitInBase( homeBase[0], troop[0][i] ) ) {
			orders.push( {"unitID" : troop[0][i].id, "move" : dir, "dash" : "", "attack" : "", "farm" : true} );			
		}	
		else {
			orders.push( {"unitID" : troop[0][i].id, "move" : dir, "dash" : dir, "attack" : "", "farm" : false} );					
			unitMove( troop[0][i], dir );
		}
	}
	for( var i = 0; i < troop[1].length; i++ ) {
		var dir = getDir( troop[1][i].locx, troop[1][i].locy, homeBase[1].locx, homeBase[1].locy ); 
		unitMove( troop[1][i], dir );
		if( isUnitInBase( homeBase[1], troop[1][i] ) ) {
			orders.push( {"unitID" : troop[1][i].id, "move" : dir, "dash" : "", "attack" : "", "farm" : true} );			
		}	
		else {
			orders.push( {"unitID" : troop[1][i].id, "move" : dir, "dash" : dir, "attack" : "", "farm" : false} );					
			unitMove( troop[1][i], dir );
		}
	}

	//post message back to AI Manager
	postMessage( { "Orders" : orders } );	
}
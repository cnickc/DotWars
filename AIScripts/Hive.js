/*****************************************************************************************
 * Delta:
 * The coward.  Will abandon its current base when an enemy approaches, then split 
 * into two groups.  When in a base, it will attempt to farm new units.
 * Contributed by: Phil Jones & Joey Rideout
 ****************************************************************************************/
var msg = [];
var ID;
var homeBase = [-1];
var troop = [];
var objectives = [];
var totalUnits = 0;

var myBases = [];

var mytarget = [];

var findNewThreshold = 6;
var globalAttackThreshold = 15;

var globalAttack = false;
var globalTarget = -1;


var nextFreeTroop = 0;

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
	teams = [];

	u = ev.data["Data"].units;
	b = ev.data["Data"].bases;

	

	for( var i = 0; i < u.length; i++ ) {
		if( u[i].allegiance == this.ID ) {
			myGuys.push( u[i] );
		} else {
			enemies.push( u[i] );
		}
	}

	for(var i = 0; i < troop.length; i++)
	{
		// remove any dead players
		for(var j = troop[i].length - 1; j >= 0; j--) {
		    if(troop[i][j].health <= 0) {
	    	   //console.log('player is dead');
		       troop[i].splice(j, 1);
		    }
		}
	}

	//if this is my first turn, identify what base I am in
	if( homeBase[0] == -1 ) {
		for(var i = 0; i < b.length; i++)
			{
				//console.log('base ' + i + ' x:' + b[i].locx + ' y:' + b[i].locy);
			}

		objectives[0] = 'farm';
		homeBase[0] = ownedBase( b );
		//homeBase[1] = closestOpenBase( b, homeBase[0].locx, homeBase[0].locy );
		//split army into 2 troops for later reference
		troop[0] = myGuys;
		//troop[1] = [];
		totalUnits = u.length;
	}

	if(myGuys.length > globalAttackThreshold)
	{
		globalAttack = true;
	}
		
	//console.log(myGuys.length);

	//look for newly created units and place into appropriate troop
	if( totalUnits < u.length ) {
		for( var i = totalUnits; i < u.length; i++ ) {
			if( u[i].allegiance == ID ) {
				var foundTroop = false;
				for(var j = 0; j < troop.length; j++)
				{
					if(troop[j].length > findNewThreshold)
					{
						// put into a new troop
						continue;
					}
					if(troop[j].length >= 10)
					{
						// troop is full
						continue;
					}
					else
					{
						foundTroop = true;
						//console.log(j + ': new unit');
						troop[j].push( u[i] );
					}
				}
				if(!foundTroop)
				{
					// create new troop
					//console.log('creating new troop to find new base');

					var troopIndex = troop.push([]) - 1;

					troop[troopIndex].push( u[i]);
					objectives[troopIndex] = 'find-new-base';
					//homeBase[troop.length-1] = closestOpenBase( b, u[i].locx, u[i].locy ); // use this troop's closest open base
					var newBase = closestOpenBase( b, u[i].locx, u[i].locy ); // use this troop's closest open base
					if(newBase === undefined)
					{
						// there are no new bases
						homeBase[troopIndex] = homeBase[0];
						//console.log('global attack!!!!!');
						globalAttack = true;
						break;
					}
					//console.log('troop ' + troopIndex + ' is going to x:' + newBase.locx + ' y:' + newBase.locy);
					homeBase[troopIndex] = newBase;
				}
				//a new unit for me!  place in appropriate troop
				/*if( troop[0]  <= 4 && isUnitInBase( homeBase[0], u[i] ) ) {
					//console.log('0: new unit');
					troop[0].push( u[i] );
				}
				else {
					//console.log('1: new unit');
					troop[1].push( u[i] );
				}*/
			}
		}
		totalUnits = u.length;
	}


	//check if there are any enemies in my bases.  If so, pick a new base and split up
	for( var i = 0; i < enemies.length; i++ ) {

		for( var j = 0; j < homeBase.length; j++)
		{
			if( isUnitInBase( homeBase[j], enemies[i] ) ) {
				//console.log('enemy in homebase - it is the target for troop ' + j);
				//console.log('globalAttack');
				globalAttack = true;
				//first base is being attacked.  swarm

				/*homeBase[0] = closestOpenBase( b, homeBase[0].locx, homeBase[0].locy, homeBase[1].id );
				for( var j = 0; j < troop[0].length; j++ ) {
					troop[1].push( troop[0].splice(j, 1)[0] );
					j++;
				}*/

				mytarget[j]= enemies[i];


				break;
			}
			/*else if (mytarget[j] != undefined)
			{
				// unit is not in base anymore - not a target anymore
				mytarget[j] = undefined;
			}*/
		}
		/*if( isUnitInBase( homeBase[0], enemies[i] ) ) {
			//console.log('enemy in homebase - it is the target for troop 0');
			//first base is being attacked.  swarm

			mytarget[0]= enemies[i];


			break;
		}
		if( isUnitInBase( homeBase[1], enemies[i] ) ) {
			//console.log('enemy in 2nd homebase - it is the target for troop 1');
			//second base is being attacked.  pick a new base

			mytarget[0]= enemies[i];
			break;
		}*/
	}


	if(globalAttack)
	{
		/*for(var i = 0; i < objectives.length; i++)
		{
			objectives[i] = 'attack';
		}*/

		//find a new target
		while( globalTarget == -1 || u[globalTarget].health <= 0) {
			globalTarget = enemies[Math.floor(Math.random() * enemies.length)].id;
		}

		if(enemies.length == 0)
		{
			// everyone is dead
			globalAttack = false;
		}

		//chase down that target 
		for( var i = 0; i < myGuys.length; i++ ) {
			var mark = enemyInRange( myGuys[i], [ u[globalTarget] ] );
			if( mark > 0 ) {
				orders.push( {"unitID" : myGuys[i].id, "move" : "", "dash" : "", "attack" : mark, "farm" : false} );	
			} else {
				var dir = getDir( myGuys[i].locx, myGuys[i].locy, u[globalTarget].locx, u[globalTarget].locy ); 
				orders.push( {"unitID" : myGuys[i].id, "move" : dir, "dash" : dir, "attack" : "", "farm" : false} );
			}
		}

		postMessage( { "Orders" : orders } );	
		return;
	}
	
	//move to troop's base.  If already in base, start farming
	for(var x = 0; x < troop.length; x++)
	{
		var curTroop = troop[x];
		for( var i = 0; i < curTroop.length; i++ ) {
			var curUnit = curTroop[i];
			var curTarget = mytarget[x];
			// there is a target
			if(curTarget)
			{
				if(enemyInRange(curUnit, curTarget) > 0)
				{
					//attack if someone is in my home
					//console.log('enemy in range');
					orders.push( {"unitID" : curUnit.id, "move" : "", "dash" : "", "attack" : mcurTarget, "farm" : false} );	
				}
				else
				{
					if(curTarget.health < 0) curTarget = undefined;
					// target for this troop
					var dir = getDir( curUnit.locx, curUnit.locy, curTarget.locx, curTarget.locy ); 	
					unitMove( curUnit, dir );
				}
				break;
			}	
			// move towards base
			var dir1 = getDir( curUnit.locx, curUnit.locy, homeBase[x].locx, homeBase[x].locy ); 
			unitMove( curUnit, dir1 );
			if( isUnitInBase( homeBase[x], curUnit )) {
				objectives[x] = 'farm'; // change objective to farm
				////console.log('troop ' + x + ' unit '+ curTroop[i].id + ' objective: farm');
				orders.push( {"unitID" : curUnit.id, "move" : dir1, "dash" : "", "attack" : "", "farm" : true} );				
				
			}	
			else {
				////console.log('troop ' + x + ' unit '+  curTroop[i].id + ' objective: ' + objectives[x]);
				var dir2 = getDir( curUnit.locx, curUnit.locy, homeBase[x].locx, homeBase[x].locy );
				orders.push( {"unitID" : curUnit.id, "move" : dir1, "dash" : dir2, "attack" : "", "farm" : false} );					
				unitMove( curUnit, dir2 );
			}
		}
	}

	/*
	for( var i = 0; i < troop[0].length; i++ ) {
		if(mytarget[0] !== undefined)
		{
			if(enemyInRange(troop[0][i], mytarget[0]) > 0)
			{
				//attack if someone is in my home
				//console.log('enemy in range');
				//console.log(mytarget[0]);
				orders.push( {"unitID" : troop[0][i].id, "move" : "", "dash" : "", "attack" : mytarget[0], "farm" : false} );	
			}
			else
			{
				// target for this troop
				var dir = getDir( troop[0][i].locx, troop[0][i].locy, mytarget[0].locx, mytarget[0].locy ); 	
				unitMove( troop[0][i], dir );
			}
			break;
		}	
		var dir = getDir( troop[0][i].locx, troop[0][i].locy, homeBase[0].locx, homeBase[0].locy ); 
		unitMove( troop[0][i], dir );
		if( isUnitInBase( homeBase[0], troop[0][i] ) && obj0 == 'farm') {
			//console.log('farm');
			orders.push( {"unitID" : troop[0][i].id, "move" : dir, "dash" : "", "attack" : "", "farm" : true} );			
		}	
		else {
			//console.log('dash towards base');
			//console.log(obj0);
			var dir = getDir( troop[0][i].locx, troop[0][i].locy, homeBase[1].locx, homeBase[1].locy );
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
	}*/

	//post message back to AI Manager
	postMessage( { "Orders" : orders } );	
}
/*****************************************************************************************
 * Ninja:
 * Virus-like behavior.  Randomly selects a target base and moves all units to it, 
 * attacking anything in its path.  Once at the target base, all units will hang around 
 * the center and attack anything that comes close, including farmed units.  Once this 
 * army claims ownership of the target base, it selects a new target and repeats the 
 * process
 * Contributed by: Simon Graham & Sophie Twardus
 ****************************************************************************************/
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

dataResponse = function ( ev ) {
	//sort through given data
	orders = [];
	myGuys = [];
	enemies = [];
	u = ev.data["Data"].units;
	b = ev.data["Data"].bases;
	myBases = getMyBases(b);
	maxUnits = myBases.length * 10;
	newBaseSearch = 0;
	maxNewBaseSearch = 2;



	for( var i = 0; i < u.length; i++ ) {
		if( u[i].allegiance == this.ID ) {
			myGuys.push( u[i] );
		} else {
			enemies.push( u[i] );
		}
	}

	for (var i = 0; i < myGuys.length; i++) {
		var myB = myBase(b, myGuys[i]);
		var actioned = false;
		var countInMyB = 0;

		if(myB != 'undefined' && myB != null){
			countInMyB = unitsInBase(myB, myGuys);
		}

		var inrange = enemyInRange(myGuys[i], enemies);

		if (inrange > 0) {
			orders.push({"unitID" : myGuys[i].id, "move" : "", "dash" : "", "attack" : inrange, "farm" : false});
			actioned = true;
		}

		if(actioned == false){
			if (myB == 'undefined' || myB == null || (8 <= countInMyB && newBaseSearch <= maxNewBaseSearch)){
				//search for new bases
				nearestBase = closestOpenBase( b, myBases[0].locx, myBases[0].locy);

				if(nearestBase == ''){
				   var weakest = findWeakestBase(b,enemies);
				   var direction = getDir(myGuys[i].locx, myGuys[i].locy, weakest.locx, weakest.locy);
					orders.push({"unitID" : myGuys[i].id, "move" : "", "dash" : direction, "attack" : "", "farm" : false});
					newBaseSearch = newBaseSearch + 1;
				}
				else{
					var direction = getDir(myGuys[i].locx, myGuys[i].locy, nearestBase.locx, nearestBase.locy);
					orders.push({"unitID" : myGuys[i].id, "move" : "", "dash" : direction, "attack" : "", "farm" : false});
					newBaseSearch = newBaseSearch + 1;
				}
			}
			else {
				orders.push({"unitID" : myGuys[i].id, "move" : "", "dash" : "", "attack" : "", "farm" : true});
			}
		}
	}

	//post message back to AI Manager
	postMessage( { "Orders" : orders } );	
}

myBase = function(bases, guy){
	for(var i = 0; i < bases.length; i++){
		if (isUnitInBase(bases[i], guy)){
			return bases[i];	
		}
	}
}

countInMyBase = function(base, units){
	var unitCount = unitsInBase(base, units);
	return unitCount;
}

unitsInBase= function (base, units) {
		var numUnits = 0;

		for ( var i = 0; i < units.length; i++ ) {

			if ( isUnitInBase(base, units[i]) ) {
				numUnits = numUnits + 1;
			}
		}
		return numUnits;
	};
	
isUnitInBase = function (base, unit) {
		var x = base.locx - unit.locx;
		var y = base.locy - unit.locy;
		if ( x*x + y*y < base.R*base.R ) {
			return true;
		}
		return false;
	};



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

getMyBases = function(bases){
	var myBases = [];

	for(var i = 0; i < bases.length; i++){
		if(bases[i].allegiance == ID){
			myBases.push(bases[i]);
		}
	}

	return myBases;
}

ownedBase = function( bases ) {
	for( var i = 0; i < bases.length; i++ ) {
		if( bases[i].allegiance == ID ) {
			return bases[i];
		}
	}
	return -1;
}

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

findWeakestBase = function(bases, units){
	var weakest;

	for(var i = 0; i < bases.length; i++){
		var unitsInBase = bases[i].UnitsInBase;
		if(unitsInBase < weakest){
			weakest = base[i];
		}
	}

	return weakest;
}


/*****************************************************************************************
 * Gamma:
 * The hunter.  Takes a moment to strengthen its army, then selects a target unit to track
 * down.  Ignore everything else en-route.
 * Contributed by: Chris Taylor & Matt Wagner
 ****************************************************************************************/
var msg = [];
var ID;
var targetUnit = -1;
var firstBase = -1;
var nextBase = -1;

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

distanceToUnit = function(unit1, unit2)
{
	return Math.sqrt(Math.pow(unit1.locx - unit2.locx,2) + Math.pow(unit1.locy-unit2.locy,2));
}


closestEnemy = function( me, them, seed ) {
	if (them.length==0)
		return -1;
	var closest=them[0];
	var closestDist=seed;
	for( var i = 0;  i < them.length; i++ ) {
		if( them[i].health <= 0 ) 
			continue;
		var dist=distanceToUnit(me, them[i]);
		if (dist<closestDist)
		{
			closestDist=dist;
			closest=them[i];
		}
	}
	return closest;
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

//find a base that I am currently owning
ownedBase = function( bases ) {
	for( var i = 0; i < bases.length; i++ ) {
		if( bases[i].allegiance == ID ) {
			return bases[i];
		}
	}
	return -1;
}

//find nearest unoccupied base, excluding an id
closestOpenBase = function( bases, x, y, exid ) {
	var minDist = 9999;
	var minBase = -1;
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

//check if enemies are inside a base
isEnemyInBase = function( b, foes ) {
	for( var i = 0; i < foes.length; i++ ) {
		if( IsUnitInBase( b, foes[i] ) ) {
			return true;
		}
	}
	return false;
};


	
	/*if( homeBase[0] == -1 ) {
		homeBase[0] = ownedBase( b );
		homeBase[1] = closestOpenBase( b, homeBase[0].locx, homeBase[0].locy );
		//split army into 2 troops for later reference
		troop[0] = myGuys;
		troop[1] = [];
		totalUnits = u.length;
	}*/

/*
var index = 0;
			var closest = 1000000;
			for (var x = 0; x < b.length; x++)
			{
				if(b[x].allegiance == this.ID)
				{
					continue;
				}
				var temp = Math.sqrt(Math.pow((b[x].locx - myGuys[i].locx),2) + Math.pow((b[x].locy - myGuys[i].locy),2));
				if(closest >= temp)
				{
					closest = temp;
					index = x;
				}
			}*/

isUnitInBase = function ( base, unit ) {
	var x = base.locx - unit.locx;
	var y = base.locy - unit.locy;
	if ( x*x + y*y < base.R*base.R ) {
		return true;
	}	
	return false;
}



getUnitsInBase = function (base, units)
{
	var unitsInBase=[];
	for (var i=0;i<units.length;i++)
	{
		if (isUnitInBase(base,units[i]))
		unitsInBase.push(units[i]);
	}
	return unitsInBase;
}

numBases = function( bases ) {
	var numBases = 0;
	for( var i = 0; i < bases.length; i++ ) {
		if( bases[i].allegiance == ID ) {
			numBases++;
		}
	}
	return numBases;
}



//create new orders for my units
dataResponse = function ( ev ) {
	//sort through given data
	orders = [];
	myGuys = [];
	enemies = [];
	u = ev.data["Data"].units;
	b = ev.data["Data"].bases;
	var baseCount = numBases(b);
	
	for( var i = 0; i < u.length; i++ ) {
		if( u[i].allegiance == this.ID ) {
			myGuys.push( u[i] );
		} else {
			enemies.push( u[i] );
		}
	}
	
	
	var availableUnits = [];
	var farmingUnits = [];
	var ownedBasesNeedingMore = [];
	for (var baseIndex = 0; baseIndex<b.length; baseIndex++)
	{
		if (b[baseIndex].allegiance != ID)
			continue;
			
		var unitsInBase = getUnitsInBase(b[baseIndex], myGuys);
		if (unitsInBase.length<5)
		{
			ownedBasesNeedingMore.push(b[baseIndex]);
		}
		
		for (var i=0;i<Math.min(5,unitsInBase.length);i++)
		{		
			var unit=unitsInBase[i];
			farmingUnits.push(unit);
			
			var mark = enemyInRange(unit, enemies);
			if(mark>0)
			{
				orders.push( {"unitID" : unit.id, "move" : "", "dash" : "", "attack" : mark, "farm" : false} );
			}
			else
			{
				mark = closestEnemy(unit, enemies, b[0].R);
				if(mark>0)
				{
					var dir = getDir( unit.locx, unit.locy, mark.locx, mark.locy );
					orders.push( {"unitID" : unit.id, "move" : dir, "dash" : dir, "attack" : "", "farm" : false} );
				}		
				else
				{
					orders.push( {"unitID" : unit.id, "move" : "", "dash" : "", "attack" : "", "farm" : true} );
				}
			}
		}
	}
	
	for (var i = 0;i<myGuys.length;i++)
	{
		var unit=myGuys[i];
		
		var unitIsFarming=0;
		for (var j = 0; j<farmingUnits.length;j++)
		{
			var farmingUnit=farmingUnits[j];
			if (farmingUnit.id==unit.id)
			{
				unitIsFarming=1;
				break;
			}	
		}
		if (unitIsFarming==1)
			continue;
			
			
		var mark = enemyInRange(unit, enemies);
		if(mark>0)
		{
			orders.push( {"unitID" : unit.id, "move" : "", "dash" : "", "attack" : mark, "farm" : false} );
			continue;
		}

			
		mark = closestEnemy(unit, enemies, b[0].R*2);
		if(mark>0)
		{
			var dir = getDir( unit.locx, unit.locy, mark.locx, mark.locy );
			orders.push( {"unitID" : unit.id, "move" : dir, "dash" : dir, "attack" : "", "farm" : false} );
			continue;
		}		
			
		var nextOpenBase = closestOpenBase(b,unit.locx, unit.locy);
		
		if (ownedBasesNeedingMore.length>0)
		{
			var baseToMoveTo=ownedBasesNeedingMore[0];
			var dir = getDir( unit.locx, unit.locy, baseToMoveTo.locx, baseToMoveTo.locy );
			orders.push( {"unitID" : unit.id, "move" : dir, "dash" : dir, "attack" : "", "farm" : false} );
		}		
		else if (nextOpenBase != -1)
		{
			var dir = getDir( unit.locx, unit.locy, nextOpenBase.locx, nextOpenBase.locy );
			orders.push( {"unitID" : unit.id, "move" : dir, "dash" : dir, "attack" : "", "farm" : false} );
		}
		else//attack!
		{
			var mark = closestEnemy(unit, enemies, 1000000000);
			if (mark!=-1)
			{
				var dir = getDir( unit.locx, unit.locy, mark.locx, mark.locy );
				orders.push( {"unitID" : unit.id, "move" : dir, "dash" : dir, "attack" : "", "farm" : false} );	
			}
		}
	}
	
	
	//post message back to AI Manager
	postMessage( { "Orders" : orders } );	
}
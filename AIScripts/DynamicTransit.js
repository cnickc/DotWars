/*
 "DynamicTransit"
 by Simon Parent
 */
var msg = [];
var ID;
var base = -1;
var infinity = 1.0 / 0.0;

onmessage = function ( ev ) {
    for( var cmd in ev.data ) {
        switch( cmd ) {
            case "setID":
                //used so I can identify which
                //units the game has classified as 'mine'
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

// Utility functions.
enemyInRange = function( me, them, r ) {
    targetLife = infinity;
    target = -1;
    for( var i = 0;  i < them.length; i++ ) {
        if( them[i].health <= 0 ) {
            continue;
        }
        var x = me.locx - them[i].locx;
        var y = me.locy - them[i].locy;
        if( x*x + y*y < r*r && them[i].health < targetLife ) {
            targetLife = them[i].health;
            target = them[i];
        }
    }
    return target;
};
enemyInRange2 = function( myGuys, them ) {
    best = infinity;
    target = -1;
    for( var i = 0;  i < them.length; i++ ) {
        if( them[i].health <= 0 ) {
            continue;
        }
        closest = infinity;
        for(var k=0; k<myGuys.length; k++) {
            d = distance_sq(myGuys[k], them[i]);
            if(d < closest)
                closest = d;
        }
        score = them[i].friends;
        if(score < best) {
            best = score;
            target = them[i];
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
    return "left";
};

distance_sq = function(thing1, thing2) {
    var x = thing1.locx - thing2.locx;
    var y = thing1.locy - thing2.locy;
    return x * x + y * y;
}

IsUnitInBase = function ( unit, base ) {
    var x = base.locx - unit.locx;
    var y = base.locy - unit.locy;
    if ( x*x + y*y < base.R*base.R ) {
        return true;
    }
    return false;
};

atHome = function(guy, b) {
    for(var i=0; i<b.length; i++) {
        if(IsUnitInBase(guy, b[i])) {
            return true;
        }
    }
    return false;
};

//create new orders for my units
dataResponse = function ( ev ) {
    //sort through given data
    orders = [];
    myGuys = [];
    enemies = [];
    u = ev.data["Data"].units;
    b = ev.data["Data"].bases;
    
    whichmap = 0;
    if(b.length == 7) {
        if(b[1].locx == 460 && b[1].locy == 40)
            whichmap = 1;
        if(b[1].locx == 100 && b[1].locy == 40)
            whichmap = 2;
    }

    for( var i = 0; i < u.length; i++ ) {
        if( u[i].allegiance == this.ID ) {
            myGuys.push( u[i] );
        } else {
            enemies.push( u[i] );
        }
        u[i].friends = 0;
        for( var j = 0; j < u.length; j++ ) {
            if(u[j].allegiance == u[i].allegiance) {
                if(distance_sq(u[i], u[j]) < 40 * 40) {
                    u[i].friends += 1;
                }
            }
        }
    }

    myBases = [];
    neutralBases = [];
    enemyBases = [];
    for( var i = 0; i < b.length; i++ ) {
        if( b[i].allegiance == this.ID) {
            myBases.push(b[i]);
            b[i].type = 'mine';
        } else if( b[i].allegiance == -1 ) {
            neutralBases.push(b[i]);
            b[i].type = 'neutral';
        } else {
            enemyBases.push(b[i]);
            b[i].type = 'enemy';
        }
    }
    basedistance = function(b) {
        var ret = 0;
        for( var i = 0; i < myGuys.length; i++ ) {
            ret += distance_sq(b, myGuys[i]);
        }
        return ret;
    }
    basesort = function(b1, b2) {
        return basedistance(b1) - basedistance(b2);
    }
    neutralBases.sort(basesort);
    enemyBases.sort(basesort);
    sortedBases = [];
    sortedBases = sortedBases.concat(myBases);
    sortedBases = sortedBases.concat(neutralBases);
    // sortedBases = sortedBases.concat(enemyBases);

    // Decide how to allocate my guys.
    // This is the key.
    targets = [];
    expand = [2, 4, 4, 4, 4, 4, 4, 4, 4];
    if(whichmap == 1) {
        expand = [2, 4, 4, 4, 4, 4, 4, 4, 4];
        if(myGuys.length >= 8)
            expand[0] = 4;
    }
    if(whichmap == 2) {
        expand = [4, 4, 4, 4, 4, 4, 4, 4, 4];
    }
    for(var i=0; i<sortedBases.length; i++) {
        base = sortedBases[i];
        left = myGuys.length - targets.length;
        to_send = Math.max(0, Math.min(expand[i], left));
        if(base.type == 'enemy' && to_send < 3) {
            continue;
        }
        for(var j=0; j<to_send; j++) {
            targets.push(base);
            base.occupied = true;
        }
    }
    left = myGuys.length - targets.length;
    enemyscore = function(them) {
        closest = infinity;
        for(var k=0; k<myGuys.length; k++) {
            d = distance_sq(myGuys[k], them);
            if(d < closest)
                closest = d;
        }
        return them.friends * 100 + closest;
    }
    enemycompare = function(a, b) {
        return enemyscore(a) - enemyscore(b);
    }
    enemies.sort(enemycompare);
    for(var i=0; i<enemies.length; i++) {
        minstr = enemies[i].friends;
        //maxstr = enemies[i].friends + 3;
        maxstr = 9;
        if(left < minstr)
            break;
        if(enemies[i].locx < -50)
            continue;
        if(enemies[i].locy < -50)
            continue;
        if(enemies[i].locx > 550)
            continue;
        if(enemies[i].locy > 550)
            continue;
        for(var j=0; j<maxstr; j++) {
            left = myGuys.length - targets.length;
            if(left > 0) {
                targets.push(enemies[i]);
            }
        }
    }
    while(left > 0) {
        left = myGuys.length - targets.length;
        for(var i=0; i<sortedBases.length; i++) {
            base = sortedBases[i];
            if(base.occupied) {
                targets.push(base);
            }
        }
    }

    // Decide where each guy is going.
    for( var i = 0; i < myGuys.length; i++ ) {
        myGuys[i].tx = -999;
    }
    for( var j = 0; j < myGuys.length; j++ ) {
        // Find the best guy for this order.
        target = targets[j];
        winner = -1;
        best = infinity;
        for( var i = 0; i < myGuys.length; i++ ) {
            if(myGuys[i].tx != -999)
                continue;
            dist = distance_sq(myGuys[i], target);
            if(dist < best) {
                winner = i;
                best = dist;
            }
        }
        myGuys[winner].tx = target.locx + 10;
        myGuys[winner].ty = target.locy;
    }

    // Go somewhere.
    // Automatically decide on attack/farm/dash based on your surroundings.
    thatguy = false;
    for( var i = 0; i < myGuys.length; i++ ) {
        var nearby = enemyInRange( myGuys[i], enemies, 30 );
        if(nearby.id > 0) {
            myGuys[i].tx = nearby.locx;
            myGuys[i].ty = nearby.locy;
        }
        var mark = enemyInRange( myGuys[i], enemies, myGuys[i].atkRadius );
        order = {};
        order['unitID'] = myGuys[i].id;
        order['move'] = getDir(myGuys[i].locx, myGuys[i].locy,
                               myGuys[i].tx, myGuys[i].ty);
        if(nearby.friends > myGuys[i].friends) {
            order['move'] = getDir(
                myGuys[i].tx, myGuys[i].ty,
                myGuys[i].locx, myGuys[i].locy);
        }
        if( mark.id > 0 ) {
            // Defending yourself is the most important.
            order['attack'] = mark.id;
        } else if (atHome(myGuys[i], b)) {
            order['farm'] = 'yup';
        } else {
            order['dash'] = order['move'];
        }
        if(!thatguy) {
            if(myGuys[i].health < 2) {
                thatguy = true;
                order = {};
                order['unitID'] = myGuys[i].id;
                order['move'] = 'left';
                order['dash'] = 'left';
            }
        }
        orders.push(order);
    }

    // Done!
    postMessage( { "Orders" : orders } );
}

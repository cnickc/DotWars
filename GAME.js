/*****************************************************************************************
 * Config Settings
 ****************************************************************************************/
var fps = 40;
var delay = 1000/fps;
var gameLength = 3000;

var players = 4;
var playerList = [ "Alpha", "Beta", "Gamma", "Delta", "DynamicTransit", 
	"TheFriendlyOverlord", "Swag", "Creative","Hive","Insanity","BlackDeath",
	"Phi","CatUnicornLazerBeam" ];
var playerColors = ["#FF0000", "#00FF00", "#0000FF", "#FF00FF"];
var startingNumberOfUnits = 4;

var mapList = [];
var maxUnitsPerBaseOwned = 10;

/*****************************************************************************************
 * Game Globals (do not touch)
 ****************************************************************************************/
var points = [];
var bases = [];
var units = [];
var IDctr = 1;

/*****************************************************************************************
 * Gameplay Logic
 ****************************************************************************************/
//initialize points array
var scorePanel = document.getElementById('scorePanel');
for( var i = 0; i < players; i++ ){
	points[i]=0;
	scorePanel.innerHTML = scorePanel.innerHTML + 
		'<div id="player'+ i +'score" style="color:'+playerColors[i]+';" class="playerScoreTile glossy"></div>';
}

//initialize randomized players list
var gamePlayers = shuffle( playerList ).slice(0, players);
						
//Load Map
var mg = new MapGenerator( players );
var bases = mg.Generate();
			
//Create Units
units[0] = new Unit( -1, -1, -1, -1 ); // dummy unit
for( var i = 0; i < players; i++ ) {
	bases[i].SetAllegiance( i );
	for( var j = 0; j < startingNumberOfUnits; j++ ) {
		units[IDctr] = ( new Unit( bases[i].locx, bases[i].locy, i, IDctr ) );
		IDctr++;
	}
}
			
//Handler for AI messages and unit orders
var aiManager = new Worker('AIMANAGER.js');
aiManager.onmessage = function ( ev ) {
	var orders = [];
	var ordered = [];
	//loop through orders
	if( ev.data["Orders"] ) {
		orders = ev.data["Orders"];
	}
	
	for( var i = 0; i < orders.length; i++ ) {			
		var state = 0;
		var id = orders[i].unitID;
		//check if unit exists first
		if( !units[id] || units[id].health <= 0 || ordered[id]) {
			continue;
		}
		
		ordered[id] = true;
												
		//move
		if( orders[i].move ) {
			unitMove( id, orders[i].move );
			state = 1;
		}
							
		//run 
		if( orders[i].dash ) {
			unitMove( id, orders[i].dash );
			state = 1;
			continue;
		}
		
		//farm
		if( orders[i].farm ) {
			for( var j = 0; j < bases.length; j++ ) {
				if( bases[j].allegiance == units[id].allegiance ) {
					units[id].Farm( bases[j] );
				}
			}
			continue;
		}
		
		//attack
		if( orders[i].attack ) {
			if( units[orders[i].attack] && units[orders[i].attack].health > 0) {
				if( units[orders[i].attack].allegiance == units[id].allegiance ) {
					points[units[id].allegiance] -= 10; //suicide deterrent
					continue;
				}
				units[id].Attack( units[orders[i].attack] );
				if( units[orders[i].attack].health <= 0 ) {
					points[units[id].allegiance] += 10;
				}
			}
			continue;
		}
	}
	
	for( var i = 0; i < units.length; i++ ) {
		if( units[i] ) {
			units[i].atkReload--;
		}
	}
	
}

/*****************************************************************************************
 * Gameplay Utility Functions
 ****************************************************************************************/
//Shuffles the order of an array of objects
function shuffle(o){ 
	for( var j, x, i = o.length; 
		i; 
		j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x
	);
	return o;
};

//Relocates unit based on movement string
function unitMove( id, dir ) {
	switch( dir ) {
		case "up":
			units[id].locy--;
			break;
		case "left":
			units[id].locx--;
			break;
		case "right":
			units[id].locx++;
			break;
		case "down":
			units[id].locy++;
			break;
	}			
};

//Inspects all bases for allegiance changes
function checkBases () {
	for( var i = 0; i < bases.length; i++ ) {
		if( !isOccupiedByOwner( bases[i], units ) ){
			bases[i].SetAllegiance( -1 );
		}
		
		if( bases[i].allegiance == -1 ) {
			bases[i].SetAllegiance( greatestOccupancy( bases[i], units ) );
		}
		
		if( bases[i].farmTotal >= 1 ) {
			if( basesOwned( bases, bases[i].allegiance )*maxUnitsPerBaseOwned 
				> unitsOwned( units, bases[i].allegiance ) ) {
				units[IDctr] = 
					new Unit( bases[i].locx, bases[i].locy, bases[i].allegiance, IDctr );
				IDctr++;
				points[bases[i].allegiance]++;
			}	
			bases[i].farmTotal = 0;					
		}
		
		if( bases[i].allegiance >= 0 ) {
			points[bases[i].allegiance] += 0.02;
		}
	}
};

//does this base still have an allied unit in it?
function isOccupiedByOwner( b, u ) {
	for( var i = 0; i < u.length; i++ ) {
		if( u[i].health <= 0 ) {
			continue;
		}
		if( b.allegiance == u[i].allegiance ) {
			if( (u[i].locx - b.locx)*(u[i].locx - b.locx)
				+ (u[i].locy - b.locy)*(u[i].locy - b.locy) < b.R*b.R ) {
				return true; //base still occupied by owner.
			}
		}
	}
	return false;
};

//which army has the most units in this base?  return -1 for no units or tied max units
function greatestOccupancy( b, u ) {
	var count = [];
	var maxVal = -1;
	var max = 0;
	for( var i = 0; i < u.length; i++ ) {
		if( u[i] && b.IsUnitInBase( u[i] ) ) {
			if( !count[u[i].allegiance] ) {
				count[u[i].allegiance] = 0;
			}
			count[u[i].allegiance]++;
			if( count[u[i].allegiance] > max ) {
				maxVal = u[i].allegiance;
				max = count[u[i].allegiance];
			} else if ( count[u[i].allegiance] == max ) {
				maxVal = -1;
			}
		}
	}
	return maxVal;
};

//count how many bases are owned by a particular army
function basesOwned( b, allegiance ) {
	var ctr = 0;
	for( var i = 0; i < b.length; i++ ){
		if( b[i].allegiance == allegiance ) {
			ctr++;
		}
	}
	return ctr;
};

//count how many units are owned by a particular army
function unitsOwned( u, allegiance ) {
	var ctr = 0;
	for( var i = 0; i < u.length; i++ ){
		if( u[i].allegiance == allegiance && u[i].health > 0 ) {
			ctr++;
		}
	}
	return ctr;
};

/*****************************************************************************************
 * Renderer Functions
 ****************************************************************************************/
function drawCanvas() {
	var c = document.getElementById("GameCanvas");
	var ctx = c.getContext("2d");
	ctx.clearRect(0,0,500,500);

	//draw bases
	ctx.fillStyle = "#888888";
	ctx.globalAlpha = 0.4;
	for( var i = 0; i < bases.length; i++ ) {
		ctx.beginPath();
		ctx.arc(bases[i].locx,bases[i].locy,bases[i].R,0,2*Math.PI);
		ctx.fill();
		ctx.lineWidth = 3;
		ctx.strokeStyle = bases[i].allegiance >= 0 ? 
			playerColors[bases[i].allegiance] : '#000';
		ctx.stroke();
	}
	
	//draw farming indicator
	ctx.fillStyle = "#005500";
	ctx.globalAlpha = 0.4;
	for( var i = 0; i < bases.length; i++ ) {
		ctx.beginPath();
		ctx.arc(bases[i].locx,bases[i].locy,bases[i].R*bases[i].farmTotal,0,2*Math.PI);
		ctx.fill();
	}
	
	//draw units
	ctx.globalAlpha = 1.0;
	for( var i = 0; i < units.length; i++ ) {
		if( !units[i] ) {
			continue;
		}
		if( units[i].health <= 0 ){
			ctx.fillStyle = '#FFFFFF';						
		} else {
			ctx.fillStyle = playerColors[units[i].allegiance];
		}
		ctx.beginPath();
		ctx.arc(units[i].locx,units[i].locy,5,0,2*Math.PI);
		ctx.fill();
	}
};

function drawScore ( t ) {
	if( t % 10 != 0 ) {
		return;
	}
	updateTimer(timer);
	//determine ranking
	var rank = [];
	for( var i = 0; i < points.length; i++ ) {
		rank.push({"p":i,"s":points[i]});
	}
	rank.sort(function(a, b){ return b.s - a.s });
	for( var i = 0; i < points.length; i++ ) {
		var playerScoreBox = document.getElementById('player'+i+'score');
		playerScoreBox.innerHTML = gamePlayers[i] + ":  " 
			+ parseFloat(points[i]).toFixed(2) 
			+ " --- " 
			+ unitsOwned( units, i ) 
			+ " / " 
			+ basesOwned( bases, i)*maxUnitsPerBaseOwned;
		var trans = getRankSpot(rank, i)*1.75;
		playerScoreBox.style.transform = "translate(0,"+trans+"em)";
		playerScoreBox.style.transition = "100ms ease-in";
	}
};

function getRankSpot(rank, p) {
	for( var i = 0; i < rank.length; i++ ) {
		if(rank[i].p == p)
			return i;
	}
	return -1;
};

function updateTimer( t ) {
	var tbox = document.getElementById('gameTimer');
	tbox.style.width = 500*t/gameLength + 'px';
	tbox.style.backgroundColor = "rgb("+(255-255*t/gameLength)+","+(255*t/gameLength)+",0)";
};

/*****************************************************************************************
 * Gameplay
 ****************************************************************************************/
//Load the AI scripts for this scrimmage
aiManager.postMessage( { "LoadAI" : gamePlayers } );

//initialize postMessage data for AI Manager
var gameData = {};
gameData["bases"] = bases;
gameData["units"] = units;	
var timer = gameLength;	
			
//Main data and animation loop	
var gameInterval = setInterval( function () {
	if ( timer <= 0 ) {
		clearInterval( gameInterval );
	}
	checkBases();
	drawCanvas();
	drawScore(timer);
	aiManager.postMessage( { "Data" : gameData } );
	timer--;
}, delay);


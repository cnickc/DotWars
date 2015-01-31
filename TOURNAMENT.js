var players = 2;
var stats = {};
StartGame = {};	//cancel StartGame function to prevent double-gameplay
var runTournament = false;


//initialize stats
for( var i = 0; i < playerList.length; i++ ) {
	stats[playerList[i]] = {};
	for( var j = 0; j < playerList.length; j++ ) {
		stats[playerList[i]][playerList[j]] = {
			"wins" : 0,
			"losses" : 0,
			"avgScoreFor" : 0,
			"avgScoreAgainst" : 0
		};
	}
}


/*****************************************************************************************
 * Gameplay Logic
 ****************************************************************************************/
//initialize points array
function collectStats( players, score ) {
	var p1 = stats[players[0]][players[1]];
	var p2 = stats[players[1]][players[0]];
	var s1 = score[0].toFixed(2);
	var s2 = score[1].toFixed(2);
	
	if ( parseFloat(s1) > parseFloat(s2) ) {
		var tg = p1.wins + p1.losses;
		p1.wins++;
		p2.losses++;
	} else {
		var tg = p1.wins + p1.losses;
		p2.wins++;
		p1.losses++;
	}
	p1.avgScoreFor = p1.avgScoreFor/(tg+1) + s1/(tg+1);
	p1.avgScoreAgainst = p1.avgScoreAgainst/(tg+1) + s2/(tg+1);
	p2.avgScoreFor = p2.avgScoreFor/(tg+1) + s2/(tg+1);
	p2.avgScoreAgainst = p2.avgScoreAgainst/(tg+1) + s1/(tg+1);
	
};

function StartTournament() {
	runTournament = true;
	StartTournamentGame();
};

function StopTournament() {
	runTournament = false;
}

function nextGame() {
	setTimeout( function () {
		if(runTournament)
			StartTournamentGame();
		console.log(stats);
	},
	5000);
};

function StartTournamentGame() {
	if( aiManager.terminate ) {
		aiManager.postMessage( { "Terminate" : "" } );
		aiManager = {};
	}
	if( gameInterval ) {
		clearInterval( gameInterval );
	}

	//initialize randomized players list
	var gamePlayers = shuffle( playerList ).slice(0, players);

	InitializeGame();

	//Load the AI scripts for this scrimmage
	aiManager = new Worker('AIMANAGER.js');
	aiManager.onmessage = AIManagerOnMessage;
	aiManager.postMessage( { "LoadAI" : gamePlayers } );

	//initialize postMessage data for AI Manager
	var gameData = {};
	gameData["bases"] = bases;
	gameData["units"] = units;	
	var timer = gameLength;	
			
	//Main data and animation loop	
	gameInterval = setInterval( function () {
		if ( timer <= 0 ) {
			aiManager.postMessage( { "Terminate" : "" } );
			clearInterval( gameInterval );
			collectStats( gamePlayers, points);
			nextGame();
		}
		checkBases();
		drawCanvas();
		drawScore(timer, gamePlayers);
		aiManager.postMessage( { "Data" : gameData } );
		timer--;
	}, delay);
}

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
CreateTournamentMatrix( playerList );

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

function CreateTournamentMatrix( pList ) {
	var container = document.getElementById("tournamentMatrix");
	var contentString = "";
	contentString += "<table border='1'>";
	
	//header row
	contentString += "<tr>";
		contentString += "<td></td>";
		for( var i = 0; i < pList.length; i++ ) {
			contentString += "<td>" + pList[i] + "</td>";
		}
	contentString += "</tr>";
	
	//body rows
	for( var i = 0; i < pList.length; i++ ) {
		contentString += "<tr>";
		contentString += "<td>" + pList[i] + "</td>";
		for( var j = 0; j < pList.length; j++ ) {
			contentString += "<td><div id='" + pList[i] + "@" + pList[j] + "'></div></td>";
		}
		contentString += "</tr>";
	}
	contentString += "</table>";
	container.innerHTML = contentString;
}

function UpdateTournamentScores(players) {
	var m1 = document.getElementById(players[0]+"@"+players[1]);
	var m2 = document.getElementById(players[1]+"@"+players[0]);
	var p1 = stats[players[0]][players[1]];
	var p2 = stats[players[1]][players[0]];
	m1.innerHTML = "W: "+p1.wins+"<br />"+
						"L: "+p1.losses+"<br />"+
						"Avg Diff:<br />&nbsp;&nbsp;"+(p1.avgScoreFor-p1.avgScoreAgainst);
	m2.innerHTML = "W: "+p2.wins+"<br />"+
						"L: "+p2.losses+"<br />"+
						"Avg Diff:<br />&nbsp;&nbsp;"+(p2.avgScoreFor-p2.avgScoreAgainst);
	if((p1.avgScoreFor-p1.avgScoreAgainst) > 100) {
		m1.className = "g3";
		m2.className = "r3";
	} else if ((p1.avgScoreFor-p1.avgScoreAgainst) > 50) {
		m1.className = "g2";
		m2.className = "r2";
	} else if ((p1.avgScoreFor-p1.avgScoreAgainst) > 10) {
		m1.className = "g1";
		m2.className = "r1";
	} else if ((p1.avgScoreFor-p1.avgScoreAgainst) > -10) {
		m1.className = "m1";
		m2.className = "m1";
	} else if ((p1.avgScoreFor-p1.avgScoreAgainst) > -50) {
		m1.className = "r1";
		m2.className = "g1";
	} else if ((p1.avgScoreFor-p1.avgScoreAgainst) > -100) {
		m1.className = "r2";
		m2.className = "g2";
	} else {
		m1.className = "r3";
		m2.className = "g3";
	}

}

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
			UpdateTournamentScores(gamePlayers);
			nextGame();
		}
		checkBases();
		drawCanvas();
		drawScore(timer, gamePlayers);
		aiManager.postMessage( { "Data" : gameData } );
		timer--;
	}, delay);
}

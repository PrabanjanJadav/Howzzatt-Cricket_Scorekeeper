const matchData = {
    team1: "",
    team2: "",
    tossWinner: "",
    tossDecision: "",
    battingTeam: "",
    bowlingTeam: "",
    innings: 1,
    totalOvers: 2,
    currentOver: 0,
    currentBall: 0,
    legalDeliveriesInOver: 0,
    totalRuns: 0,
    totalWickets: 0,
    batsmen: [],
    bowlers: [],
    currentStriker: null,
    currentNonStriker: null,
    currentBowler: null,
    extras: {
        wides: 0,
        noballs: 0,
        byes: 0,
        legbyes: 0
    },
    commentary: [],
    firstInningsScore: 0,
    firstInningsWickets: 0,
    firstInningsOvers: 0
};

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('startMatch')) {
        document.getElementById('startMatch').addEventListener('click', startMatch);
    }
    
    if (document.getElementById('livePage')) {
        initializeLivePage();
    }
    
    if (document.getElementById('scorecardPage')) {
        initializeScorecardPage();
    }
    
    if (document.getElementById('summaryPage')) {
        initializeSummaryPage();
    }

    window.addEventListener('beforeunload', saveMatchData);
});

function startMatch() {
    const team1 = document.getElementById('team1')?.value?.trim();
    const team2 = document.getElementById('team2')?.value?.trim();
    const tossWinner = document.getElementById('tossWinner')?.value?.trim();
    const tossDecision = document.getElementById('tossDecision')?.value?.trim();

    if (!team1 || !team2 || !tossWinner || !tossDecision) {
        alert('Please fill in all match setup fields.');
        return;
    }
    if (team1 === team2) {
        alert('Team names must be different.');
        return;
    }
    if (!['team1', 'team2'].includes(tossWinner)) {
        alert('Invalid toss winner selection.');
        return;
    }
    if (!['bat', 'field'].includes(tossDecision)) {
        alert('Invalid toss decision.');
        return;
    }

    matchData.team1 = team1;
    matchData.team2 = team2;
    matchData.tossWinner = tossWinner;
    matchData.tossDecision = tossDecision;

    if (tossWinner === 'team1') {
        matchData.battingTeam = tossDecision === 'bat' ? team1 : team2;
        matchData.bowlingTeam = tossDecision === 'bat' ? team2 : team1;
    } else {
        matchData.battingTeam = tossDecision === 'bat' ? team2 : team1;
        matchData.bowlingTeam = tossDecision === 'bat' ? team1 : team2;
    }

    saveMatchData();
    window.location.href = 'live.html';
}

function initializeLivePage() {
    loadMatchData();
    
    if (matchData.currentStriker === null) {
        setupInitialPlayers();
    }
    
    updateLiveDisplay();
    setupLiveButtons();
}

function setupInitialPlayers() {
    let striker, nonStriker, bowler;
    do {
        striker = prompt(`Enter first batsman for ${matchData.battingTeam}:`)?.trim();
        if (!striker) alert('Batsman name cannot be empty.');
    } while (!striker);

    do {
        nonStriker = prompt(`Enter second batsman for ${matchData.battingTeam}:`)?.trim();
        if (!nonStriker) alert('Batsman name cannot be empty.');
        if (nonStriker === striker) alert('Batsmen names must be different.');
    } while (!nonStriker || nonStriker === striker);

    do {
        bowler = prompt(`Enter first bowler for ${matchData.bowlingTeam}:`)?.trim();
        if (!bowler) alert('Bowler name cannot be empty.');
    } while (!bowler);

    matchData.currentStriker = createBatsman(striker);
    matchData.currentNonStriker = createBatsman(nonStriker);
    matchData.currentBowler = createBowler(bowler);

    matchData.batsmen.push({ ...matchData.currentStriker });
    matchData.batsmen.push({ ...matchData.currentNonStriker });
    matchData.bowlers.push({ ...matchData.currentBowler });

    saveMatchData();
}

function createBatsman(name) {
    return {
        name: name,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        out: false
    };
}

function createBowler(name) {
    return {
        name: name,
        overs: 0,
        balls: 0,
        maidens: 0,
        runs: 0,
        runsInOver: 0,
        wickets: 0
    };
}

function setupLiveButtons() {
    document.getElementById('runs0')?.addEventListener('click', () => addRuns(0));
    document.getElementById('runs1')?.addEventListener('click', () => addRuns(1));
    document.getElementById('runs2')?.addEventListener('click', () => addRuns(2));
    document.getElementById('runs3')?.addEventListener('click', () => addRuns(3));
    document.getElementById('runs4')?.addEventListener('click', () => addRuns(4));
    document.getElementById('runs6')?.addEventListener('click', () => addRuns(6));
    document.getElementById('wicket')?.addEventListener('click', addWicket);
    document.getElementById('wide')?.addEventListener('click', () => addExtra('wide'));
    document.getElementById('noball')?.addEventListener('click', () => addExtra('noball'));
    document.getElementById('bye')?.addEventListener('click', () => addExtra('bye'));
    document.getElementById('legbye')?.addEventListener('click', () => addExtra('legbye'));
    document.getElementById('goToScorecard')?.addEventListener('click', () => {
        saveMatchData();
        try {
            window.location.href = 'scorecard.html';
        } catch (e) {
            console.error('Error navigating to scorecard:', e);
            alert('Failed to open scorecard. Please try again.');
        }
    });
}

function addRuns(runs) {
    matchData.currentStriker.runs += runs;
    matchData.currentStriker.balls++;
    
    if (runs === 4) matchData.currentStriker.fours++;
    if (runs === 6) matchData.currentStriker.sixes++;
    
    matchData.currentBowler.runs += runs;
    matchData.currentBowler.runsInOver += runs;
    matchData.currentBowler.balls++;
    
    matchData.totalRuns += runs;
    matchData.currentBall++;
    matchData.legalDeliveriesInOver++;
    
    if (matchData.legalDeliveriesInOver === 6) {
        completeOver();
    }
    
    if (runs % 2 !== 0) {
        rotateStrike();
    }
    
    addCommentary(`${matchData.currentOver}.${matchData.currentBall} ${matchData.currentBowler.name} to ${matchData.currentStriker.name}, ${runs} run${runs !== 1 ? 's' : ''}`);
    
    checkInningsCompletion();
    syncBatsmen();
    syncBowler();
    saveMatchData();
    updateLiveDisplay();
}

function addExtra(type) {
    let runs = 0;
    if (type === 'wide' || type === 'noball') {
        runs = 1;
        matchData.extras[type + 's']++;
        matchData.totalRuns += runs;
        matchData.currentBowler.runs += runs;
        matchData.currentBowler.runsInOver += runs;
       
    } else {
        runs = prompt(`Enter runs for ${type}:`) || 0;
        runs = parseInt(runs);
        if (isNaN(runs) || runs < 0) runs = 0;
        matchData.extras[type + 's'] += runs;
        matchData.totalRuns += runs;
        matchData.currentBowler.balls++;
        matchData.currentBall++;
        matchData.legalDeliveriesInOver++;
    }
    
    addCommentary(`${matchData.currentOver}.${matchData.currentBall} ${matchData.currentBowler.name} to ${matchData.currentStriker.name}, ${type.toUpperCase()}${runs > 0 ? ` + ${runs}` : ''}`);
    
    if (matchData.legalDeliveriesInOver === 6) {
        completeOver();
    }
    
    checkInningsCompletion();
    syncBowler();
    saveMatchData();
    updateLiveDisplay();
}

function completeOver() {
    if (matchData.currentBowler.runsInOver === 0) {
        matchData.currentBowler.maidens++;
    }
    
    matchData.legalDeliveriesInOver = 0;
    matchData.currentBall = 0;
    matchData.currentOver++;
    matchData.currentBowler.overs++;
    matchData.currentBowler.balls = 0;
    matchData.currentBowler.runsInOver = 0;
    
    rotateStrike();
    
    if (shouldChangeBowler()) {
        changeBowler();
    }
    
    if (matchData.currentOver === matchData.totalOvers && matchData.innings === 1) {
        switchInnings();
    }
}

function rotateStrike() {
    const temp = matchData.currentStriker;
    matchData.currentStriker = matchData.currentNonStriker;
    matchData.currentNonStriker = temp;
}

function shouldChangeBowler() {
    return (matchData.innings === 1 && matchData.currentOver < matchData.totalOvers) ||
           (matchData.innings === 2 && matchData.currentOver < matchData.totalOvers && 
            matchData.totalRuns <= matchData.firstInningsScore);
}

function changeBowler() {
    let newBowler;
    const maxOversPerBowler = Math.ceil(matchData.totalOvers / 5);
    do {
        newBowler = prompt(`Enter next bowler for ${matchData.bowlingTeam}:`)?.trim();
        if (!newBowler) {
            alert('Bowler name cannot be empty.');
            continue;
        }
        const existingBowler = matchData.bowlers.find(b => b.name === newBowler);
        if (existingBowler && existingBowler.overs >= maxOversPerBowler) {
            alert(`${newBowler} has already bowled their maximum of ${maxOversPerBowler} overs.`);
            newBowler = null;
        }
    } while (!newBowler);

    matchData.currentBowler = createBowler(newBowler);
    matchData.bowlers.push({ ...matchData.currentBowler });
}

function addWicket() {
    matchData.currentStriker.out = true;
    matchData.totalWickets++;
    matchData.currentBowler.wickets++;
    matchData.currentBowler.balls++;
    matchData.currentBall++;
    matchData.legalDeliveriesInOver++;
    
    addCommentary(`${matchData.currentOver}.${matchData.currentBall} ${matchData.currentBowler.name} to ${matchData.currentStriker.name}, OUT!`);
    
    if (shouldCompleteInningsAfterWicket()) {
        checkInningsCompletion();
    } else {
        addNewBatsman();
    }
    
    if (matchData.legalDeliveriesInOver === 6) {
        completeOver();
    }
    
    syncBatsmen();
    syncBowler();
    saveMatchData();
    updateLiveDisplay();
}

function shouldCompleteInningsAfterWicket() {
    return matchData.totalWickets === 10 || 
           (matchData.currentOver === matchData.totalOvers && matchData.legalDeliveriesInOver === 6) ||
           (matchData.innings === 2 && matchData.totalRuns > matchData.firstInningsScore);
}

function addNewBatsman() {
    let newBatsman;
    do {
        newBatsman = prompt(`Enter next batsman for ${matchData.battingTeam}:`)?.trim();
        if (!newBatsman) alert('Batsman name cannot be empty.');
        if (matchData.batsmen.some(b => b.name === newBatsman)) {
            alert('Batsman name must be unique.');
        }
    } while (!newBatsman || matchData.batsmen.some(b => b.name === newBatsman));

    matchData.currentStriker = createBatsman(newBatsman);
    matchData.batsmen.push({ ...matchData.currentStriker });
}

function checkInningsCompletion() {
    if (matchData.innings === 1 && isFirstInningsComplete()) {
        recordFirstInnings();
        switchInnings();
    } else if (matchData.innings === 2 && isSecondInningsComplete()) {
        endMatch();
    }
    saveMatchData();
}

function isFirstInningsComplete() {
    return matchData.totalWickets === 10 ||
           (matchData.currentOver === matchData.totalOvers && matchData.legalDeliveriesInOver === 6);
}

function recordFirstInnings() {
    matchData.firstInningsScore = matchData.totalRuns;
    matchData.firstInningsWickets = matchData.totalWickets;
    matchData.firstInningsOvers = matchData.currentOver + (matchData.currentBall / 10);
}

function isSecondInningsComplete() {
    return matchData.totalRuns > matchData.firstInningsScore ||
           matchData.totalWickets === 10 ||
           (matchData.currentOver === matchData.totalOvers && matchData.legalDeliveriesInOver === 6);
}

function switchInnings() {
    recordFirstInnings();
    
    matchData.innings = 2;
    matchData.currentOver = 0;
    matchData.currentBall = 0;
    matchData.legalDeliveriesInOver = 0;
    matchData.totalRuns = 0;
    matchData.totalWickets = 0;
    
    const temp = matchData.battingTeam;
    matchData.battingTeam = matchData.bowlingTeam;
    matchData.bowlingTeam = temp;
    
    matchData.batsmen = [];
    matchData.bowlers = [];
    matchData.currentStriker = null;
    matchData.currentNonStriker = null;
    matchData.currentBowler = null;
    
    setupInitialPlayers();
    
    addCommentary(`Innings break. ${matchData.battingTeam} need ${matchData.firstInningsScore + 1} runs to win.`);
    
    saveMatchData();
    updateLiveDisplay();
}

function endMatch() {
    saveMatchData();
    window.location.href = 'summary.html';
}

function syncBatsmen() {
    matchData.batsmen = matchData.batsmen.map(b => {
        if (b.name === matchData.currentStriker.name) {
            return { ...matchData.currentStriker };
        }
        if (b.name === matchData.currentNonStriker.name) {
            return { ...matchData.currentNonStriker };
        }
        return b;
    });
}

function syncBowler() {
    matchData.bowlers = matchData.bowlers.map(b => {
        if (b.name === matchData.currentBowler.name) {
            return { ...matchData.currentBowler };
        }
        return b;
    });
}

function addCommentary(text) {
    matchData.commentary.push(text);
    saveMatchData();
}

function updateLiveDisplay() {
    if (document.getElementById('matchSummary')) {
        updateMatchSummary();
    } else {
        console.warn('Match summary element not found.');
    }
    if (document.getElementById('strikerRow') && document.getElementById('nonStrikerRow')) {
        updateBatsmenTable();
    } else {
        console.warn('Batsmen table rows not found.');
    }
    if (document.getElementById('bowlerInfo')) {
        updateBowlerInfo();
    } else {
        console.warn('Bowler info element not found.');
    }
    if (document.getElementById('rrr')) {
        updateRequiredRunRate();
    }
}

function updateMatchSummary() {
    const summaryElement = document.getElementById('matchSummary');
    if (matchData.innings === 1) {
        summaryElement.textContent = 
            `${matchData.battingTeam} ${matchData.totalRuns}/${matchData.totalWickets} (${matchData.currentOver}.${matchData.currentBall}) vs ${matchData.bowlingTeam}`;
    } else {
        summaryElement.textContent = 
            `${matchData.battingTeam} ${matchData.totalRuns}/${matchData.totalWickets} (${matchData.currentOver}.${matchData.currentBall}) vs ${matchData.bowlingTeam} ${matchData.firstInningsScore}/${matchData.firstInningsWickets} (${matchData.firstInningsOvers.toFixed(1)})`;
    }
}

function updateBatsmenTable() {
    updateBatsmanRow('strikerRow', matchData.currentStriker);
    updateBatsmanRow('nonStrikerRow', matchData.currentNonStriker);
}

function updateBatsmanRow(rowId, batsman) {
    const row = document.getElementById(rowId);
    if (!row || !batsman) return;
    
    row.cells[0].textContent = batsman.name;
    row.cells[1].textContent = batsman.runs;
    row.cells[2].textContent = batsman.balls;
    row.cells[3].textContent = batsman.fours;
    row.cells[4].textContent = batsman.sixes;
    row.cells[5].textContent = batsman.balls > 0 
        ? ((batsman.runs / batsman.balls) * 100).toFixed(2)
        : '0.00';
}

function updateBowlerInfo() {
    const bowlerInfo = document.getElementById('bowlerInfo');
    if (!bowlerInfo || !matchData.currentBowler) return;
    
    const bowler = matchData.currentBowler;
    const totalBalls = bowler.overs * 6 + bowler.balls;
    
    bowlerInfo.querySelector('.bowler-name').textContent = bowler.name;
    bowlerInfo.querySelector('.overs').textContent = bowler.overs + '.' + bowler.balls;
    bowlerInfo.querySelector('.maidens').textContent = bowler.maidens;
    bowlerInfo.querySelector('.runs').textContent = bowler.runs;
    bowlerInfo.querySelector('.wickets').textContent = bowler.wickets;
    bowlerInfo.querySelector('.economy').textContent = totalBalls > 0 
        ? (bowler.runs / (totalBalls / 6)).toFixed(2)
        : '0.00';
}

function updateRequiredRunRate() {
    if (matchData.innings !== 2) return;
    
    const rrrElement = document.getElementById('rrr');
    if (!rrrElement) return;
    
    const ballsRemaining = (matchData.totalOvers * 6) - (matchData.currentOver * 6 + matchData.currentBall);
    const runsNeeded = matchData.firstInningsScore - matchData.totalRuns + 1;
    
    if (ballsRemaining > 0) {
        rrrElement.textContent = 'RRR: ' + (runsNeeded / (ballsRemaining / 6)).toFixed(2);
    } else {
        rrrElement.textContent = '';
        endMatch();
    }
}

function initializeScorecardPage() {
    loadMatchData();
    updateScorecardDisplay();
    
    const backButton = document.getElementById('backToLive');
    if (backButton) {
        backButton.addEventListener('click', () => {
            try {
                window.location.href = 'live.html';
            } catch (e) {
                console.error('Error navigating back to live:', e);
                alert('Failed to return to live match. Please try again.');
            }
        });
    } else {
        console.warn('Back to live button not found.');
    }
}

function updateScorecardDisplay() {
    const battingBody = document.getElementById('battingScorecardBody');
    const bowlingBody = document.getElementById('bowlingScorecardBody');
    
    if (!battingBody || !bowlingBody) {
        console.error('Scorecard table bodies not found.');
        return;
    }
    
    battingBody.innerHTML = '';
    bowlingBody.innerHTML = '';
    
    if (!matchData.batsmen.length && !matchData.bowlers.length) {
        battingBody.innerHTML = '<tr><td colspan="6">No batting data available.</td></tr>';
        bowlingBody.innerHTML = '<tr><td colspan="6">No bowling data available.</td></tr>';
        return;
    }
    
    updateBattingScorecard();
    updateBowlingScorecard();
}

function updateBattingScorecard() {
    const battingBody = document.getElementById('battingScorecardBody');
    if (!battingBody) return;
    
    matchData.batsmen.forEach(batsman => {
        const row = document.createElement('tr');
        const nameSuffix = batsman.out ? '†' : 
                           (batsman.name === matchData.currentStriker?.name || batsman.name === matchData.currentNonStriker?.name) ? '*' : '';
        
        row.innerHTML = `
            <td>${batsman.name} ${nameSuffix}</td>
            <td>${batsman.runs}</td>
            <td>${batsman.balls}</td>
            <td>${batsman.fours}</td>
            <td>${batsman.sixes}</td>
            <td>${batsman.balls > 0 ? ((batsman.runs / batsman.balls) * 100).toFixed(2) : '0.00'}</td>
        `;
        battingBody.appendChild(row);
    });

    const extrasRow = document.createElement('tr');
    const totalExtras = matchData.extras.wides + matchData.extras.noballs + 
                       matchData.extras.byes + matchData.extras.legbyes;
    extrasRow.innerHTML = `
        <td>Extras (W:${matchData.extras.wides}, NB:${matchData.extras.noballs}, B:${matchData.extras.byes}, LB:${matchData.extras.legbyes})</td>
        <td>${totalExtras}</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
    `;
    battingBody.appendChild(extrasRow);

    const totalRow = document.createElement('tr');
    totalRow.innerHTML = `
        <td>Total</td>
        <td>${matchData.totalRuns}</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
    `;
    battingBody.appendChild(totalRow);
}

function updateBowlingScorecard() {
    const bowlingBody = document.getElementById('bowlingScorecardBody');
    if (!bowlingBody) return;
    
    matchData.bowlers.forEach(bowler => {
        const row = document.createElement('tr');
        const totalBalls = bowler.overs * 6 + bowler.balls;
        
        row.innerHTML = `
            <td>${bowler.name}</td>
            <td>${bowler.overs}.${bowler.balls}</td>
            <td>${bowler.maidens}</td>
            <td>${bowler.runs}</td>
            <td>${bowler.wickets}</td>
            <td>${totalBalls > 0 ? (bowler.runs / (totalBalls / 6)).toFixed(2) : '0.00'}</td>
        `;
        bowlingBody.appendChild(row);
    });
}

function initializeSummaryPage() {
    loadMatchData();
    displayResult();
    document.getElementById('resetMatch')?.addEventListener('click', resetMatch);
}

function displayResult() {
    const resultDiv = document.getElementById('matchResult');
    if (!resultDiv) return;
    
    if (matchData.innings === 2) {
        if (matchData.totalRuns > matchData.firstInningsScore) {
            const ballsRemaining = (matchData.totalOvers * 6) - (matchData.currentOver * 6 + matchData.currentBall);
            const wicketsLeft = 10 - matchData.totalWickets;
            resultDiv.textContent = 
                `${matchData.battingTeam} wins by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''} (${ballsRemaining} ball${ballsRemaining !== 1 ? 's' : ''} remaining)!`;
        } else if (matchData.totalRuns === matchData.firstInningsScore) {
            resultDiv.textContent = "Match tied!";
        } else {
            const runsDifference = matchData.firstInningsScore - matchData.totalRuns;
            resultDiv.textContent = 
                `${matchData.bowlingTeam} wins by ${runsDifference} run${runsDifference !== 1 ? 's' : ''}!`;
        }
    }
}

function resetMatch() {
    localStorage.removeItem('matchData');
    window.location.href = 'index.html';
}

function loadMatchData() {
    const savedData = localStorage.getItem('matchData');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            if (parsedData.team1 && parsedData.team2) {
                Object.assign(matchData, parsedData);
            } else {
                console.warn('Invalid match data, resetting to default.');
            }
        } catch (e) {
            console.error('Error parsing saved match data:', e);
        }
    }
}

function saveMatchData() {
    localStorage.setItem('matchData', JSON.stringify(matchData));
}
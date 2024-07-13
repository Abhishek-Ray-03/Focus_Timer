const timerDuration =  25*60; 
let remainingTime = timerDuration; 
let startTime;
let timerRunning = false;
let intervalId;


function createNotification(message){
    const opt={
    type:'list',
    title:'Timer',
    message,
    items:[{title:'Timer',message:message}],
    iconUrl:'icons/time-48.png'
    };
   chrome.notifications.create(opt);
};

function clearIntervalAndStopTimer() {
    clearInterval(intervalId);
    chrome.alarms.clear('timer');
    timerRunning = false;
}

function setupContextMenu() {
    chrome.contextMenus.create({
        id: 'start-timer',
        title: 'Start Timer',
        contexts: ['all']
    });
    chrome.contextMenus.create({
        id: 'reset-timer',
        title: 'Reset Timer',
        contexts: ['all']
    });
    chrome.action.setBadgeBackgroundColor({ color: 'orange' });
    updateBadge();
}


chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'start-timer') {
        if (!timerRunning) {
            chrome.contextMenus.update('start-timer', {
                title: 'Stop Timer',
                contexts: ['all']
            });
            startTimer();
            createNotification("Your Timer Has Started!");
        } else {
            stopTimer();
            createNotification("Your Timer Has Been Stopped!");
            chrome.contextMenus.update('start-timer', {
                title: 'Start Timer',
                contexts: ['all']
            });
        }
    } else if (info.menuItemId === 'reset-timer') {
        resetTimer();
        createNotification("Timer Has Been Reset!");
        chrome.contextMenus.update('start-timer', {
            title: 'Start Timer',
            contexts: ['all']
        });
    }
});


function startTimer() {
    timerRunning = true;
    startTime = Date.now();
    chrome.storage.sync.get(['remainingTime'], (data) => {
        remainingTime = data.remainingTime !== undefined ? data.remainingTime : timerDuration;
        chrome.alarms.create('timer', { when: Date.now() + remainingTime * 1000 });
        intervalId = setInterval(updateBadge, 1000); // Update badge every second
        updateBadge();
    });
}


function stopTimer() {
    timerRunning = false;
    clearIntervalAndStopTimer();
    remainingTime -= Math.floor((Date.now() - startTime) / 1000);
   if (remainingTime < 0) remainingTime = 0;
    chrome.storage.sync.set({ remainingTime: remainingTime }); 
    updateBadge();
}

function resetTimer() {
    clearIntervalAndStopTimer();
    remainingTime = timerDuration;
    chrome.storage.sync.set({ remainingTime: remainingTime }); 
    updateBadge();
}

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'timer') {
        clearIntervalAndStopTimer();
        createNotification("Well done! Now take a break.");
        remainingTime = timerDuration;
        chrome.storage.sync.set({ remainingTime: remainingTime });
        updateBadge();
        chrome.contextMenus.update('start-timer', {
            title: 'Start Timer',
            contexts: ['all']
        });
    }
});

function updateBadge() {
    let elapsedTime = 0;
    if (timerRunning) {
        elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    }
    let remaining = remainingTime - elapsedTime;
    if (remaining < 0) {
        remaining = 0;
    }
    let minutes = Math.floor(remaining / 60);
    let secondsRemaining = remaining % 60;
    let text = `${minutes}:${secondsRemaining < 10 ? '0' : ''}${secondsRemaining}`;
    
    chrome.action.setBadgeText({ text: text });
    chrome.action.setBadgeBackgroundColor({ color: timerRunning ? 'green' : '#FF0000' }); // Blue for running, red for stopped
}

setupContextMenu();

chrome.storage.sync.get(['remainingTime'], (data) => {
    if (data.remainingTime !== undefined) {
        remainingTime = data.remainingTime;
        updateBadge();
    }
});

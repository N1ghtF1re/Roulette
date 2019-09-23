var lastBet = null;
(function () {
    var webSocketProtocol = location.protocol === "https:" ? "wss:" : "ws:";
    var webSocketURI = webSocketProtocol + "//" + location.host + "/ws";

    var balanceElement = document.getElementById("balance-count");



    var socket = new WebSocket(webSocketURI);


    socket.onopen = function () {
        console.log("Connected.");
    };

    socket.onclose = function (event) {
        if (event.wasClean) {
            console.log('Disconnected.');
        } else {
            console.log('Connection lost.'); // for example if server processes is killed
        }
        console.log('Code: ' + event.code + '. Reason: ' + event.reason);
    };

    socket.onmessage = function (event) {
        var message = JSON.parse(event.data);

        switch (message.type) {
            case "ERROR_MESSAGE":
                showError(message.message);
                break;
            case "SCORE_MESSAGE":
                hideSuccess();
                spin(message['score']);
                onSpin.push(function() { balanceElement.innerText = message['balance'] });
                if (lastBet != null && lastBet.bets.includes(message['score'])) {
                    var prize = (message['balance'] - getCurrentBalance());
                    onSpin.push(function () {
                        showSuccess("You won " + prize + "$");
                    })
                }
                lastBet = null;

                break;
            case "USER_MESSAGE":
                addEventToEventList(message);
                break;
            case "WON_MESSAGE":
                onSpin.push(function() { addEventToEventList(message) });
                break;
        }

    };

    socket.onerror = function (error) {
        showError(error.message);
        console.log("Error: " + error.message);
    };
    var betInput = document.getElementById("bet-input");
    var betBtn = document.getElementById("bet");
    
    betInput.addEventListener("keyup", function(event) {
        // Number 13 is the "Enter" key on the keyboard
        if (event.key === "Enter") {
            event.preventDefault();
            betBtn.click();
        }
    });

    betBtn.onclick = function() {
        var betsArray = getBets();
        var amount = betInput.value * 1;

        if (betsArray.length === 0) {
            showError("You haven't selected bet");
        } else if (amount > balanceElement.innerText * 1) {
            showError("You don't have enough money");
        } else if (amount === 0) {
            showError("You can't bet nothing");
        } else {
            var betRequest = {bets: getBets(), amount: betInput.value * 1};
            lastBet = betRequest;
            socket.send(JSON.stringify(betRequest));
            balanceElement.innerText -= betInput.value;
            betInput.value = "";
            disableInputs();
            hideError();
            hideSuccess();
        }


    };

    function getCurrentBalance() {
        return balanceElement.innerText;
    }

    function showError(message) {
        var errorElement = document.getElementById("msg-error");

        errorElement.innerText = message;
        errorElement.style = "";
    }

    function hideError() {
        var errorElement = document.getElementById("msg-error");

        errorElement.style = "display: none";
    }

    function showSuccess(message) {
        var successElement = document.getElementById("msg-success");

        successElement.innerText = message;
        successElement.style = "";
    }

    function hideSuccess() {
        var successElement = document.getElementById("msg-success");

        successElement.style = "display: none";
    }


    function addEventToEventList(event) {
        var eventList = document.getElementById("chat-events");

        eventList.innerHTML += "<li><span class='username'>" + event.name + "</span>" + event.message + "</li>";
        eventList.scrollTop = eventList.scrollHeight;
    }

})();
        
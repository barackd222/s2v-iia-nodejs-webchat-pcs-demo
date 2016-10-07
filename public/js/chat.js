// This file is executed in the browser, when people visit /chat/<random id>

$(function () {

	// Initiating XMLHttpRequest Object:
	var http_request = initiateXMLHttpObject();


	// getting the id of the room from the url
	var id = Number(window.location.pathname.match(/\/chat\/(\d+)$/)[1]);

	// connect to the socket
	var socket = io();

	// variables which hold the data for each person
	var name = "",
		email = "",
		img = "",
		friend = "";

	// cache some jQuery objects
	var section = $(".section"),
		footer = $("footer"),
		onConnect = $(".connected"),
		inviteSomebody = $(".invite-textfield"),
		personInside = $(".personinside"),
		chatScreen = $(".chatscreen"),
		left = $(".left"),
		noMessages = $(".nomessages"),
		tooManyPeople = $(".toomanypeople");

	// some more jquery objects
	var chatNickname = $(".nickname-chat"),
		leftNickname = $(".nickname-left"),
		loginForm = $(".loginForm"),
		yourName = $("#yourName"),
		yourEmail = $("#yourEmail"),
		hisName = $("#hisName"),
		hisEmail = $("#hisEmail"),
		chatForm = $("#chatform"),
		textarea = $("#message"),
		messageTimeSent = $(".timesent"),
		chats = $(".chats");

	// these variables hold images
	var ownerImage = $("#ownerImage"),
		leftImage = $("#leftImage"),
		noMessagesImage = $("#noMessagesImage");


	// on connection to server get the id of person's room
	socket.on('connect', function () {

		socket.emit('load', id);
	});

	// save the gravatar url
	socket.on('img', function (data) {
		img = data;
	});

	// receive the names and avatars of all people in the chat room
	socket.on('peopleinchat', function (data) {

		if (data.number === 0) {

			showMessage("connected");

			loginForm.on('submit', function (e) {

				e.preventDefault();

				name = $.trim(yourName.val());

				if (name.length < 1) {
					alert("Please enter a nick name longer than 1 character!");
					return;
				}

				email = yourEmail.val();

				if (!isValid(email)) {
					alert("Please enter a valid email!");
				}
				else {

					showMessage("inviteSomebody");

					// call the server-side function 'login' and send user's parameters
					socket.emit('login', { user: name, avatar: email, id: id });
				}

			});
		}

		else if (data.number === 1) {

			showMessage("personinchat", data);

			loginForm.on('submit', function (e) {

				e.preventDefault();

				name = $.trim(hisName.val());

				if (name.length < 1) {
					alert("Please enter a nick name longer than 1 character!");
					return;
				}

				if (name == data.user) {
					alert("There already is a \"" + name + "\" in this room!");
					return;
				}
				email = hisEmail.val();

				if (!isValid(email)) {
					alert("Wrong e-mail format!");
				}
				else {
					socket.emit('login', { user: name, avatar: email, id: id });
				}

			});
		}

		else {
			showMessage("tooManyPeople");
		}

	});

	// Other useful 

	socket.on('startChat', function (data) {
		console.log(data);
		if (data.boolean && data.id == id) {

			chats.empty();

			if (name === data.users[0]) {

				showMessage("youStartedChatWithNoMessages", data);
			}
			else {

				showMessage("heStartedChatWithNoMessages", data);
			}

			chatNickname.text(friend);
		}
	});

	socket.on('leave', function (data) {

		if (data.boolean && id == data.room) {

			showMessage("somebodyLeft", data);
			chats.empty();
		}

	});

	socket.on('tooMany', function (data) {

		if (data.boolean && name.length === 0) {

			showMessage('tooManyPeople');
		}
	});

	socket.on('receive', function (data) {

		showMessage('chatStarted');

		if (data.msg.trim().length) {

			// Send chat message:
			createChatMessage(data.msg, data.user, data.img, moment());
			scrollToBottom();

			// Call S2V-IIA-Extension Modules:
			// Integrating to TTS:
			var action = [];

			responsiveVoice.speak(data.msg), "UK English Female";
			processMessage(data.user, data.msg, action);

			if (action.length > 0) {

				responsiveVoice.speak(action[0], "UK English Male");
			        createChatMessage(action[0], name, img, moment());
			        socket.emit('msg', { msg: action[0], user: name, img: img });

                                if (action.length > 1) {
					setTimeout(function () {
						// alert("API called [" + action[1] + "]");
						sendPCSRequest(http_request, action[1]);

					}, 5000);
                                        //Wait 5 seconds before showing up the alert message, to allow the UK English male to talk! 
				}
			}
		}
	});

	textarea.keypress(function (e) {

		// Submit the form on enter

		if (e.which == 13) {
			e.preventDefault();
			chatForm.trigger('submit');
		}

	});

	chatForm.on('submit', function (e) {

		e.preventDefault();

		// Create a new chat message and display it directly

		showMessage("chatStarted");

		if (textarea.val().trim().length) {
			createChatMessage(textarea.val(), name, img, moment());
			scrollToBottom();

			// Send the message to the other person in the chat
			socket.emit('msg', { msg: textarea.val(), user: name, img: img });

		}
		// Empty the textarea
		textarea.val("");
	});

	// Update the relative time stamps on the chat messages every minute

	setInterval(function () {

		messageTimeSent.each(function () {
			var each = moment($(this).data('time'));
			$(this).text(each.fromNow());
		});

	}, 60000);

	// Function that creates a new chat message

	function createChatMessage(msg, user, imgg, now) {

		var who = '';

		if (user === name) {
			who = 'me';
		}
		else {
			who = 'you';
		}

		var li = $(
			'<li class=' + who + '>' +
			'<div class="image">' +
			'<img src=' + imgg + ' />' +
			'<b></b>' +
			'<i class="timesent" data-time=' + now + '></i> ' +
			'</div>' +
			'<p></p>' +
			'</li>');

		// use the 'text' method to escape malicious user input
		li.find('p').text(msg);
		li.find('b').text(user);

		chats.append(li);

		messageTimeSent = $(".timesent");
		messageTimeSent.last().text(now.fromNow());
	}

	function scrollToBottom() {
		$("html, body").animate({ scrollTop: $(document).height() - $(window).height() }, 1000);
	}

	function isValid(thatemail) {

		var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(thatemail);
	}

	function showMessage(status, data) {

		if (status === "connected") {

			section.children().css('display', 'none');
			onConnect.fadeIn(1200);
		}

		else if (status === "inviteSomebody") {

			// Set the invite link content
			$("#link").text(window.location.href);

			onConnect.fadeOut(1200, function () {
				inviteSomebody.fadeIn(1200);
			});
		}

		else if (status === "personinchat") {

			onConnect.css("display", "none");
			personInside.fadeIn(1200);

			chatNickname.text(data.user);
			ownerImage.attr("src", data.avatar);
		}

		else if (status === "youStartedChatWithNoMessages") {

			left.fadeOut(1200, function () {
				inviteSomebody.fadeOut(1200, function () {
					noMessages.fadeIn(1200);
					footer.fadeIn(1200);
				});
			});

			friend = data.users[1];
			noMessagesImage.attr("src", data.avatars[1]);
		}

		else if (status === "heStartedChatWithNoMessages") {

			personInside.fadeOut(1200, function () {
				noMessages.fadeIn(1200);
				footer.fadeIn(1200);
			});

			friend = data.users[0];
			noMessagesImage.attr("src", data.avatars[0]);
		}

		else if (status === "chatStarted") {

			section.children().css('display', 'none');
			chatScreen.css('display', 'block');
		}

		else if (status === "somebodyLeft") {

			leftImage.attr("src", data.avatar);
			leftNickname.text(data.user);

			section.children().css('display', 'none');
			footer.css('display', 'none');
			left.fadeIn(1200);
		}

		else if (status === "tooManyPeople") {

			section.children().css('display', 'none');
			tooManyPeople.fadeIn(1200);
		}
	}

	function processMessage(name, message, action) {

		// alert("Processing a message");
		var INCIDENT_KEY = "incident";
                var WORK_KEY = "work";
                var NONWORK_KEY = "other";
                var incidentWorkType = "";

		// Assess if hello is being used as a command at the beginning.
		if (message.search(/hello/i) != -1) {

			action[0] = "Hi "+name+". I hope you are ok. What can I do for you?";
			return;

		}

		// Assess if incident is being used as a command at the beginning.
		if (message.search(/incident/i) != -1) {

			// alert("INCIDENT was found as a command");
			if (message.search(/work/i) != -1) {

				incidentWorkType = "TRUE";
			        // alert("work incident was found");

			} else {

				incidentWorkType = "FALSE";
			        // alert("other incident was found");
			}

		}
		if (incidentWorkType != "") {

			action[0] = "Happy to help. Your request has been submitted for processing.";
			action[1] = incidentWorkType;

		} else {

			// action[0] = "No command was received. Have a nice day.";

		}
	}

	function sendPCSRequest(http_request, incidentWorkType) {

		// alert("Debugging on: Sending incident work related [" + incidentWorkType + "]");

		// var pcdUrl = "https://oracletrial.process.us2.oraclecloud.com";
		var pcsAuth = "Basic XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX==";
                var body = "{ \"processDefId\":\"default~ProcessApp!1.2~ProcessName\"," +
			     "\"serviceName\":\"ProcessName.service\"," +
			     "\"operation\":\"start\"," +
			     "\"action\":\"Submit\"," +
			     "\"payload\":\"<ns:start xmlns:ns='http://xmlns.oracle.com/bpmn/bpmnCloudProcess/ProcessApp/ProcessNameh'><formArg><jns1:StartWebForm xmlns:jns1='http://xmlns.oracle.com/bpm/forms/schemas/StartWebForm'><payload>"+incidentWorkType+"</payload></jns1:StartWebForm></formArg></ns:start>\"" +
			   "}";

		// alert("body is [" + body + "]");
		// alert("body is [" + body.length + "]");
		// alert("auth is [" + pcsAuth + "]");

                var verb = "POST";
                var async = true;

		http_request.onreadystatechange = function() {
		    if (http_request.readyState == XMLHttpRequest.DONE) {
                        resp = JSON.parse(http_request.responseText);
                        // alert(resp.processId);
                        confirmId = "Your investigation identifier is " + resp.processId;
			createChatMessage(confirmId, name, img, moment());
			socket.emit('msg', { msg: confirmId, user: name, img: img });
		    }
		}

		http_request.open(verb, pcsUrl, async);
		http_request.setRequestHeader("Accept", "application/json");
		http_request.setRequestHeader("Content-Type", "application/json");
		http_request.setRequestHeader("Authorization", pcsAuth);
		// http_request.setRequestHeader("Content-Length", body.length);
		http_request.send(body);

		// alert("Your message was sent successfully.");
	}

	function sendRequest(http_request, verb, uri, payload, async) {

		// alert("Debugging on: Sending [" + uri + "] under verb [" + verb + "] with payload [" + payload + "]");

		http_request.open(verb, uri, async);
		http_request.setRequestHeader("Accept", "application/json");
		http_request.send();

		// alert("Your message was sent successfully.");
	}

	function initiateXMLHttpObject() {

		// Initiating XMLHttpRequest Object:
		var http_request;

		try {
			// Opera 8.0+, Firefox, Chrome, Safari
			http_request = new XMLHttpRequest();
		} catch (e) {
			// Internet Explorer Browsers
			try {
				http_request = new ActiveXObject("Msxml2.XMLHTTP");
			} catch (e) {
				try {
					http_request = new ActiveXObject("Microsoft.XMLHTTP");
				} catch (e) {
					// Something went wrong
					alert("Your browser broke!");
					return false;
				}
			}
		}

		return http_request;
	}

});

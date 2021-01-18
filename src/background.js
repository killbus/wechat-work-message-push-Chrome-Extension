function global_push(response, tab) {
    chrome.storage.sync.get({
		default_push_content: "clipboard"
	}, function(items) {
        console.log(items);
        //if default is URL, push URL
        if (items.default_push_content === "URL") {
            console.log(response);
            if (response != null && response.data != '') {
                var selectedText = response.data;
                console.log("send selected text: " + selectedText)
                sendMsg(response.data);
            } else {
                console.log("send url" + tab)
                sendUrl(tab);
            }
        } else if (items.default_push_content === "clipboard") {
            // if default is clipboard, push clipboard data
            sendClipboardData();
        }
    });
}


chrome.browserAction.onClicked.addListener(function (tab) {
	chrome.tabs.sendMessage(tab.id, {
		method: "getSelection"
	}, global_push)
});

//send selected text
function getword(info, tab) {
	console.log("menu " + info.menuItemId + " was clicked.");
	console.log("Word " + info.selectionText + " was clicked.");
	console.log(info);

	/* Chrome converts all linefeeds into spaces in info.selectionText,
	so we need to get the text from the active tab instead with this code: */
	chrome.tabs.executeScript( {
		code: "window.getSelection().toString();"
		}, function(selection) {
			// selected contains text including line breaks
			var selected = selection[0];
			if (info.mediaType == "image") {
				sendMsg(info.srcUrl, info.menuItemId, msgType="image");
			} else {
				if (typeof info.selectionText == 'undefined') {
					global_push(null);
				} else {
					sendMsg(selected, info.menuItemId);
				}
			}
	});
	
}

//send current page url
function sendUrl(tab) {
	chrome.tabs.query({
		'active': true,
		'lastFocusedWindow': true
	}, function (tabs) {
		var currentUrl = tabs[0].url;
		sendMsg(currentUrl);
		console.log(currentUrl);
	});
}

//send clipboard data
function sendClipboardData() {
	sendMsg(getClipboardData());
}

function getClipboardData() {
	var result = '';
	var sandbox = document.getElementById('sandbox');
	sandbox.value = '';
	sandbox.select();
	if (document.execCommand('paste')) {
		result = sandbox.value;
	}
	sandbox.value = '';
	console.log("clipboard conetent: " + result);
	return result;
}


function sendMsg(content, full_server_url = "", msgType = "normal") {
	chrome.storage.sync.get({
		entrypoints: []
	}, function (items) {
		if (items.entrypoints === '' | items.entrypoints.length === 0) {
			alert("please set server_url in options!");
			chrome.tabs.create({
				url: "options.html"
			});
			// chrome.tabs.create({ 'url': 'chrome://extensions/?options=' + chrome.runtime.id });
		} else {
			if (full_server_url === "") {
				full_server_url = items.entrypoints[0].server_url;
				token = items.entrypoints[0].server_token;
			}
			if (full_server_url.startsWith("selection#")) {
				full_server_url = full_server_url.replace(/selection#/g, "");
				entrypoint = items.entrypoints.find(entrypoint => {
					return entrypoint.server_url == full_server_url
				})
				token = entrypoint.server_token;
			}

			console.log(full_server_url);

			var notify_callback = function () {
					var notification = new Notification("Message Sent", {
						body: content,
						icon: "bark_128.png"
					});
				};

				httpGetAsync(full_server_url, notify_callback, token, encodeURIComponent(content));
			
		};
	});
}

function httpGetAsync(theUrl, callback, token, content="") {
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = function () {
		if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
			callback(xmlHttp.responseText);
	}
	xmlHttp.open("POST", theUrl, true); // true for asynchronous 
	xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlHttp.setRequestHeader("token", token);
	console.log(content);
	xmlHttp.send(`message=${content}`);
}

function registerContextMenus() {
	chrome.storage.sync.get({
		entrypoints: [],
		default_push_content: "clipboard"
	}, function (items) {
		console.log(items);
		chrome.contextMenus.removeAll(function() {
			console.log("items" + items[0]);
			for (const it of items.entrypoints) {
				chrome.contextMenus.create({
					title: "Push To Entrypoint " + it.server_name,
					// contexts: ["selection"],
					onclick: getword,
					id: it.server_url
				});
			}
		});
		chrome.contextMenus.removeAll(function() {
			console.log("items" + items[0]);
			for (const it of items.entrypoints) {
				chrome.contextMenus.create({
					title: "Send To Entrypoint " + it.server_name,
					contexts: ["selection", "image"],
					onclick: getword,
					id: "selection#" + it.server_url
				});
			}
		});
	});
}

registerContextMenus();

chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		console.log(sender.tab ?
			"from a content script:" + sender.tab.url :
			"from the extension");
		if (request.greeting == "hello")
			registerContextMenus();
		sendResponse({
			farewell: "goodbye"
		});
	});
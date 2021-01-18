var data = {
  entrypoints: []
}
var data = {}
var dataEntrypoints = []


/**
 * default push content
 */
var radios = document.getElementsByName("default_push_content");
for(i in radios) {
  radios[i].onclick = function(it) {
    data.defaultPushContent = this.value;
  }
}

Object.defineProperty(data, 'defaultPushContent', {
  configurable: true,
  get: function() {
    return defaultPushContent;
  },
  set: function(value) {
    console.log(value);
    defaultPushContent = value;
    document.getElementById(value).checked=true;

    //save to chrome.storage
    chrome.storage.sync.set({
      default_push_content: this.defaultPushContent,
    }, function() {
      // Update status to let user know options were saved.
      var status = document.getElementById('status');
      status.textContent = 'Options saved.';
      setTimeout(function() {
        status.textContent = '';
      }, 200);
    });
    // Update status to let user know options were saved.
    chrome.runtime.sendMessage({greeting: "hello"}, function(response) {
      console.log(response.farewell);
    });
  }
})

/**
 * set entrypoints
 */
Object.defineProperty(data, 'entrypoints', {
    configurable: true,
    get: function() {
      return dataEntrypoints;
    },
    set: function(value) {
      dataEntrypoints = value;
      var str = '<ul>';
      value.forEach(function(it) {
        str += '<li class="url"><u>' + it.server_name +'</u> <button>delete</button> <div style="width:500px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;"><strong>'+ it.server_url + '</strong></div></li>';
      }); 

      str += '</ul>';
      document.getElementById('urls').innerHTML = str;
      //set delete button 
      $("ul").on("click", "button", delete_server);

      //save to chrome.storage
      chrome.storage.sync.set({
        entrypoints: this.entrypoints,
      }, function() {
        // Update status to let user know options were saved.
        chrome.runtime.sendMessage({greeting: "hello"}, function(response) {
          console.log(response.farewell);
        });

        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
          status.textContent = '';
        }, 750);
      });

    }
})

function ValidURL(str) {
  var regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
  if(!regex .test(str)) {
    alert("Please enter valid URL.");
    return false;
  } else {
    return true;
  }
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get({
    entrypoints: [],
    default_push_content: "clipboard",
    auto_copy: "no"
  }, function(items) {
    data.entrypoints = items.entrypoints;
    data.defaultPushContent = items.default_push_content;
    // document.getElementById('server_url').value = items.entrypoints;
  });
}

//delete server urls
function delete_server(e) {
  e.preventDefault();
  dataEntrypoints.splice($(this).parent().index(), 1);
  data.entrypoints = dataEntrypoints;
  $(this).parent().remove();
}

// Saves options to chrome.storage
function addServer() {
  var server_name = document.getElementById('server_name').value;
  var server_url = document.getElementById('server_url').value;
  var server_token = document.getElementById('server_token').value;

  if (ValidURL(server_url)) { //check url if valid 

    console.log('Valid Server');
    data.entrypoints.push({"server_name": server_name, "server_url": server_url, "server_token": server_token});
    data.entrypoints = data.entrypoints
  }
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('add').addEventListener('click',
    addServer);

function httpGetAsync(theUrl, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4) {
          if (xmlHttp.status == 200) {
            callback(xmlHttp.responseText);
          } else {
            callback('error');
          }
        }
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
}


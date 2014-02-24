/* Copyright 2014 Alexander Oberegger

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

function group(hooks,context,cb){
	var socket, loc = document.location, port = loc.port == "" ? (loc.protocol == "https:" ? 443
			: 80)
			: loc.port, url = loc.protocol + "//"
			+ loc.hostname + ":" + port + "/", pathComponents = location.pathname
			.split('/'),
	// Strip admin/plugins
	baseURL = pathComponents.slice(0,
			pathComponents.length - 4).join('/')
			+ '/', resource = baseURL.substring(1)
			+ "socket.io";
			
	socket = io.connect(url, {resource : resource}).of("/pluginfw/admin/user_pad");
	
	var currentPads = [];
	var currentUser = [];
	
	var sortByIdAsc = function(a,b){
		return a.id - b.id;
	};
	var sortByIdDesc = function(a,b){
	 	return b.id - a.id;
	};
	var sortByNameAsc = function(a,b){
		 var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase();
		 if (nameA < nameB) //sort string ascending
		  return -1;
		 if (nameA > nameB)
		  return 1;
		 return 0; //default return value (no sorting)
	};
	var sortByNameDesc = function(a,b){
   	     var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase();
		 if (nameA < nameB) //sort string desc
		  return 1;
		 if (nameA > nameB)
		  return -1;
		 return 0; //default return value (no sorting)
	};
	function Werteliste (querystring) {
		  if (querystring == '') return;
		  var wertestring = querystring.slice(1);
		  var paare = wertestring.split("&");
		  var paar, name, wert;
		  for (var i = 0; i < paare.length; i++) {
		    paar = paare[i].split("=");
		    name = paar[0];
		    wert = paar[1];
		    name = unescape(name).replace("+", " ");
		    wert = unescape(wert).replace("+", " ");
		    this[name] = wert;
		  }
	};
	
	
	var searchPads = function(searchTerm){
		var searchPad = {};
		var list = new Werteliste(document.location.search);
		searchPad.id = list.id;
		searchPad.term = searchTerm;
		socket.emit("search-pads", searchPad,function(pads){
			currentPads = pads;
			showPads(pads, sortByNameAsc);
		});
	};
	var searchUsers = function(searchTerm){
		var searchUser = {};
		var list = new Werteliste(document.location.search);
		searchUser.id = list.id;
		searchUser.term = searchTerm;
		socket.emit("search-group-user", searchUser,function(user) {
			currentUser = user;
			showUser(user, sortByNameAsc);
		});
	};
	var addUser = function(id){
		var userGroup = {};
		userGroup.userID = id;
		var list = new Werteliste(document.location.search);
		userGroup.groupid = list.id;
		socket.emit("add-user-to-group", userGroup, function(added){
			if(added){
				$('#textfield-user').html('User added to Group!');
				searchUsers('');
			}else{
				$('#textfield-user').html('User already exists in Group!');
			}
		});
	};
	var addPad = function(pad){
		var padGroup = {};
		padGroup.padName = pad.name;
		var list = new Werteliste(document.location.search);
		padGroup.groupid = list.id;
		socket.emit("add-pad-to-group", padGroup, function(added){
			if(added){
				$('#textfield-pad').html('Pad added!');
				searchPads('');
			}else{
				$('#textfield-pad').html('Pad already exists!');
			}
		});
	};
	var searchAllUser = function(name){
		var list = new Werteliste(document.location.search);
		var val_list = {};
		val_list.groupid = list.id;
		val_list.name = name;
		socket.emit("search-all-users-not-in-group", val_list, function(allUser){
			showUsersUserBox(allUser);
		});
	};
	
	function handlers(){
		$('.sort.up').unbind('click').click(function(e) {
    		var row = $(e.target).closest("th");
    		var re = /<a.+/;
    		var text = row.html().toString().replace(re, '');
			if(text.toLowerCase() == 'pad name'){
      			showPads(currentPads, sortByNameAsc);
      		}else if(text.toLowerCase() == 'id'){
      			showUser(currentUser, sortByIdAsc);
      		}else if(text.toLowerCase() == 'user name'){
      			showUser(currentUser, sortByNameAsc);
      		}
	    });
    	$('.sort.down').unbind('click').click(function(e) {
      		var row = $(e.target).closest("th");
    		var re = /<a.+/;
    		var text = row.html().toString().replace(re, '');
			if(text.toLowerCase() == 'pad name'){
      			showPads(currentPads, sortByNameDesc);
      		}else if(text.toLowerCase() == 'id'){
      			showUser(currentUser, sortByIdDesc);
      		}else if(text.toLowerCase() == 'user name'){
      			showUser(currentUser, sortByNameDesc);
      		}
    	});
    	$('#addPadButton').unbind('click').click(function(e){
    		pad = {};
    		pad.name = $("#name-of-pad").val();
    		pad.group = document.location.search.id;
    		addPad(pad);
    		
    	});
       	$('#addUserButton').unbind('click').bind('click', function(e){
			e.preventDefault(); 
			$("#UserBox").css('display', 'block');
			$("#fade").css('display', 'block');
			searchAllUser('');
		});

    	
	}
	handlers();
	var showPads = function(pads, sortFunc){
		pads.sort(sortFunc);
		var widget = $('.pad-results-div');
		var resultList =widget.find('.pad-results');
		resultList.html("");
		for(var i = 0; i < pads.length; i++){
			var row = widget.find('.template tr').clone();
			row.find(".Name").html(pads[i].name);
			row.find(".Name").bind('click', function(e){
//				console.log(document.location);
				var list = new Werteliste(document.location.search);
				var pad_name = $(e.target).closest(".Name");
//				console.log(pad_name.html());
				socket.emit('direct-to-group-pad','admin', list.id,pad_name.html() ,function(session, group, pad_name){
//					console.log(session);
//					console.log(group);
					document.cookie = "sessionID="+ session +"; path=/";
					var padurl = url + "p/"+ group + "$" + pad_name;
//					console.log(padurl);
					window.location.replace(padurl);
					
				});
			});
			row.find(".deleteButton").bind('click',function(e){
				var row = $(e.target).closest("tr");
	       		var name = row.find('.Name').html();
	       
	       		var list = new Werteliste(document.location.search);
	       		
				socket.emit("delete-pad", name,list.id, function(){
					searchPads('');
				});
			});
			resultList.append(row);
		};	
	};
	var showUser = function(user, sortFunc){
		user.sort(sortFunc);
		var widget = $('.user-results-div');
		var resultList =widget.find('.user-results');
		resultList.html("");
		for(var i = 0; i < user.length; i++){
			var row = widget.find('.template tr').clone();
			row.find(".ID").html('<a class="userID">' + user[i].id)+ '</a>';
			row.find(".Name").html('<a href = "../users/user?id='+ user[i].id+'" class="userId">' + user[i].name + '</a>');
			row.find(".suspendButton").bind('click',function(e){
				var row = $(e.target).closest("tr");
	       		var id = row.find('.userId').html();
	       		var usergroup = {};
	       		usergroup.userid = id;
	    		var list = new Werteliste(document.location.search);
	       		usergroup.groupid = list.id;
	       		socket.emit("suspend-user-from-group", usergroup, function(){
	       			searchUsers('');
	       		});
			});
			resultList.append(row);
		}
			
	};
	var showUsersUserBox = function(user){
		var widget = $(".whitebox-result-div");
		var resultList=widget.find('.results');
		resultList.html("");
		for(var i = 0; i < user.length; i++){
			var row = widget.find(".template tr").clone();
		      row.find(".name").html('<a class="userName">' +user[i].name+'</a>');
		      row.find(".id").html('<a class="userID">' + user[i].userID + '</a>');
		      row.find(".name").bind('click', function(e){
		    	var row = $(e.target).closest("tr");
		       	var id = row.find('.userID').html();
		    	addUser(id);
		    	searchAllUser('');
		      });
		      resultList.append(row);
		};

	};

	searchPads('');
	searchUsers('');
};






////////////////////////////////////////////////////////////////////////////







function groups(hooks, context,cb){
	var socket, loc = document.location, port = loc.port == "" ? (loc.protocol == "https:" ? 443
			: 80)
			: loc.port, url = loc.protocol + "//"
			+ loc.hostname + ":" + port + "/", pathComponents = location.pathname
			.split('/'),
	// Strip admin/plugins
	baseURL = pathComponents.slice(0,
			pathComponents.length - 3).join('/')
			+ '/', resource = baseURL.substring(1)
			+ "socket.io";
//	console.log("res:");
//	console.log(resource);
			
	socket = io.connect(url, {resource : resource}).of("/pluginfw/admin/user_pad");
//	console.log('groups called');
	var currentGroups = [];
	
	var sortByIdAsc = function(a,b){
		return a.id - b.id;
	};
	var sortByIdDesc = function(a,b){
	 	return b.id - a.id;
	};
	var sortByNameAsc = function(a,b){
		 var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase();
		 if (nameA < nameB) //sort string ascending
		  return -1;
		 if (nameA > nameB)
		  return 1;
		 return 0; //default return value (no sorting)
	};
	var sortByNameDesc = function(a,b){
   	     var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase();
		 if (nameA < nameB) //sort string desc
		  return 1;
		 if (nameA > nameB)
		  return -1;
		 return 0; //default return value (no sorting)
	};
	var sortByAmountAuthorsAsc = function(a,b){
		return a.amAuthors - b.amAuthors;
	};
	var sortByAmountAuthorsDesc = function(a,b){
	 	return b.amAuthors - a.amAuthors;
	};
	
	var searchGroup = function(searchTerm){
//		console.log('searching for group');
		socket.emit("search-group", searchTerm, function(allGroups){
			currentGroups = allGroups;
			showGroups(allGroups, sortByNameAsc);
		});
	};
	var addGroup = function(name){
		socket.emit("add-group", name, function(added){
			if(added){
				$('#textfield-group').html('Group added!');
				searchGroup('');
			}else{
				$('#textfield-group').html('Group already exists!');
			}
		});
	};
	
	function handlers(){
		$('.sort.up').unbind('click').click(function(e) {
    		var row = $(e.target).closest("th");
    		var re = /<a.+/;
    		var text = row.html().toString().replace(re, '');
			if(text.toLowerCase() == 'id'){
				showGroups(currentGroups, sortByIdAsc);
      		}else if(text.toLowerCase() == 'group name'){
      			showGroups(currentGroups, sortByNameAsc);
      		}else if(text.toLowerCase() == '#authors'){
      			showGroups(currentGroups, sortByAmountAuthorsAsc);
      		}
	    });
    	$('.sort.down').unbind('click').click(function(e) {
      		var row = $(e.target).closest("th");
    		var re = /<a.+/;
    		var text = row.html().toString().replace(re, '');
			if(text.toLowerCase() == 'id'){
				showGroups(currentGroups, sortByIdDesc);
      		}else if(text.toLowerCase() == 'group name'){
      			showGroups(currentGroups, sortByNameDesc);
      		}else if(text.toLowerCase() == '#authors'){
      			showGroups(currentGroups, sortByAmountAuthorsDesc);
      		}

    	});
    	$('#addGroupButton').unbind('click').click(function(e){
    		addGroup($("#name-of-group").val());	
    	});	
	}
	handlers();
	
	var showGroups = function(groups, sortFunc){
		groups.sort(sortFunc);
		var widget = $('.group-results-div');
		var resultList =widget.find('.group-results');
		resultList.html("");
		for(var i = 0; i < groups.length; i++){
			var row = widget.find('.template tr').clone();
			row.find(".ID").html('<a class="groupID">' + groups[i].id)+ '</a>';
			row.find(".Name").html('<a href = "groups/group?id='+ groups[i].id+'" class="groupName">' + groups[i].name + '</a>');
			row.find(".Authors").html(groups[i].amAuthors);
			row.find(".deleteButton").bind('click',function(e){
				var row = $(e.target).closest("tr");
	       		var id = row.find('.groupID').html();
				socket.emit("delete-group", id, function(){
					searchGroup('');
				});
			});
			resultList.append(row);
		};
			
	};

	searchGroup('');

};









////////////////////////////////////////////////////////////////////////////






function users(hooks, context,cb){
	var socket, loc = document.location, port = loc.port == "" ? (loc.protocol == "https:" ? 443
			: 80)
			: loc.port, url = loc.protocol + "//"
			+ loc.hostname + ":" + port + "/", pathComponents = location.pathname
			.split('/'),
	// Strip admin/plugins
	baseURL = pathComponents.slice(0,
			pathComponents.length - 3).join('/')
			+ '/', resource = baseURL.substring(1)
			+ "socket.io";
			
	socket = io.connect(url, {resource : resource}).of("/pluginfw/admin/user_pad");
	
	var currentUsers = [];
	
	var sortByIdAsc = function(a,b){
		return a.id - b.id;
	};
	var sortByIdDesc = function(a,b){
	 	return b.id - a.id;
	};
	var sortByNameAsc = function(a,b){
		 var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase();
		 if (nameA < nameB) //sort string ascending
		  return -1;
		 if (nameA > nameB)
		  return 1;
		 return 0; //default return value (no sorting)
	};
	var sortByNameDesc = function(a,b){
   	     var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase();
		 if (nameA < nameB) //sort string desc
		  return 1;
		 if (nameA > nameB)
		  return -1;
		 return 0; //default return value (no sorting)
	};
	var sortByAmountGroupsAsc = function(a,b){
		return a.amGroups - b.amGroups;
	};
	var sortByAmountGroupsDesc = function(a,b){
	 	return b.amGroups - a.amGroups;
	};
	
	var searchUser = function(searchTerm){
		socket.emit("search-all-user", searchTerm, function(allUsers){
			currentUsers = allUsers;
			showUsers(allUsers, sortByNameAsc);
		});
	};
	var addUser = function(user){
		socket.emit("add-user", user, function(added ,msg){
			if(added){
				$('#textfield-user').html(msg);
				searchUser('');
			}else{
				$('#textfield-user').html(msg);
			}
		});
	};
	
	function handlers(){
		$('.sort.up').unbind('click').click(function(e) {
    		var row = $(e.target).closest("th");
    		var re = /<a.+/;
    		var text = row.html().toString().replace(re, '');
			if(text.toLowerCase() == 'id'){
				showUsers(currentUsers, sortByIdAsc);
      		}else if(text.toLowerCase() == 'user name'){
      			showUsers(currentUsers, sortByNameAsc);
      		}else if(text.toLowerCase() == '#groups'){
      			showUsers(currentUsers, sortByAmountGroupsAsc);
      		}
	    });
    	$('.sort.down').unbind('click').click(function(e) {
      		var row = $(e.target).closest("th");
    		var re = /<a.+/;
    		var text = row.html().toString().replace(re, '');
			if(text.toLowerCase() == 'id'){
				showUsers(currentUsers, sortByIdDesc);
      		}else if(text.toLowerCase() == 'user name'){
      			showUsers(currentUsers, sortByNameDesc);
      		}else if(text.toLowerCase() == '#groups'){
      			showUsers(currentUsers, sortByAmountGroupsDesc);
      		}

    	});
    	$('#addUserButton').unbind('click').click(function(e){
    		var user = {};
    		user.name = $("#name-of-user").val();
    		user.pw = $("#pw-of-user").val();
    		addUser(user);	
    	});	
	}
	handlers();
	
	var showUsers = function(users, sortFunc){
		users.sort(sortFunc);
		var widget = $('.user-results-div');
		var resultList =widget.find('.user-results');
		resultList.html("");
		for(var i = 0; i < users.length; i++){
			var row = widget.find('.template tr').clone();
			row.find(".ID").html('<a class="userID">' + users[i].id)+ '</a>';
			row.find(".Name").html('<a href = "users/user?id='+ users[i].id+'" class="userName">' + users[i].name + '</a>');
			row.find(".Groups").html(users[i].amGroups);
			row.find(".deleteButton").bind('click',function(e){
				var row = $(e.target).closest("tr");
	       		var id = row.find('.userID').html();
	       		var hard = false;
				socket.emit("delete-user", id, false, function(deleted){
					if(!deleted){
						var conf = confirm("The User is owner of one ore more groups. Are you sure to delete this user?");
					    if(conf == true){
					    	hard = true;
					    	socket.emit("delete-user", id, hard, function(isOwner){
					    		searchUser('');
					    	});
					    }
					}else{
						searchUser('');
					}
					
				});
			});
			row.find(".newPWButton").bind('click', function(e){
				var row = $(e.target).closest("tr");
	       		var id = row.find('.userID').html();
	       		row.find(".success").html('<img src= "../../static/plugins/ep_user_pad/static/html/wait.gif" width ="12" height = "12" alt="Wait">');
				var val = {};
				val.id = id;
				val.row = row;
	       		socket.emit("reset-pw-user", val, function(retval){
	       			var row = $(".ID:contains('"+retval.id+"')");
	       			if(retval.success){
	       				row.parent().find('.success').html('<img src= "../../static/plugins/ep_user_pad/static/html/success.jpg" width ="12" height = "12" alt="Success">');
	       			}else{
	       				row.parent().find('.success').html('<img src= "../../static/plugins/ep_user_pad/static/html/fail.jpg" width ="12" height = "12" alt="Fail">');
	       			}
	       		});
			});
			if(users[i].active){
				row.find(".setActiveBtn").val('Deactivate');
				row.find(".setActiveBtn").bind('click', function(e){
					e.preventDefault();
					var row = $(e.target).closest("tr");
		       		var id = row.find('.userID').html();
		       		var val = {};
		       		val.id = id;
		       		socket.emit("deactivate-user", val, function(retval){
		       			document.location.reload();
		       		});
				});
			}
			else{
				row.find(".setActiveBtn").val('Activate');
				row.find(".setActiveBtn").bind('click', function(e){
					e.preventDefault();
					var row = $(e.target).closest("tr");
		       		var id = row.find('.userID').html();
		       		var val = {};
		       		val.id = id;
		       		socket.emit("activate-user", val, function(retval){
		       			document.location.reload();
		       		});
				});
			}
			resultList.append(row);
			
		};
	};
	searchUser('');
};




///////////////////////////////////////////////////////////////////




function user(hooks,context,cb){
	var socket, loc = document.location, port = loc.port == "" ? (loc.protocol == "https:" ? 443
			: 80)
			: loc.port, url = loc.protocol + "//"
			+ loc.hostname + ":" + port + "/", pathComponents = location.pathname
			.split('/'),
	// Strip admin/plugins
	baseURL = pathComponents.slice(0,
			pathComponents.length - 4).join('/')
			+ '/', resource = baseURL.substring(1)
			+ "socket.io";
//	console.log(resource);
			
	socket = io.connect(url, {resource : resource}).of("/pluginfw/admin/user_pad");
	
	var currentGroups = [];
	
	var sortByIdAsc = function(a,b){
		return a.id - b.id;
	};
	var sortByIdDesc = function(a,b){
	 	return b.id - a.id;
	};
	var sortByNameAsc = function(a,b){
		 var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase();
		 if (nameA < nameB) //sort string ascending
		  return -1;
		 if (nameA > nameB)
		  return 1;
		 return 0; //default return value (no sorting)
	};
	var sortByNameDesc = function(a,b){
   	     var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase();
		 if (nameA < nameB) //sort string desc
		  return 1;
		 if (nameA > nameB)
		  return -1;
		 return 0; //default return value (no sorting)
	};
	function Werteliste (querystring) {
		  if (querystring == '') return;
		  var wertestring = querystring.slice(1);
		  var paare = wertestring.split("&");
		  var paar, name, wert;
		  for (var i = 0; i < paare.length; i++) {
		    paar = paare[i].split("=");
		    name = paar[0];
		    wert = paar[1];
		    name = unescape(name).replace("+", " ");
		    wert = unescape(wert).replace("+", " ");
		    this[name] = wert;
		  }
	};
	

	var addGroup = function(id){
		var userGroup = {};
		userGroup.groupid = id;
		var list = new Werteliste(document.location.search);
		userGroup.userID = list.id;
		socket.emit("add-group-to-user", userGroup, function(added){
			if(added){
				searchAllGroupsOfUser('');
				searchAllGroupsNotInUser('');
				$('#textfield-group').html('Group added!');
			}else{
				$('#textfield-group').html('Group already exists!');
			}
		});
	};

	var searchAllGroupsOfUser = function(name){
		var list = new Werteliste(document.location.search);
		var val_list = {};
		val_list.id = list.id;
		val_list.name = name;
		socket.emit("search-groups-of-user", val_list, function(allGroups){
			currentGroups = allGroups;
			showGroups(allGroups, sortByNameAsc);
		});
	};
	
	var searchAllGroupsNotInUser = function(name){
		var list = new Werteliste(document.location.search);
		var val_list = {};
		val_list.id = list.id;
		val_list.name = name;
		socket.emit("search-groups-not-in-user", val_list, function(allGroups){
			showGroupsGroupBox(allGroups);
		});
	};
	
	function handlers(){
		$('.sort.up').unbind('click').click(function(e) {
    		var row = $(e.target).closest("th");
    		var re = /<a.+/;
    		var text = row.html().toString().replace(re, '');
			if(text.toLowerCase() == 'id'){
				showGroups(currentGroups, sortByIdAsc);
      		}else if(text.toLowerCase() == 'group name'){
      			showGroups(currentGroups, sortByNameAsc);
      		}
	    });
    	$('.sort.down').unbind('click').click(function(e) {
      		var row = $(e.target).closest("th");
    		var re = /<a.+/;
    		var text = row.html().toString().replace(re, '');
			if(text.toLowerCase() == 'id'){
				showGroups(currentGroups, sortByIdDesc);
      		}else if(text.toLowerCase() == 'group name'){
      			showGroups(currentGroups, sortByNameDesc);
      		}
    	});
       	$('#addGroupButton').unbind('click').bind('click', function(e){
			e.preventDefault(); 
			$("#GroupBox").css('display', 'block');
			$("#fade").css('display', 'block');
			searchAllGroupsNotInUser('');
		});

    	
	}
	handlers();

	var showGroups = function(groups, sortFunc){
		groups.sort(sortFunc);
		var widget = $('.group-results-div');
		var resultList =widget.find('.group-results');
		resultList.html("");
		for(var i = 0; i < groups.length; i++){
			var row = widget.find('.template tr').clone();
			row.find(".ID").html('<a class="groupID">' + groups[i].id)+ '</a>';
			row.find(".Name").html('<a href = "../groups/group?id='+ groups[i].id+'" class="groupName">' + groups[i].name + '</a>');
			row.find(".escapeButton").bind('click',function(e){
				var row = $(e.target).closest("tr");
	       		var id = row.find('.groupID').html();
	       		var usergroup = {};
	       		usergroup.groupid = id;
	    		var list = new Werteliste(document.location.search);
	       		usergroup.userid = list.id;
	       		
	       		socket.emit("suspend-user-from-group", usergroup, function(){
	       			searchAllGroupsOfUser('');
	       		});
			});
			resultList.append(row);
		}
			
	};
	var showGroupsGroupBox = function(groups){
		var widget = $(".whitebox-result-div");
		var resultList=widget.find('.results');
		resultList.html("");
		for(var i = 0; i < groups.length; i++){
			var row = widget.find(".template tr").clone();
		      row.find(".name").html('<a class="groupName">' +groups[i].name+'</a>');
		      row.find(".id").html('<a class="groupID">' + groups[i].id + '</a>');
		      row.find(".name").bind('click', function(e){
		    	var row = $(e.target).closest("tr");
		       	var id = row.find('.groupID').html();
		    	addGroup(id);
		      });
		      resultList.append(row);
		};

	};

	socket.on('search-all-groups-from-user-result', function(user){
		showGroupsGroupBox(user);
	});
	searchAllGroupsOfUser('');
};






exports.documentReady = function(hooks, context, cb){
//	    console.log(context);
		if(context == "admin/user_pad_groups")
			groups(hooks,context, cb);
		else if(context == "admin/user_pad_group")
			group(hooks,context,cb);
		else if(context == "admin/user_pad_users")
		    users(hooks,context,cb);
		else if(context == "admin/user_pad_user")
			user(hooks, context,cb);
		else
			return;

        
};



var arConnectedUser = {};

module.exports = {
    add : function(user){
        connectedUser_add(user);
    },
    removeBySocketId : function(socket_id){
        connectedUser_removeBySocketId(socket_id);
    },
    getByUserId: function(user_id){
        return connectedUser_getById(user_id);
    },
    getBySocketId: function(socket_id){
        return connectedUser_getBySocketId(socket_id);
    },
    print: function(){
        connectedUser_print();
    }
};

function connectedUser_print(){
    for(var k in arConnectedUser) {
        console.log(arConnectedUser[k].user_id, arConnectedUser[k].socket.id);
    }
}

function connectedUser_add(user){
    arConnectedUser[user.user_id] = user;
}


function connectedUser_removeBySocketId(socket_id){
    for(var k in arConnectedUser) {
        if(arConnectedUser[k].socket.id == socket_id){
            delete arConnectedUser[k];
            break;
        }
    }
}

function connectedUser_getById(user_id){
    return (user_id in arConnectedUser)? arConnectedUser[user_id] : false;
}

function connectedUser_getBySocketId(socket_id){
    for(var k in arConnectedUser) {
        if(arConnectedUser[k].socket.id == socket_id){
            return arConnectedUser[k];
        }
    }
    return false;
}
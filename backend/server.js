const express = require('express');
const app = express();
const dotenv = require('dotenv');

const http = require('http');
const socket = require('socket.io');

const databaseConnect = require('./config/database');
const authRouter = require('./routes/authRoute');
const cookieparser = require ('cookie-parser');
const bodyParser = require('body-parser');
const messengerRoute = require('./routes/messengerRoute');
const path = require('path');
dotenv.config({
    path : 'backend/config/config.env'
})
app.use(bodyParser.json());
app.use(cookieparser());
app.use('/api/messenger',authRouter);
app.use('/api/messenger',messengerRoute); 
databaseConnect();

const server = http.createServer(app);
const io = socket(server);

let users=[];

const addUser  = (userId,socketId,userInfo) =>{
    const checkUser = users.some(u=>u.userId === userId);
    if(!checkUser){
        users.push({userId,socketId,userInfo});
    }
   

}
const userRemove =(socketId)=>{
    users = users.filter(u=>u.socketId !== socketId);
}

const findFriend = (id) =>{
    return users.find(u=>u.userId ===id);
}
const userLogout = (userId)=>{
    users = users.filter(u=>u.userId !== userId)
}
io.on('connection',(socket)=>{
    console.log('user is connected....')
    socket.on('addUser',(userId,userInfo)=>{
        addUser(userId,socket.id,userInfo)
        io.emit('getUser',users)

        const us = users.filter(u=>u.userId !== userId);
        const  con = 'new_user_add';
        for(var i = 0 ; i<us.length ; i++){
            socket.to(us[i].socketId).emit('new_user_add',con)
        }
    })
    socket.on('sendMessage',(data)=>{

        const user = findFriend(data.receiverId);
        
        if(user !== undefined){
            socket.to(user.socketId).emit('getMessage',data)
        }
       
    })
    socket.on('messageSeen',msg=>{
        const user = findFriend(msg.senderId);
        if(user !== undefined){
            socket.to(user.socketId).emit('msgSeenResponse',msg)
        }
    })
    socket.on('deliveredMessage',msg=>{
        const user = findFriend(msg.senderId);
        if(user !== undefined){
            socket.to(user.socketId).emit('msgDeliveredResponse',msg)
        }
    })
    socket.on('seen',data=>{
        const user = findFriend(data.senderId);
        if(user !== undefined){
            socket.to(user.socketId).emit('seenSuccess',data);
        }
    })
    socket.on('typingMessage',(data)=>{

        const user = findFriend(data.receiverId);
        
        if(user !== undefined){
            socket.to(user.socketId).emit('typingMessageGet',{
                senderId: data.senderId,
                receiverId: data.receiverId,
                msg : data.msg
            })
        }
    });
    socket.on('logout',userId=>{
        userLogout(userId)
    })
    socket.on('disconnect',()=>{
        console.log('user disconnect.....');
        userRemove(socket.id);
        io.emit('getUser',users)
    })
})

if(process.env.NODE_ENV === 'production'){
    app.use(express.static(path.join(__dirname,"../frontend/build")));
    app.get('*',(req,res)=>{
        res.sendFile(path.resolve(__dirname,"../","frontend","build","index.html"));
    })
}

const PORT = process.env.PORT
server.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`)
})
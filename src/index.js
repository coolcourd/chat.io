const express = require("express")
const http = require("http")
const socketio = require("socket.io")
const Filter = require("bad-words")
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000

app.use(express.static('public'))


io.on('connection', (socket) => {
    console.log("New Websocket Connection")
    
    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({id: socket.id, username, room})

        if (error) {
            return callback(error)
        }

        socket.join(user.room)
        socket.emit("message", generateMessage("System", "Welcome"))
        socket.broadcast.to(user.room).emit('message', generateMessage("System", `${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })
    
    socket.on("sendMessage", (message, callback) => {
        const filter = new Filter()
        if (filter.isProfane(message)) {
            return callback('profanity is not allowed.')
        }
        const user = getUser(socket.id)
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user){
            io.to(user.room).emit('message', generateMessage('System', `${user.username} has disconnected`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
    socket.on('sendLocation', ({lat, long}, callback)=> {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://www.google.com/maps?q=${lat},${long}`))
        callback()
    })
})


server.listen(port, () => {
        console.log(`app is running on ${port}`)
    }
)
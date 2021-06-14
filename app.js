const express = require('express')
const app = express()
const cors = require('cors')
const server = require('http').Server(app)
const io = require('socket.io')(server, {
  debug: true,
})
const { v4: uuidV4 } = require('uuid')

// ** socketio and peerjs cant start on the same port, websoket error **
// currently using peerjs's cloud server

// const { ExpressPeerServer } = require('peer')
// const peerServer = ExpressPeerServer(server, {
//   debug: true,
// })

//app.use('/peerjs', peerServer)

app.use(cors())
app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
  if (!req.query.login) {
    req.query.login = getRandomLogin()
  }
  res.redirect(`/${uuidV4()}?login=${req.query.login}`)
})

app.get('/:room', (req, res) => {
  if (!req.query.login) {
    req.query.login = getRandomLogin()
  }
  res.render('room', { roomId: req.params.room, login: req.query.login })
})

io.on('connection', (socket) => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    socket.broadcast.to(roomId).emit('user-connected', userId)
    socket.on('message', (message) => {
      io.to(roomId).emit('createMessage', message)
    })

    socket.on('disconnect', () => {
      socket.broadcast.to(roomId).emit('user-disconnected', userId)
    })
  })
})

server.listen(process.env.PORT || 3030)

function getRandomLogin() {
  return uuidV4().slice(0, 3)
}

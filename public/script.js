const socket = io('/')
const videoGrid = document.querySelector('#video-grid')
const myPeer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: '443',
})
let myVideoStream
const myVideo = document.createElement('video')
myVideo.muted = true

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream
    addVideoStream(myVideo, stream)

    myPeer.on('call', (call) => {
      call.answer(stream)
      const video = document.createElement('video')
      call.on('stream', (userVideoStream) => {
        addVideoStream(video, userVideoStream)
      })
    })

    socket.on('user-connected', (userId) => {
      connectToNewUser(userId, stream)
    })
  })

myPeer.on('open', (id) => {
  socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
  debugger
  const call = myPeer.call(userId, stream)
  const userVideo = document.createElement('video')
  call.on('stream', (userVideoStream) => {
    addVideoStream(userVideo, userVideoStream)
  })
  call.on('close', () => {
    video.remove()
  })
}

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}

const chatInput = document.querySelector('#chat_message')
chatInput.addEventListener('keyup', (e) => {
  if (e.keyCode === 13 && e.target.value.length != 0) {
    console.log(e.target.value)
    e.target.value = ''
  }
})

socket.on('createMessage', (message) => {
  console.log('server', message)
})

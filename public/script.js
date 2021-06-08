const socket = io()
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

    const chatInput = document.querySelector('#chat_message')
    chatInput.addEventListener('keyup', (e) => {
      if (e.keyCode === 13 && e.target.value.length != 0) {
        socket.emit('message', e.target.value)
        e.target.value = ''
      }
    })

    const chatWindow = document.querySelector('.main__chat_window')
    const chat = document.querySelector('.messages')
    socket.on('createMessage', (message) => {
      const chatMessage = document.createElement('li')
      chatMessage.innerText = message
      chat.append(chatMessage)
      chatWindow.scroll({
        top: chatWindow.scrollHeight,
        behavior: 'smooth',
      })
    })

    const micButton = document.querySelector('#micButton')
    micButton.addEventListener('click', onMicButtonClick)

    const cameraButton = document.querySelector('#cameraButton')
    cameraButton.addEventListener('click', onCameraButtonClick)

    const chatButton = document.querySelector('#chatButton')
    chatButton.addEventListener('click', onChatButtonClick)
  })

myPeer.on('open', (id) => {
  socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
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

function onMicButtonClick(e) {
  const enabled = myVideoStream.getAudioTracks()[0].enabled
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false
    e.currentTarget.innerHTML = `<i class="unmute fas fa-microphone-slash"></i><span>Включить микрофон</span>`
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true
    e.currentTarget.innerHTML = `<i class="fas fa-microphone"></i><span>Отключить микрофон</span>`
  }
}

function onCameraButtonClick(e) {
  const enabled = myVideoStream.getVideoTracks()[0].enabled
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false
    e.currentTarget.innerHTML = `<i class="stop fas fa-video-slash"></i><span>Включить камеру</span>`
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true
    e.currentTarget.innerHTML = `<i class="fas fa-video"></i><span>Отключить камеру</span>`
  }
}

const leftBlock = document.querySelector('.main__left')
const rightBlock = document.querySelector('.main__right')
function onChatButtonClick(e) {
  if (rightBlock.classList.contains('hidden')) {
    leftBlock.style.flex = '0.8'
    rightBlock.classList.remove('hidden')
    return
  }
  leftBlock.style.flex = '1'
  rightBlock.classList.add('hidden')
}

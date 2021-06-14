const socket = io('/')
const myPeer = new Peer()
const peers = {}

let stream = null
let myVideoStream = null
let myCaptureStream = null

const myVideo = document.createElement('video')
myVideo.classList.add('video__bottom__right')
myVideo.muted = true

const videoGrid = document.querySelector('#video-grid')
const leftBlock = document.querySelector('.main__left')
const rightBlock = document.querySelector('.main__right')
const chatInput = document.querySelector('#chat_message')
const chatWindow = document.querySelector('.main__chat_window')
const chat = document.querySelector('.messages')
const micButton = document.querySelector('#micButton')
const cameraButton = document.querySelector('#cameraButton')
const chatButton = document.querySelector('#chatButton')
const screenCaptureButton = document.querySelector('#screenCaptureButton')

socket.on('user-connected', (userId) => {
  connectToNewUser(userId, stream)
})
socket.on('user-disconnected', (userId) => {
  if (peers[userId]) peers[userId].close()
  const userVideo = document.querySelector(`video[data-user-id="${userId}"]`)
  if (userVideo) {
    userVideo.remove()
  }
})
socket.on('createMessage', (message) => {
  const chatMessage = document.createElement('li')
  chatMessage.innerText = message
  chat.append(chatMessage)
  chatWindow.scroll({
    top: chatWindow.scrollHeight,
    behavior: 'smooth',
  })
})

myPeer.on('open', (id) => {
  socket.emit('join-room', ROOM_ID, id)
})
myPeer.on('call', (call) => {
  call.answer(stream)
  const video = document.createElement('video')
  call.on('stream', (userVideoStream) => {
    addVideoStream(video, userVideoStream)
  })
})

async function initApp() {
  stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  })
  myVideoStream = stream
  addVideoStream(myVideo, stream)

  chatInput.addEventListener('keyup', (e) => {
    if (e.keyCode === 13 && chatInput.value.length != 0) {
      socket.emit('message', `${LOGIN}: ${chatInput.value}`)
      chatInput.value = ''
    }
  })
  micButton.addEventListener('click', onMicButtonClick)
  cameraButton.addEventListener('click', onCameraButtonClick)
  chatButton.addEventListener('click', onChatButtonClick)
  screenCaptureButton.addEventListener('click', onScreenCaptureButtonClick)
  videoGrid.addEventListener('click', onVideoGridClick)
}

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const userVideo = document.createElement('video')
  userVideo.dataset.userId = userId
  call.on('stream', (userVideoStream) => {
    addVideoStream(userVideo, userVideoStream)
  })
  call.on('close', () => {
    userVideo.remove()
  })
  peers[userId] = call
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
    micButton.classList.add('stop')
    micButton.innerHTML = `<i class="fas fa-microphone-slash"></i><span>Включить микрофон</span>`
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true
    micButton.classList.remove('stop')
    micButton.innerHTML = `<i class="fas fa-microphone"></i><span>Отключить микрофон</span>`
  }
}

function onCameraButtonClick(e) {
  const enabled = myVideoStream.getVideoTracks()[0].enabled
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false
    cameraButton.classList.add('stop')
    cameraButton.innerHTML = `<i class="fas fa-video-slash"></i><span>Включить камеру</span>`
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true
    cameraButton.classList.remove('stop')
    cameraButton.innerHTML = `<i class="fas fa-video"></i><span>Отключить камеру</span>`
  }
}

function onChatButtonClick(e) {
  if (rightBlock.classList.contains('hidden')) {
    leftBlock.style.flex = '0.8'
    rightBlock.classList.remove('hidden')
    chatButton.classList.remove('stop')
    chatButton.innerHTML = `<i class="fas fa-comment-alt"></i><span>Скрыть чат</span>`
    return
  }
  leftBlock.style.flex = '1'
  rightBlock.classList.add('hidden')
  chatButton.classList.add('stop')
  chatButton.innerHTML = `<i class="fas fa-comment-alt"></i><span>Показать чат</span>`
}

async function onScreenCaptureButtonClick() {
  if (myCaptureStream) {
    changeToCameraStream()
    return
  }

  try {
    myCaptureStream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: true },
    })
  } catch (error) {
    return
  }

  const key = Object.keys(myPeer.connections)[0]
  if (key) {
    myPeer.connections[key][0].peerConnection
      .getSenders()[1]
      .replaceTrack(myCaptureStream.getTracks()[0])
  }

  stream = myCaptureStream

  screenCaptureButton.classList.add('streaming')
  myVideo.srcObject = myCaptureStream
}

function changeToCameraStream() {
  const key = Object.keys(myPeer.connections)[0]
  if (key) {
    myPeer.connections[key][0].peerConnection
      .getSenders()[1]
      .replaceTrack(myVideoStream.getTracks()[1])
  }

  stream = myVideoStream

  screenCaptureButton.classList.remove('streaming')
  myVideo.srcObject = myVideoStream
  myCaptureStream = null
}

function onVideoGridClick(e) {
  if (e.target.tagName === 'VIDEO') {
    document.querySelectorAll('video').forEach((video) => {
      if (video == e.target) {
        video.classList.toggle('video__fullscreen')
        return
      }
      video.classList.remove('video__fullscreen')
    })
  }
}

initApp()

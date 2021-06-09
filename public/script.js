const socket = io('/', { transports: ['polling'], upgrade: true })
const videoGrid = document.querySelector('#video-grid')
const myPeer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: '443',
})
let myVideoStream = null
let myCaptureStream = null
const myVideo = document.createElement('video')
myVideo.muted = true

const leftBlock = document.querySelector('.main__left')
const rightBlock = document.querySelector('.main__right')
const chatInput = document.querySelector('#chat_message')
const chatWindow = document.querySelector('.main__chat_window')
const chat = document.querySelector('.messages')
const micButton = document.querySelector('#micButton')
const cameraButton = document.querySelector('#cameraButton')
const chatButton = document.querySelector('#chatButton')
const leaveButton = document.querySelector('#leaveButton')
const screenCaptureButton = document.querySelector('#screenCaptureButton')

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

    socket.on('createMessage', (message) => {
      const chatMessage = document.createElement('li')
      chatMessage.innerText = message
      chat.append(chatMessage)
      chatWindow.scroll({
        top: chatWindow.scrollHeight,
        behavior: 'smooth',
      })
    })

    chatInput.addEventListener('keyup', (e) => {
      if (e.keyCode === 13 && chatInput.value.length != 0) {
        socket.emit('message', chatInput.value)
        chatInput.value = ''
      }
    })
    micButton.addEventListener('click', onMicButtonClick)
    cameraButton.addEventListener('click', onCameraButtonClick)
    chatButton.addEventListener('click', onChatButtonClick)
    leaveButton.addEventListener('click', onLeaveButtonClick)
    screenCaptureButton.addEventListener('click', onScreenCaptureButtonClick)
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
    userVideo.remove()
  })
}

function addVideoStream(video, stream) {
  video.addEventListener('dblclick', (e) => {
    e.currentTarget.classList.toggle('fullscreen')
  })
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

function onLeaveButtonClick(e) {
  socket.close()
}

async function onScreenCaptureButtonClick() {
  if (myCaptureStream) {
    screenCaptureButton.classList.remove('streaming')
    myVideo.srcObject.getTracks().forEach((track) => track.stop())
    myVideo.srcObject = myVideoStream
    myCaptureStream = null
    return
  }
  myCaptureStream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: true } })
  screenCaptureButton.classList.add('streaming')
  myVideo.srcObject = myCaptureStream
}

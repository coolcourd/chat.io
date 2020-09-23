const socket = io()

const $chatForm = document.getElementById("chat")
const $chatFormInput = $chatForm.querySelector('input')
const $chatFormButton = $chatForm.querySelector('[type=submit]')
const $locationButton = document.getElementById("send-location")
const $messages = document.getElementById('messages')
const $sidebar = document.getElementById('sidebar')

// Templates
const messageTemplate = document.getElementById("message-template").innerHTML
const locationTemplate = document.getElementById("location-message").innerHTML
const sidebarTemplate = document.getElementById("sidebar-template").innerHTML

// Options
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
})

$chatForm.addEventListener("submit", (e) => {
    e.preventDefault()
    $chatFormButton.setAttribute("disabled", 'disabled')
    const message = e.target.elements.message.value
    socket.emit('sendMessage', message, (error) => {
        $chatFormButton.removeAttribute("disabled")
        $chatFormInput.value = ''
        $chatFormInput.focus()
        if (error) {
            return console.log(error)
        }
        console.log('Message Delivered')
    })
}) 

const autoscroll = () => {
    const $newMessage = $messages.lastElementChild
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    const visibleHeight = $messages.offsetHeight
    const containerHeight = $messages.scrollHeight
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = containerHeight
    }

}


socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a'),
        username: message.username
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    const html = Mustache.render(locationTemplate, {
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a'),
        username: message.username
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on("roomData", (data) => {
    console.log(data)
    const html = Mustache.render(sidebarTemplate, data)
    $sidebar.innerHTML = html
})


$locationButton.addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert('geolocation is not supported by your browser.')
    }
    navigator.geolocation.getCurrentPosition((position) => {
        $locationButton.setAttribute("disabled", 'disabled')
        const coords = {lat: position.coords.latitude, long: position.coords.longitude}
        socket.emit('sendLocation', coords, () => {
            $locationButton.removeAttribute("disabled")
            console.log("Location Shared")
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = `/?room=${room}`
    }
})
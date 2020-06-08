
const notify= function() {

    // rooms
    function Room(roomName) {
        this.roomName = roomName
        this.statusChannel = `${this.roomName}/stats`
        this.msgCallbacks = []
        this.statusCallbacks = []
        this.socket = null
    }
    Room.prototype = {
 
        onMessage(callback) {
            this.msgCallbacks.push(callback)
            return this
        },
 
        onStatusUpdate(callback) {
            this.statusCallbacks.push(callback)
            return this
        },
 
        addMessage(msg) {
            for (let i=0; i < this.msgCallbacks.length; i++) {
                const callback = this.msgCallbacks[i]
                callback(msg)
            }
        },
 
        updateStatus(msg) {
            for (let i=0 ;i < this.statusCallbacks.length; i++) {
                const callback = this.statusCallbacks[i]
                callback(msg)
            }
        },
 
        joinRoom() {
            const self = this
            self.socket.emit('announce-room-join', {
                roomName : self.roomName
            })
        },
 
        init(socket) {
            const self = this
            if (this.socket == socket){
                self.joinRoom()
                return
            }
            self.socket = socket
            self.socket.on(self.statusChannel, data => {
                self.updateStatus(data)
            })
            self.socket.on(self.roomName, data => {
                self.addMessage(data)
            })
            self.joinRoom()
        }
    }
 
    function AnnounceClient() {
        this.callbacks = []
        this.initCallbacks = []
        this.rooms = []
        this.socket = null
    }
    AnnounceClient.prototype = {
 
        getCookie(name) {
            name = `${name}=`
            const cookies = document.cookie.split('')
            for (let i=0 ;i < cookies.length; i++) {
                let cookie = cookies[i]
                while (cookie.charAt(0) == ' '){
                    cookie = cookie.substring(1, cookie.length)
                }
                if (cookie.indexOf(name) == 0){
                    return cookie.substring(name.length, cookie.length)  
                } 
            }
            return null
        },
 
        getAnnounceCookie() {
            return this.getCookie('announceToken')
        },
 
        getServerPath() {
            // this entire function is a terrible hack.
            // we use it to get the server path.
            const scripts = document.getElementsByTagName('script')
            const clientTag
            for (let i=0 ;i < scripts.length; i++){
                const src = scripts[i].getAttribute('src')
                if (src){
                    const resourceLoc = src.indexOf('/client/announce.client.js')
                    if(resourceLoc != -1){
                        // cut the part before it
                        return src.substring(0, resourceLoc)
                    }
                }
            }
            return null
        },
 
        requestIsSecure(serverAddr) {
            return (serverAddr.indexOf('https') == 0)
        },
 
        // run on successful connection
        on(channel, callback) {
            function cb(socket) {
                socket.on(channel, callback)
            }
            this.callbacks.push(cb)
 
            if (this.socket) cb(this.socket) // if already connected, bind.
            return this
        },
 
        bind(callback) {
            this.initCallbacks.push(callback)
            if (this.socket) callback(this.socket)
        },
 
        joinRoom(roomName) {
            const r = new Room(roomName)
            this.rooms.push(r)
 
            if (this.socket) r.init(this.socket)
            return r
        },
 
        init(callback) {
            const self = this
            // create a connection
            const announceToken = this.getAnnounceCookie()
            const callbacks = this.callbacks 
            const socketServer = this.getServerPath()

            
            let socket = io.connect(socketServer)
            
            
            // authenticate with the token
            socket.on('connect', () => {
                socket.emit('announce-authentication', {
                    authString : announceToken
                })
            })
 
            // response
            socket.on('announce-authentication-response', data => {
                if (data.status != 'success'){
                    return
                }
                self.socket = socket

                for(let i=0 ;i < callbacks.length; i++){
                    const cb = callbacks[i]
                    cb(socket)
                }
 
                // call the init callback
                for (let i=0; i < self.initCallbacks.length ;i++) {
                    const cb = self.initCallbacks[i]
                    cb(socket)
                }
            })
 
            return this
        }
    }
    const notify = new AnnounceClient()
    return notify
 }
import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import io from "socket.io-client";

const server = "http://localhost:4000";
const socket = io(server);
export default function App() {
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [roomJoined, setRoomJoined] = useState(false);
  const [roomCreated, setRoomCreated] = useState(false);
  const [users, setUsers] = useState([]);
  const [loggedIn, setLoggedIn] = useState(false);

  const [viewUsers, setViewUsers] = useState(false);
  useEffect(() => {
    socket.on("roomCreated", (username, roomCode) => {
      setRoomJoined(false);
      setRoomCreated(true);
      setRoomCode(roomCode);
    });
    socket.on("roomJoined", (username, roomCode) => {
      console.log("joined");
      setRoomJoined(true);
      setRoomCreated(false);
      setRoomCode(roomCode);
    });
    socket.on("newUser", ({ username }) => {
      let temp = users;
      temp.push(username);
      setUsers(temp);
    });
    socket.on("error", (msg) => console.log(msg));
  }, [socket]);

  if (roomJoined || roomCreated) {
    return (
      <div id="chat">
        {!viewUsers || <showUsers></showUsers>}
        <Title></Title>
        <Chat
          socket={socket}
          username={username}
          roomCode={roomCode}
          setRoomCode={setRoomCode}
        ></Chat>
      </div>
    );
  }

  if (loggedIn) {
    return (
      <Main
        username={username}
        setRoomJoined={setRoomJoined}
        setRoomCode={setRoomCode}
      ></Main>
    );
  }
  return (
    <StartPage
      // socket={socket}
      username={username}
      setUsername={setUsername}
      roomCode={roomCode}
      setRoomCode={setRoomCode}
      setRoomJoined={setRoomJoined}
      setLoggedIn={setLoggedIn}
    ></StartPage>
  );
}

function StartPage({
  setRoomJoined,
  setRoomCode,
  setLoggedIn,
  setUsername,
  username,
}) {
  const [login, setLogin] = useState(false);
  const [signUp, setSignUp] = useState(false);
  // const [username, setUsername] = useState("");
  const overlayRef = useRef(null);

  return (
    <div id="mainContainer">
      {!login || (
        <div
          className="overlay"
          onClick={(e) => {
            if (e.target === overlayRef.current) {
              setLogin(false);
            }
          }}
          ref={overlayRef}
        >
          <Login setLoggedIn={setLoggedIn} setUserName={setUsername}></Login>
        </div>
      )}
      {!signUp || (
        <div
          className="overlay"
          onClick={(e) => {
            if (e.target === overlayRef.current) {
              setSignUp(false);
            }
          }}
          ref={overlayRef}
        >
          <SignUp setSignUp={setSignUp} setLogin={setLogin}></SignUp>
        </div>
      )}
      <Title></Title>
      <div id="buttons">
        <button
          onClick={() => {
            setLogin(true);
            setSignUp(false);
          }}
        >
          LOGIN
        </button>
        <br />
        <button
          onClick={() => {
            setSignUp(true);
            setLogin(false);
          }}
        >
          SIGN UP
        </button>
      </div>
    </div>
  );
}

function Main({ username, setRoomJoined, setRoomCode }) {
  const [join, setJoin] = useState(false);
  const createRoom = () => {
    socket.emit("create", username);
  };
  const joinRoom = (code) => {
    console.log(username, code);
    socket.emit("join", username, code.toString());
  };
  const handleJoinRoom = () => {
    setJoin(true);
  };
  return (
    <div id="mainContainer">
      {!join || (
        <EnterRoomCode
          setJoin={setJoin}
          setRoomCode={setRoomCode}
          joinRoom={joinRoom}
        ></EnterRoomCode>
      )}
      <Title></Title>
      <div id="buttons">
        <button onClick={handleJoinRoom}>Join Room</button>
        <button onClick={createRoom}>Create Room</button>
      </div>
    </div>
  );
}

function EnterRoomCode({ setJoin, setRoomCode, joinRoom }) {
  const [code, setCode] = useState("");
  const overlayRef = useRef(null);
  const isString = (str) => {
    if (str.length > 4) {
      return true;
    }
    const strArr = str.split("");
    for (let i = 0; i < str.length; i++) {
      if (
        !["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(strArr[i])
      ) {
        return true;
      }
    }
    return false;
  };
  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === overlayRef.current) {
          setJoin(false);
        }
      }}
      ref={overlayRef}
    >
      <div>
        <div>Room Code</div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setJoin(false);
            setRoomCode(code);
            joinRoom(code);
          }}
        >
          {/* <label htmlFor="roomCode">Room Code</label> */}
          <input
            type="text"
            name="roomCode"
            value={code}
            onChange={(e) => {
              if (!isString(e.target.value)) {
                setCode(e.target.value);
              }
            }}
          />
          <button type="submit">Submit</button>
        </form>
      </div>
    </div>
  );
}

function showUsers({ users }) {
  return (
    <div id="overlay">
      <div>
        {users.map((user) => {
          return <div>{user}</div>;
        })}
      </div>
    </div>
  );
}

function Login({ setLoggedIn, setUserName }) {
  const usernameInput = useRef(null);
  const passwordInput = useRef(null);
  const handleSubmit = (e) => {
    e.preventDefault();
    const username = usernameInput.current.value;
    const password = passwordInput.current.value;
    fetch(`${server}/login?u=${username}&p=${password}`)
      .then((data) => {
        return data.json();
      })
      .then((res) => {
        if (res.status === "ok") {
          setUserName(username);
          setLoggedIn(true);
        }
      });
  };
  return (
    <div>
      <div>LOGIN</div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="username">Username:</label>
        <br />
        <input
          name="username"
          type="text"
          autoComplete="off"
          ref={usernameInput}
        ></input>
        <br />
        <label htmlFor="password">Password:</label>
        <br />
        <input
          name="password"
          type="password"
          autoComplete="off"
          ref={passwordInput}
        ></input>
        <br />
        <button type="submit">submit</button>
      </form>
    </div>
  );
}

function SignUp({ setSignUp, setLogin }) {
  const usernameInput = useRef(null);
  const passwordInput = useRef(null);
  const handleSubmit = (e) => {
    e.preventDefault();
    const username = usernameInput.current.value;
    const password = passwordInput.current.value;
    fetch(`${server}/signup?u=${username}&p=${password}`)
      .then((data) => {
        return data.json();
      })
      .then((res) => {
        if (res.status === "ok") {
          setLogin(true);
          setSignUp(false);
        }
      });
  };
  return (
    <div>
      <div>Signup</div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="username">Username:</label>
        <br />
        <input
          name="username"
          type="text"
          autoComplete="off"
          ref={usernameInput}
        ></input>
        <br />
        <label htmlFor="password">Password:</label>
        <br />
        <input
          name="password"
          type="password"
          autoComplete="off"
          ref={passwordInput}
        ></input>
        <br />
        <button type="submit">submit</button>
      </form>
    </div>
  );
}

function Chat({ socket, roomCode, username }) {
  const string = `room code = ${roomCode}`;
  console.log(roomCode);
  const [messages, setMessages] = useState([
    { from: username, msg: `${string}` },
  ]);

  const [msg, setMsg] = useState("");
  useEffect(() => {
    socket.on("msg", (res) => {
      const { username, msg } = res;
      console.log("recieved", username, msg);
      const tempArr = messages;
      tempArr.push({ from: username, msg: msg });
      setMessages([...tempArr]);
      console.log(messages);
    });
  }, [socket]);
  const sendMsg = (e) => {
    e.preventDefault();
    if (msg !== "") {
      console.log("sent", username, msg);
      socket.emit("msg", roomCode, msg, username);
    }
    setMsg("");
  };

  return (
    <>
      <Message messages={messages} username={username}></Message>
      <form onSubmit={sendMsg}>
        <Input msg={msg} setMsg={setMsg}></Input>

        <button
          className="btn"
          style={{ width: "clamp(0px, 100%, 100%)" }}
          type="submit"
        >
          Send
        </button>
      </form>
    </>
  );
}

function Message({ messages, username }) {
  return (
    <div id="messages">
      {messages.map((message, index) => {
        let sender = "";
        if (message.from === username) {
          sender = "You";
        } else {
          sender = message.from;
        }
        console.log(message.msg);
        return (
          <div className="msg" key={index}>{`${sender}: ${message.msg}`}</div>
        );
      })}
    </div>
  );
}

function Input({ msg, setMsg }) {
  return (
    <div>
      <input
        className="input"
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder="Message"
      ></input>
    </div>
  );
}

function Title() {
  return <div class="title">MDHCHT</div>;
}

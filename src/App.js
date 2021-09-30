import React, { useState, useRef, useReducer, useEffect } from "react";
import "./App.css";
import io from "socket.io-client";

const server = "192.168.100.23:4000";
const socket = io(`http://localhost:4000`);

export default function App() {
  const [username, setUserName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [roomCreated, setRoomCreated] = useState(false);
  const [roomJoined, setRoomJoined] = useState(false);
  useEffect(() => {
    socket.on("roomCreated", (username, roomCode) => {
      setRoomCreated(true);
      setRoomJoined(false);
      setRoomCode(roomCode);
    });
    socket.on("roomJoined", (username, roomCode) => {
      console.log("joined");
      setRoomCreated(false);
      setRoomJoined(true);
      setRoomCode(roomCode);
    });
    socket.on("error", (msg) => console.log(msg));
  }, [socket]);

  if (roomCreated || roomJoined) {
    return (
      <div id="chat">
        <Title></Title>
        <Chat socket={socket} username={username} roomCode={roomCode}></Chat>
      </div>
    );
  }
  return (
    <StartPage
      socket={socket}
      username={username}
      setUserName={setUserName}
      roomCode={roomCode}
      setRoomCode={setRoomCode}
    ></StartPage>
  );
}

function StartPage({}) {
  const [login, setLogin] = useState(false);
  const [signUp, setSignUp] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  if (loggedIn) {
    return <Main username={username}></Main>;
  }
  return (
    <>
      {!login || (
        <Login setLoggedIn={setLoggedIn} setUserName={setUsername}></Login>
      )}
      {!signUp || <SignUp setSignUp={setSignUp} setLogin={setLogin}></SignUp>}
      <Title></Title>
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
    </>
  );
}

function Main({ username }) {
  return <div>Main App</div>;
}

function Login({ setLoggedIn, setUserName }) {
  const usernameInput = useRef(null);
  const passwordInput = useRef(null);
  const handleSubmit = (e) => {
    e.preventDefault();
    const username = usernameInput.current.value;
    const password = passwordInput.current.value;
    fetch(`http://${server}/login?u=${username}&p=${password}`)
      .then((data) => {
        return data.json();
      })
      .then((res) => {
        if (res.status == "ok") {
          setUserName(username);
          setLoggedIn(true);
        }
      });
  };
  return (
    <>
      <div>LOGIN</div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="username">Username:</label>
        <input
          name="username"
          type="text"
          autoComplete="off"
          ref={usernameInput}
        ></input>
        <br />
        <label htmlFor="password">Password:</label>
        <input
          name="password"
          type="password"
          autoComplete="off"
          ref={passwordInput}
        ></input>
        <br />
        <button type="submit">submit</button>
      </form>
    </>
  );
}

function SignUp({ setSignUp, setLogin }) {
  const usernameInput = useRef(null);
  const passwordInput = useRef(null);
  const handleSubmit = (e) => {
    e.preventDefault();
    const username = usernameInput.current.value;
    const password = passwordInput.current.value;
    fetch(`http://${server}/signup?u=${username}&p=${password}`)
      .then((data) => {
        return data.json();
      })
      .then((res) => {
        if (res.status == "ok") {
          setLogin(true);
          setSignUp(false);
        }
      });
  };
  return (
    <>
      <div>Signup</div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="username">Username:</label>
        <input
          name="username"
          type="text"
          autoComplete="off"
          ref={usernameInput}
        ></input>
        <br />
        <label htmlFor="password">Password:</label>
        <input
          name="password"
          type="password"
          autoComplete="off"
          ref={passwordInput}
        ></input>
        <br />
        <button type="submit">submit</button>
      </form>
    </>
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
    if (msg != "") {
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
        if (message.from == username) {
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

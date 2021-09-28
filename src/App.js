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
  const [toast, setToast] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
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
    socket.on("newUser", (res) => {
      setToast(false);
      setTimeout(() => {
        setToast(true);
      }, 100);
      if (username === res.username) {
        setToastMsg(`You Joined`);
      } else {
        setToastMsg(`${res.username} joined`);
      }
    });
    socket.on("error", (msg) => console.log(msg));
  }, [socket]);

  if (roomCreated || roomJoined) {
    return (
      <>
        {toast || <Toast msg={toastMsg} toast={toast}></Toast>}
        <div id="chat">
          <Title></Title>
          <Chat socket={socket} username={username} roomCode={roomCode}></Chat>
        </div>
      </>
    );
  }
  return (
    <>
      {toast || <Toast msg={toastMsg} toast={toast}></Toast>}
      <StartPage
        socket={socket}
        username={username}
        setUserName={setUserName}
        roomCode={roomCode}
        setRoomCode={setRoomCode}
      ></StartPage>
    </>
  );
}

// function SignUp() {
//   const usernameInput = useRef(null);
//   const passwordInput = useRef(null);
//   const handleSubmit = (e) => {
//     e.preventDefault();
//     const username = usernameInput.current.value;
//     const password = passwordInput.current.value;
//     fetch(`http://${server}/signup?u=${username}`).then((res) => {
//       console.log(res);
//     });
//   };
//   return (
//     <>
//       <form onSubmit={handleSubmit}>
//         <label htmlFor="username">Username:</label>
//         <input
//           name="username"
//           type="text"
//           autoComplete="off"
//           ref={usernameInput}
//         ></input>
//         <br />
//         <label htmlFor="password">Password:</label>
//         <input
//           name="password"
//           type="password"
//           autoComplete="off"
//           ref={passwordInput}
//         ></input>
//         <br />
//         <button type="submit">submit</button>
//       </form>
//     </>
//   );
// }

function StartPage({ socket, username, setUserName, roomCode, setRoomCode }) {
  const handleSubmit = (e) => {
    if (!(username == "username" || username == "")) {
      e.preventDefault();
      if (roomCode == 0 || roomCode == "") {
        socket.emit("create", username);
      } else {
        console.log("join signal sent");
        socket.emit("join", username, roomCode);
      }
    }
  };
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
    <div id="mainContainer">
      <Title></Title>
      <br />
      <div className="form">
        <form onSubmit={handleSubmit} id="inputForm">
          <input
            type="text"
            id="usernameInput"
            autoComplete="off"
            className="input"
            placeholder="Username"
            value={username}
            onChange={(e) => {
              setUserName(e.target.value);
            }}
            onFocus={(e) => {
              e.target.value = "";
            }}
          />
          <br />
          <input
            type="text"
            id="roomCodeInput"
            className="input"
            autoComplete="off"
            value={roomCode}
            placeholder="Room Code"
            onChange={(e) => {
              if (isString(e.target.value)) {
                return false;
              }
              setRoomCode(e.target.value);
            }}
            onFocus={(e) => (e.target.value = "")}
          />
          <br />
          <button type="submit">Submit</button>
        </form>
      </div>
    </div>
  );
}

function Chat({ socket, roomCode, username }) {
  const string = `room code = ${roomCode}`;
  console.log(roomCode);
  const [messages, setMessages] = useState([
    { from: username, msg: `${string}` },
  ]);
  // useEffect(() => {
  //   setMessages([]);
  // }, []);
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

function Toast({ msg, toast }) {
  return <div className="toast">{msg}</div>;
}

import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import {
  AESDecrypt,
  AESEncrypt,
  base64ToBigint,
  base64ToUint8Array,
  bigintToBase64,
  ImportAESKey,
  RSA,
  uint8ArrayToBase64,
} from "./AES";
import "./App.css";

import { InitializeSessionReceiver, InitializeSessionSender } from "./test.js";

const E = 65537n;

const server = "http://localhost:4000";
const socket = io(server);

export default function App() {
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [roomJoined, setRoomJoined] = useState(false);
  const [roomCreated, setRoomCreated] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [roomKey, setRoomKey] = useState(null);

  // useEffect(() => {
  //   console.log("Starting test");
  //   main().then(() => {
  //     console.log("Test complete");
  //   });
  // }, []);

  useEffect(() => {
    socket.on("roomCreated", (username, roomCode) => {
      setRoomCode(roomCode);
      setRoomJoined(false);
      setRoomCreated(true);
    });
    socket.on(
      "roomJoined",
      async (username, roomCode, base64_encryptedAESKey) => {
        console.log("joined");
        setRoomCode(roomCode);
        setRoomJoined(true);
        setRoomCreated(false);

        const n = base64ToBigint(localStorage.getItem("n"));
        const d = base64ToBigint(localStorage.getItem("d"));
        console.log("Received base64_encryptedAESKey", base64_encryptedAESKey);
        const decryptedAESKey = await InitializeSessionReceiver(base64_encryptedAESKey, {
          private_key: [n, d],
        })
        console.log("Decrypted AES Key", decryptedAESKey);
        const aesKey = await ImportAESKey(decryptedAESKey);
        console.log("Received AES Key", aesKey);
        setRoomKey(aesKey);
        console.log(roomCode);
      }
    );
    socket.on("error", (msg) => console.log(msg));
  }, []);

  if (roomJoined || roomCreated) {
    return (
      <div id="chat">
        <Chat
          socket={socket}
          username={username}
          roomCode={roomCode}
          setRoomCode={setRoomCode}
          roomKey={roomKey}
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
        setRoomKey={setRoomKey}
      ></Main>
    );
  }
  return (
    <>
      <StartPage
        username={username}
        setUsername={setUsername}
        roomCode={roomCode}
        setRoomCode={setRoomCode}
        setRoomJoined={setRoomJoined}
        setLoggedIn={setLoggedIn}
      ></StartPage>
    </>
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

function Main({ username, setRoomJoined, setRoomCode, setRoomKey }) {
  const [join, setJoin] = useState(false);
  const [guestName, setGuestName] = useState("");

  useEffect(() => {
    const n = base64ToBigint(localStorage.getItem("n"));
    const d = base64ToBigint(localStorage.getItem("d"));
    console.log("KEYS")
    console.log("n", n);
    console.log("d", d);
  },[])

  const createRoom = async (guestName) => {
    const res = await fetch(`${server}/pub_key?u=${guestName}`);
    const data = await res.json();

    const enc_n = data.pub_key;
    console.log("enc n");
    console.log(enc_n);
    const n = base64ToBigint(enc_n);
    const e = E;

    console.log("Pub Key used for encryption", n);

    const [b64_aes_key, aes_key] = await InitializeSessionSender({
      public_key: [n, e],
    });

    setRoomKey(aes_key);
    console.log("SENT base64 = ", b64_aes_key);
    socket.emit("create", username, guestName, b64_aes_key);
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
        <input
          type="text"
          placeholder="Guest Name"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
        ></input>
        <br />
        <button
          onClick={() => {
            createRoom(guestName);
          }}
        >
          Create Room
        </button>
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

    const keys = RSA();
    const b64_d = bigintToBase64(keys.d);
    const b64_n = bigintToBase64(keys.n);
    console.log("SENT pub_key", b64_n);
    fetch(`${server}/signup?u=${username}&p=${password}&pub_key=${encodeURIComponent(b64_n)}`)
      .then((data) => {
        return data.json();
      })
      .then((res) => {
        if (res.status === "ok") {
          setLogin(true);
          setSignUp(false);
          localStorage.setItem("n", b64_n);
          localStorage.setItem("d", b64_d);
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

function Chat({ socket, roomCode, username, roomKey }) {
  const [showUsers, setShowUsers] = useState(false);
  const [users] = useState([]);
  console.log(roomCode);
  const [messages, setMessages] = useState([]);

  const [msg, setMsg] = useState("");

  useEffect(() => {
    socket.on("msg", async (res) => {
      const { username, msg } = res;
      console.log("recieved", username, msg);
      const { msg: encrypted, iv } = msg;

      const decryptedMsg = await AESDecrypt(
        base64ToUint8Array(encrypted),
        roomKey,
        base64ToUint8Array(iv)
      );
      const tempArr = messages;
      tempArr.push({ from: username, msg: decryptedMsg.decrypted });
      setMessages([...tempArr]);
      console.log(messages);
    });
    socket.on("updateUsers", (res) => {
      console.log(res);
    });
  }, [socket, messages, roomKey]);
  const sendMsg = async (e) => {
    e.preventDefault();
    if (msg !== "") {
      const { encrypted, iv } = await AESEncrypt(msg, roomKey);
      const encryptedMsg = {
        msg: uint8ArrayToBase64(encrypted),
        iv: uint8ArrayToBase64(iv),
      };
      console.log("sent", username, msg);
      socket.emit("msg", roomCode, encryptedMsg, username);
    }
    setMsg("");
  };

  const SideBarChildren = () => {
    const showUsers = () => {
      setShowUsers(true);
    };
    const leaveRoom = () => {
      console.log("I haven't programmed that path yet.(leave room)");
    };
    return (
      <div>
        <button onClick={showUsers}>Show Users</button>
        <button onClick={leaveRoom}>Leave Room</button>
      </div>
    );
  };

  return (
    <>
      {!showUsers || <ShowUsers users={users}></ShowUsers>}
      <Sidebar
        color="white"
        Children={
          <SideBarChildren setShowUsers={setShowUsers}></SideBarChildren>
        }
      ></Sidebar>
      <Title></Title>
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
function ShowUsers({ users }) {
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
function Sidebar({ color, Children }) {
  const [showChildren, setShowChildren] = useState(false);
  const clickHandler = () => {
    setShowChildren(!showChildren);
  };
  return (
    <>
      <div onClick={clickHandler}>
        <svg xmlns="http://www.w3.org/2000/svg" height="30" width="50">
          <rect width="40" height="5" x="5" y="0" fill={color} />
          <rect width="40" height="5" x="5" y="10" fill={color} />
          <rect width="40" height="5" x="5" y="20" fill={color} />
        </svg>
      </div>
      {!showChildren || <div id="sidebarChildren">{Children}</div>}
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
  return <div className="title">MDHCHT</div>;
}

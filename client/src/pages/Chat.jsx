import { useEffect, useState, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";
import "./Chat.css";

const socket = io("http://localhost:5000");

export default function Chat() {
  const token = sessionStorage.getItem("token");
  const bottomRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState({});
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [unread, setUnread] = useState({});

  const [notify, setNotify] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);

  // 🔥 sidebar view control
  const [sideView, setSideView] = useState(null);
  // null | "requests" | "users"

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const getConversationId = (a, b) => [a, b].sort().join("_");

  /* ================= AUTH ================= */
  useEffect(() => {
    if (!token) {
      window.location.href = "/";
      return;
    }

    axios
      .get("http://localhost:5000/api/users/me", authHeader)
      .then((res) => setCurrentUser(res.data))
      .catch(() => {
        sessionStorage.clear();
        window.location.href = "/";
      });
  }, []);

  /* ================= USERS ================= */
  useEffect(() => {
    if (!currentUser) return;

    axios
      .get("http://localhost:5000/api/users", authHeader)
      .then((res) =>
        setUsers(res.data.filter((u) => u._id !== currentUser._id))
      );
  }, [currentUser]);

  /* ================= CONNECTIONS & REQUESTS ================= */
  useEffect(() => {
    if (!currentUser) return;

    axios
      .get("http://localhost:5000/api/follow/connections", authHeader)
      .then((res) => setConnections(res.data || []));

    axios
      .get("http://localhost:5000/api/follow/requests", authHeader)
      .then((res) => setRequests(res.data || []));
      
      axios
  .get("http://localhost:5000/api/follow/sent", authHeader)
  .then((res) => {
    console.log("SENT REQUESTS 👉", res.data); // 🔥
    setSentRequests(res.data || []);
  });

  }, [currentUser]);

  /* ================= SOCKET ================= */
  useEffect(() => {
    if (!currentUser) return;

    socket.emit("join", currentUser._id);

    socket.on("newMessage", (msg) => {
      const cid = getConversationId(msg.sender, msg.receiver);

      setMessages((prev) => ({
        ...prev,
        [cid]: [...(prev[cid] || []), msg],
      }));

      if (
        selectedUser?._id !== msg.sender &&
        msg.sender !== currentUser._id
      ) {
        setUnread((prev) => ({
          ...prev,
          [msg.sender]: (prev[msg.sender] || 0) + 1,
        }));
      }
    });

    socket.on("messageSeen", ({ conversationId }) => {
      setMessages((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map((m) =>
          m.sender === currentUser._id
            ? { ...m, status: "seen" }
            : m
        ),
      }));
    });

    socket.on("onlineUsers", (u) => setOnlineUsers(u || []));

    return () => socket.off();
  }, [currentUser, selectedUser]);

  /* ================= LOAD MESSAGES ================= */
  useEffect(() => {
    if (!selectedUser || !currentUser) return;

    const cid = getConversationId(currentUser._id, selectedUser._id);

    axios
      .get(
        `http://localhost:5000/api/messages/${selectedUser._id}`,
        authHeader
      )
      .then((res) => {
        const msgs = res.data || [];

        setMessages((prev) => ({
          ...prev,
          [cid]: msgs,
        }));

        const shouldEmitSeen = msgs.some(
          (m) =>
            m.sender === selectedUser._id &&
            m.receiver === currentUser._id &&
            m.status !== "seen"
        );

        if (shouldEmitSeen) {
          socket.emit("seenMessage", {
            sender: selectedUser._id,
            receiver: currentUser._id,
          });
        }
      });

    setUnread((prev) => ({ ...prev, [selectedUser._id]: 0 }));
  }, [selectedUser]);

  useEffect(() => {
    if (!selectedUser || !currentUser) return;

    const cid = getConversationId(currentUser._id, selectedUser._id);
    const msgs = messages[cid] || [];

    const hasUnseenIncoming = msgs.some(
      (m) =>
        m.sender === selectedUser._id &&
        m.receiver === currentUser._id &&
        m.status !== "seen"
    );

    if (hasUnseenIncoming) {
      socket.emit("seenMessage", {
        sender: selectedUser._id,
        receiver: currentUser._id,
      });
    }
  }, [messages, selectedUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedUser]);

  /* ================= HELPERS ================= */
  const isConnected = (id) =>
    connections.some(
      (c) =>
        (c.sender?._id === id || c.receiver?._id === id) &&
        c.status !== "disconnected"
    );

const isRequested = (id) =>
  sentRequests.some(
    (r) =>
      r.receiver === id ||
      r.receiver?._id === id
  );



  const isOnline = (id) => onlineUsers.includes(id);

  const isConnectedWithSelectedUser = () =>
    selectedUser && isConnected(selectedUser._id);

  /* ================= ACTIONS ================= */
  const sendFollow = async (id) => {
    try {
      await axios.post(
        `http://localhost:5000/api/follow/send/${id}`,
        {},
        authHeader
      );
       setSentRequests((prev) =>
  prev.some((r) => r.receiver?._id === id)
    ? prev
    : [...prev, { receiver: { _id: id } }]
);

      setNotify("Follow request sent ✅");
    } catch {
      setNotify("Something went wrong ❌");
    }
    setTimeout(() => setNotify(""), 3000);
  };

  const acceptRequest = (id) =>
    axios
      .post(`http://localhost:5000/api/follow/accept/${id}`, {}, authHeader)
      .then(() => window.location.reload());

  const rejectRequest = (id) =>
    axios
      .post(`http://localhost:5000/api/follow/reject/${id}`, {}, authHeader)
      .then(() => window.location.reload());

  const disconnectUser = async (id) => {
    try {
      await axios.post(
        `http://localhost:5000/api/follow/disconnect/${id}`,
        {},
        authHeader
      );

      setNotify("Disconnected ❌");
      setSelectedUser(null);

      const res = await axios.get(
        "http://localhost:5000/api/follow/connections",
        authHeader
      );
      setConnections(res.data || []);
    } catch {
      setNotify("Failed to disconnect ❌");
    }
    setTimeout(() => setNotify(""), 3000);
  };

  const sendMessage = () => {
    if (!message.trim() || !selectedUser || !isConnectedWithSelectedUser())
      return;

    socket.emit("privateMessage", {
      sender: currentUser._id,
      receiver: selectedUser._id,
      text: message,
    });

    setMessage("");
  };

  const logout = () => {
    sessionStorage.clear();
    window.location.href = "/";
  };

  if (!currentUser) return null;

  const convId =
    selectedUser &&
    getConversationId(currentUser._id, selectedUser._id);

  return (
    <div className="app">
      {notify && <div className="notification">{notify}</div>}

      {/* ================= SIDEBAR ================= */}
      <div className={`sidebar ${showSidebar ? "show" : ""}`}>
        <div className="profile">
          👋 {currentUser.name}
          <div className="username">@{currentUser.username}</div>
        </div>

        {/* ===== MAIN SIDEBAR : CHATS ===== */}
       {sideView === null && (
  <>
    {/* ===== HEADER ===== */}
    <div className="user-header">
      <span className="heading">Chats</span>
      <input
        className="search"
        placeholder="Search users"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>

    {/* ===== BUTTONS (ABOVE CHATS) ===== */}
    {requests.length > 0 && (
      <div
        className="open-side-btn"
        onClick={() => setSideView("requests")}
      >
        Requests ({requests.length})
      </div>
    )}

    <div
      className="open-side-btn"
      onClick={() => setSideView("users")}
    >
      Find  All Users
    </div>

    {/* ===== CONNECTED CHATS (LAST) ===== */}
    {users
      .filter(
        (u) =>
          isConnected(u._id) &&
          u.username
            ?.toLowerCase()
            .includes(search.toLowerCase())
      )
      .map((u) => (
        <div
          key={u._id}
          className="user-card"
          onClick={() => {
            setSelectedUser(u);
            setShowSidebar(false);
          }}
        >
          <div className="side-avatar">
            {u.name.charAt(0).toUpperCase()}
          </div>

          <div className="user-info">
            <div className="uname">@{u.username}</div>
            <div className="name">{u.name}</div>
          </div>

          {unread[u._id] > 0 && (
            <span className="unread-badge">
              {unread[u._id]}
            </span>
          )}
        </div>
      ))}
  </>
)}


        {/* ===== REQUESTS SIDEBAR ===== */}
        {sideView === "requests" && (
          <div className="side-panel">
            <div className="side-header">
              <button onClick={() => setSideView(null)}>←</button>
              <span>Requests</span>
            </div>

            {requests.map((r) => (
              <div key={r._id} className="user-card">
                <div className="side-avatar">
                  {r.sender.name.charAt(0).toUpperCase()}
                </div>

                <div className="user-info">
                  <div className="uname">@{r.sender.username}</div>
                  <div className="name">{r.sender.name}</div>
                </div>

                <div className="request-actions">
                  <button onClick={() => acceptRequest(r._id)}>✓</button>
                  <button onClick={() => rejectRequest(r._id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== FIND USERS SIDEBAR ===== */}
        {sideView === "users" && (
          <div className="side-panel">
            <div className="side-header">
              <button onClick={() => setSideView(null)}>←</button>
              <span>Find Users</span>
            </div>

            <input
              className="search"
              placeholder="Search users"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {users
              .filter((u) =>
                !isConnected(u._id) &&
                u.username
                  ?.toLowerCase()
                  .includes(search.toLowerCase())
              )
              .map((u) => (
                <div key={u._id} className="user-card">
                  <div className="side-avatar">
                    {u.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="user-info">
                    <div className="uname">@{u.username}</div>
                    <div className="name">{u.name}</div>
                  </div>

                  {!isConnected(u._id) && !isRequested(u._id) && (
                    <button
                      className="follow"
                      onClick={() => sendFollow(u._id)}
                    >
                      Follow
                    </button>
                  )}

                 {isRequested(u._id) && (
  <button className="requested-btn" disabled>
    Requested
  </button>
)}

                </div>
              ))}
          </div>
        )}

        <button className="logout" onClick={logout}>
          Logout
        </button>
      </div>

      {/* ================= CHAT ================= */}
      <div className={`chat ${!showSidebar ? "show" : ""}`}>
        {selectedUser ? (
          <>
            <div className="chat-header">
              <div className="chat-user">
                <button
                  className="back-btn"
                  onClick={() => setShowSidebar(true)}
                >
                  ←
                </button>

                <div className="chat-avatar-wrapper">
                  <div className="chat-avatar">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  {isOnline(selectedUser._id) && (
                    <span className="chat-online-dot"></span>
                  )}
                </div>

                <span className="chat-username">
                  {selectedUser.name}
                </span>
              </div>

              {isConnectedWithSelectedUser() && (
                <button
                  className="disconnect-btn"
                  onClick={() =>
                    disconnectUser(selectedUser._id)
                  }
                >
                  Unfollow
                </button>
              )}
            </div>

            <div className="messages">
              {(messages[convId] || []).map((m, i) => (
                <div
                  key={i}
                  className={`bubble ${
                    m.sender === currentUser._id ? "me" : ""
                  }`}
                >
                  {m.text}
                  {m.sender === currentUser._id && (
                    <span className={`seen ${m.status}`}>
                      {m.status === "sent"
                        ? "✔"
                        : m.status === "delivered"
                        ? "✔✔"
                        : "✔✔"}
                    </span>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="input-box">
              {isConnectedWithSelectedUser() ? (
                <>
                  <input
                    className="input"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={(e) =>
                      e.key === "Enter" && sendMessage()
                    }
                  />
                  <button className="send" onClick={sendMessage}>
                    ➤
                  </button>
                </>
              ) : (
                <div className="chat-disabled">
                  You are disconnected. Follow again to chat.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="empty">
            Select a user to start chatting 💬
          </div>
        )}
      </div>
    </div>
  );
}

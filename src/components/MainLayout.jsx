import React, { useEffect, useState, useRef } from "react";
import api from "../api";

export default function MainLayout({ user, onLogout }) {
  const [friends, setFriends] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  const [feed, setFeed] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);

  const [newPostCaption, setNewPostCaption] = useState("");
  const [newPostImageUrl, setNewPostImageUrl] = useState("");

  const [commentInputs, setCommentInputs] = useState({});

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef(null);

  // ✅ 친구 추가 모달 상태
  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
  const [friendSearchEmail, setFriendSearchEmail] = useState("");
  const [friendSearchResult, setFriendSearchResult] = useState(null);
  const [friendSearchMessage, setFriendSearchMessage] = useState("");

  // ✅ 방 생성 모달 상태
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);

  // 친구 / 방 목록 로딩
  const loadFriends = async () => {
    try {
      const res = await api.get("/friends/list");
      setFriends(res.data.friends || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadRooms = async () => {
    try {
      const res = await api.get("/rooms/my");
      const r = res.data.rooms || [];
      setRooms(r);
      if (!selectedRoomId && r.length > 0) setSelectedRoomId(r[0]._id);
    } catch (err) {
      console.error(err);
    }
  };

  // 피드 로딩
  const loadFeed = async (roomId) => {
    if (!roomId) return;
    setLoadingFeed(true);
    try {
      const res = await api.get(`/posts/room/${roomId}`);
      setFeed(res.data.posts || res.data.feed || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFeed(false);
    }
  };

  // 채팅 로딩
  const loadChat = async (roomId) => {
    if (!roomId) return;
    try {
      const res = await api.get(`/chat/${roomId}`);
      setChatMessages(res.data.messages || []);
    } catch (err) {
      console.error(err);
    }
  };

  // 처음 진입 시 친구/방 로딩
  useEffect(() => {
    loadFriends();
    loadRooms();
  }, []);

  // 방 선택 바뀔 때마다 피드 + 채팅 로딩
  useEffect(() => {
    if (!selectedRoomId) return;
    loadFeed(selectedRoomId);
    loadChat(selectedRoomId);
  }, [selectedRoomId]);

  // 채팅 자동 스크롤
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // 채팅 폴링 (3초마다 새 메시지 체크)
  useEffect(() => {
    if (!selectedRoomId) return;
    const id = setInterval(() => {
      loadChat(selectedRoomId);
    }, 3000);
    return () => clearInterval(id);
  }, [selectedRoomId]);

  const currentRoom = rooms.find((r) => r._id === selectedRoomId);

  // 좋아요
  const handleLike = async (postId) => {
    try {
      const res = await api.post(`/posts/${postId}/like`);
      const updated = res.data.post;
      setFeed((prev) => prev.map((p) => (p._id === postId ? updated : p)));
    } catch (err) {
      console.error(err);
    }
  };

  // 댓글
  const handleCommentChange = (postId, text) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: text }));
  };

  const handleCommentSubmit = async (postId) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;
    try {
      const res = await api.post(`/posts/${postId}/comment`, { text });
      const updated = res.data.post;
      setFeed((prev) => prev.map((p) => (p._id === postId ? updated : p)));
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      console.error(err);
    }
  };

  // 새 글 작성
  const handleCreatePost = async () => {
    if (!selectedRoomId) {
      alert("먼저 채팅방(일기방)을 선택해주세요.");
      return;
    }
    if (!newPostCaption.trim() && !newPostImageUrl.trim()) {
      alert("내용이나 이미지 URL 중 하나는 입력해야 합니다.");
      return;
    }

    try {
      const body = {
        roomId: selectedRoomId,
        caption: newPostCaption.trim(),
        imageUrl: newPostImageUrl.trim() || undefined,
      };
      const res = await api.post("/posts", body);
      const created = res.data.post || res.data.newPost || res.data;
      setFeed((prev) => [created, ...prev]);
      setNewPostCaption("");
      setNewPostImageUrl("");
    } catch (err) {
      console.error(err);
      alert("게시글 작성 중 오류가 발생했습니다.");
    }
  };

  // 채팅 전송
  const handleSendChat = async () => {
    if (!selectedRoomId) return;
    if (!chatInput.trim()) return;

    setChatLoading(true);
    try {
      const res = await api.post(`/chat/${selectedRoomId}`, {
        text: chatInput.trim(),
      });
      const msg = res.data.data;
      setChatMessages((prev) => [...prev, msg]);
      setChatInput("");
    } catch (err) {
      console.error(err);
      alert("메시지 전송 중 오류가 발생했습니다.");
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  // ✅ 친구 추가 모달 동작
  const openFriendModal = () => {
    setFriendSearchEmail("");
    setFriendSearchResult(null);
    setFriendSearchMessage("");
    setIsFriendModalOpen(true);
  };

  const handleFriendSearch = async () => {
    setFriendSearchResult(null);
    setFriendSearchMessage("");
    if (!friendSearchEmail.trim()) {
      setFriendSearchMessage("이메일을 입력해주세요.");
      return;
    }
    try {
      const res = await api.get("/friends/search", {
        params: { email: friendSearchEmail.trim() },
      });
      setFriendSearchResult(res.data.user);
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.error || "검색 중 오류가 발생했습니다.";
      setFriendSearchMessage(msg);
    }
  };

  const handleAddFriend = async () => {
    if (!friendSearchResult) return;
    try {
      await api.post("/friends/add", { friendId: friendSearchResult._id });
      setFriendSearchMessage("친구 추가 완료!");
      setFriendSearchResult(null);
      setFriendSearchEmail("");
      loadFriends();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.error || "친구 추가 중 오류가 발생했습니다.";
      setFriendSearchMessage(msg);
    }
  };

  // ✅ 방 생성 모달 동작
  const openRoomModal = () => {
    setNewRoomName("");
    setSelectedFriendIds([]);
    setIsRoomModalOpen(true);
  };

  const toggleFriendSelect = (id) => {
    setSelectedFriendIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      alert("방 이름을 입력해주세요.");
      return;
    }
    try {
      const res = await api.post("/rooms", {
        name: newRoomName.trim(),
        memberIds: selectedFriendIds,
      });
      const room = res.data.room;
      await loadRooms();
      setSelectedRoomId(room._id);
      setIsRoomModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(
        err?.response?.data?.error ||
          "방 생성 중 오류가 발생했습니다."
      );
    }
  };

  return (
    <div className="app-wrapper">
      <div className="stars-layer" />
      <div className="app-shell">
        {/* 왼쪽: 친구 / 채팅방 리스트 */}
        <aside className="sidebar">
          <div className="logo-area">
            <div className="logo-icon">📔</div>
            <div>
              <div className="logo-title">비밀일기장 ✨</div>
              <div className="logo-sub">어서 와, {user.name}님</div>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-header-row">
              <div className="section-title">친구들</div>
              <button
                className="pill-btn"
                type="button"
                onClick={openFriendModal}
              >
                + 친구 추가
              </button>
            </div>
            <ul className="friend-list">
              {friends.map((f) => (
                <li className="friend-item" key={f._id}>
                  <div className="avatar">
                    {f.name?.slice(0, 1) || "친"}
                  </div>
                  <div className="friend-name">{f.name}</div>
                </li>
              ))}
              {friends.length === 0 && (
                <div className="empty-text">아직 친구가 없어요 😭</div>
              )}
            </ul>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-header-row">
              <div className="section-title">채팅방</div>
              <button
                className="pill-btn"
                type="button"
                onClick={openRoomModal}
              >
                + 새 채팅방
              </button>
            </div>
            <ul className="chatroom-list">
              {rooms.map((room) => (
                <li
                  key={room._id}
                  className={
                    "chatroom-item" +
                    (room._id === selectedRoomId ? " active" : "")
                  }
                  onClick={() => setSelectedRoomId(room._id)}
                >
                  <div>
                    <div className="chatroom-name">{room.name}</div>
                    <div className="chatroom-desc">
                      멤버 {room.members?.length || 0}명
                    </div>
                  </div>
                  <span className="chatroom-badge">
                    {room.unreadCount || ""}
                  </span>
                </li>
              ))}
              {rooms.length === 0 && (
                <div className="empty-text">
                  아직 속한 방이 없어요. 방을 만들어보세요!
                </div>
              )}
            </ul>
          </div>

          <button className="btn-secondary logout-btn" onClick={onLogout}>
            로그아웃
          </button>
        </aside>

        {/* 가운데: 피드 */}
        <main className="feed">
          <div className="feed-header-top">
            <div>
              <div className="feed-room-title">
                {currentRoom ? currentRoom.name : "방을 선택해주세요"}
              </div>
              {currentRoom && (
                <div className="feed-room-sub">
                  멤버 {currentRoom.members?.length || 0}명과 함께 쓰는 비밀일기
                </div>
              )}
            </div>
          </div>

          {/* 새 글 작성 박스 */}
          <div className="feed-new-post">
            <textarea
              className="new-post-text"
              placeholder="오늘 있었던 일을 적어볼래요?"
              value={newPostCaption}
              onChange={(e) => setNewPostCaption(e.target.value)}
            />
            <input
              className="new-post-image"
              placeholder="이미지 URL (선택)"
              value={newPostImageUrl}
              onChange={(e) => setNewPostImageUrl(e.target.value)}
            />
            <div className="new-post-actions">
              <div className="new-post-hint">
                선택한 방에 공유됩니다.
              </div>
              <button className="btn-primary" onClick={handleCreatePost}>
                공유하기
              </button>
            </div>
          </div>

          <div className="feed-scroll">
            {loadingFeed && (
              <div className="feed-loading">피드를 불러오는 중...</div>
            )}
            {!loadingFeed && feed.length === 0 && (
              <div className="feed-empty">
                아직 글이 없어요. 첫 번째 일기를 남겨볼까요? ✨
              </div>
            )}

            {!loadingFeed &&
              feed.map((post) => (
                <article className="feed-card" key={post._id}>
                  <header className="feed-header">
                    <div className="avatar">
                      {post.author?.name?.slice(0, 1) || "유"}
                    </div>
                  <div>
                      <div className="feed-author">
                        {post.author?.name || "익명"}
                      </div>
                      <div className="feed-meta">
                        {post.createdAt &&
                          new Date(post.createdAt).toLocaleString("ko-KR", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                      </div>
                    </div>
                  </header>

                  {post.imageUrl && (
                    <div className="feed-image">
                      <img src={post.imageUrl} alt="post" />
                    </div>
                  )}

                  {post.caption && (
                    <p className="feed-text">{post.caption}</p>
                  )}

                  <div className="feed-actions">
                    <span onClick={() => handleLike(post._id)}>
                      ♡ {post.likes?.length || 0}
                    </span>
                    <span>💬 {post.comments?.length || 0}</span>
                  </div>

                  <div className="feed-footer">
                    {post.comments?.slice(-1).map((c) => (
                      <div
                        key={c._id}
                        className="feed-comment-main"
                      >{`${c.user?.name || "익명"}: ${c.text}`}</div>
                    ))}

                    <div className="comment-input-row">
                      <input
                        className="comment-input"
                        placeholder="댓글을 남겨보세요..."
                        value={commentInputs[post._id] || ""}
                        onChange={(e) =>
                          handleCommentChange(post._id, e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCommentSubmit(post._id);
                        }}
                      />
                      <button
                        className="comment-send-btn"
                        onClick={() => handleCommentSubmit(post._id)}
                      >
                        ➤
                      </button>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        </main>

        {/* 오른쪽: 실제 채팅 패널 */}
        <section className="chat-panel">
          <div className="chat-panel-header">
            <div>{currentRoom ? currentRoom.name : "비밀의 방"}</div>
            <span>채팅</span>
          </div>

          <div className="chat-messages" ref={chatScrollRef}>
            {chatMessages.map((m) => {
              const isMe = m.user?._id === user.id;
              return (
                <div
                  key={m._id}
                  className={"chat-row " + (isMe ? "me" : "other")}
                >
                  {!isMe && (
                    <div className="avatar small">
                      {m.user?.name?.slice(0, 1) || "친"}
                    </div>
                  )}
                  <div>
                    <div
                      className={
                        "chat-bubble " + (isMe ? "me" : "other")
                      }
                    >
                      {m.text}
                    </div>
                    <div
                      className={
                        "chat-meta " + (isMe ? "right" : "")
                      }
                    >
                      {m.user?.name || "알 수 없음"} ·{" "}
                      {m.createdAt &&
                        new Date(m.createdAt).toLocaleTimeString(
                          "ko-KR",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
            {chatMessages.length === 0 && (
              <div className="feed-empty">
                아직 채팅이 없어요. 먼저 말을 걸어볼까요? 💬
              </div>
            )}
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              placeholder="메시지를 입력하세요..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleChatKeyDown}
              disabled={!selectedRoomId || chatLoading}
            />
            <button
              className="chat-send-btn"
              onClick={handleSendChat}
              disabled={!selectedRoomId || chatLoading}
            >
              ➤
            </button>
          </div>
        </section>
      </div>

      {/* ✅ 친구 추가 모달 */}
      {isFriendModalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>친구 추가</h3>
            <p className="modal-sub">
              이메일로 친구를 검색해서 추가할 수 있어요.
            </p>
            <input
              className="input"
              placeholder="friend@example.com"
              value={friendSearchEmail}
              onChange={(e) => setFriendSearchEmail(e.target.value)}
            />
            <button className="btn-primary" onClick={handleFriendSearch}>
              친구 검색
            </button>

            {friendSearchResult && (
              <div className="modal-result">
                <div>{friendSearchResult.name}</div>
                <div className="modal-email">
                  {friendSearchResult.email}
                </div>
                <button className="btn-secondary" onClick={handleAddFriend}>
                  친구로 추가
                </button>
              </div>
            )}

            {friendSearchMessage && (
              <div className="modal-message">{friendSearchMessage}</div>
            )}

            <button
              className="modal-close"
              onClick={() => setIsFriendModalOpen(false)}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* ✅ 새 채팅방 생성 모달 */}
      {isRoomModalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>새 채팅방 만들기</h3>
            <p className="modal-sub">
              함께 대화할 친구들을 선택해 주세요.
            </p>
            <input
              className="input"
              placeholder="방 이름"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
            />

            <div className="modal-friend-list">
              {friends.length === 0 && (
                <div className="empty-text">
                  먼저 친구를 추가해 주세요.
                </div>
              )}
              {friends.map((f) => (
                <label key={f._id} className="modal-friend-item">
                  <input
                    type="checkbox"
                    checked={selectedFriendIds.includes(f._id)}
                    onChange={() => toggleFriendSelect(f._id)}
                  />
                  <span>{f.name}</span>
                </label>
              ))}
            </div>

            <button className="btn-primary" onClick={handleCreateRoom}>
              채팅방 생성
            </button>

            <button
              className="modal-close"
              onClick={() => setIsRoomModalOpen(false)}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

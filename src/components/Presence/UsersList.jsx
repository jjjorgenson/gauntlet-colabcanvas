export const UsersList = ({ onlineUsers, currentUser }) => {
  const otherUsers = onlineUsers.filter(user => user.user_id !== currentUser?.id)
  
  return (
    <div className="users-list">
      <h4>Online Users ({onlineUsers.length})</h4>
      <div className="users">
        {onlineUsers.map((user) => (
          <div 
            key={user.user_id} 
            className={`user-item ${user.user_id === currentUser?.id ? 'current-user' : ''} ${user.isIdle ? 'idle' : ''}`}
          >
            <div 
              className={`user-color ${user.isIdle ? 'idle' : ''}`}
              style={{ backgroundColor: user.color || '#3B82F6' }}
            />
            <span className="username">
              {user.username}
              {user.user_id === currentUser?.id && ' (You)'}
              {user.isIdle && ' (idle)'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}


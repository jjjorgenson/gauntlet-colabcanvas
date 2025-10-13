import { COLOR_PALETTE } from '../../lib/constants'

export const Toolbar = ({ 
  onAddRectangle, 
  selectedColor, 
  onColorChange, 
  onLogout,
  username 
}) => {
  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <h3>CollabCanvas</h3>
        <span className="username">Welcome, {username}</span>
      </div>
      
      <div className="toolbar-section">
        <button 
          onClick={onAddRectangle}
          className="toolbar-button primary"
        >
          + Add Rectangle
        </button>
      </div>
      
      <div className="toolbar-section">
        <label>Color:</label>
        <div className="color-palette">
          {COLOR_PALETTE.map((color) => (
            <button
              key={color}
              className={`color-button ${selectedColor === color ? 'selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => onColorChange(color)}
              title={color}
            />
          ))}
        </div>
      </div>
      
      <div className="toolbar-section">
        <button 
          onClick={onLogout}
          className="toolbar-button secondary"
        >
          Logout
        </button>
      </div>
    </div>
  )
}


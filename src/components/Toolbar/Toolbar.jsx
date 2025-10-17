import { COLOR_PALETTE } from '../../lib/constants'

export const Toolbar = ({ 
  onAddRectangle,
  onAddCircle,
  onAddText,
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
          + Rectangle
        </button>
        <button 
          onClick={onAddCircle}
          className="toolbar-button primary"
        >
          + Circle
        </button>
        <button 
          onClick={onAddText}
          className="toolbar-button primary"
        >
          + Text
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


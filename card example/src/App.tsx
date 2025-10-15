import svgPaths from "./imports/svg-4p7w0j39fj";
import imgImage from "figma:asset/54ca3dc26982ea8bf0465b1f9de6b083e97871e9.png";
import "./styles/card.css";

export default function App() {
  return (
    <div className="container">
      <div className="card">
        {/* Image */}
        <div className="card-image-wrapper">
          <img 
            alt="Plant leaves" 
            className="card-image" 
            src={imgImage} 
          />
        </div>
        
        {/* Content */}
        <div className="card-content">
          {/* Top row with number and status */}
          <div className="card-top-row">
            {/* Left column */}
            <div>
              <p className="card-number">58</p>
              <p className="card-title">Plant monitor</p>
              <p className="card-timestamp">24 minutes ago</p>
            </div>
            
            {/* Right column */}
            <div className="card-status">
              1/4
            </div>
          </div>
          
          {/* Settings icon */}
          <div className="card-icon-wrapper">
            <div className="card-icon">
              <svg fill="none" viewBox="0 0 24 24">
                <g clipPath="url(#clip0_1_28)">
                  <path 
                    d={svgPaths.p3cccb600} 
                    stroke="#152A38" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                  />
                  <path 
                    d={svgPaths.p3737f500} 
                    stroke="#152A38" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                  />
                </g>
                <defs>
                  <clipPath id="clip0_1_28">
                    <rect fill="white" height="24" width="24" />
                  </clipPath>
                </defs>
              </svg>
            </div>
          </div>
        </div>
        
        {/* Border overlay */}
        <div className="card-border" />
      </div>
    </div>
  );
}

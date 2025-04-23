import React, { useEffect, useState } from 'react';
import './App.css';

// Group features by user journey stages with icons
const FEATURE_GROUPS = {
  'Device Information': {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
        <line x1="12" y1="18" x2="12" y2="18"></line>
      </svg>
    ),
    features: [
      'device_mobile',
      'device_computer',
      'device_tablet',
      'returning_user',
    ]
  },
  'Homepage Interaction': {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    ),
    features: [
      'saw_homepage',
      'promo_banner_click',
      'sign_in',
    ]
  },
  'Product Browsing': {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    ),
    features: [
      'sort_by',
      'list_size_dropdown',
      'image_picker',
    ]
  },
  'Shopping Cart': {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
      </svg>
    ),
    features: [
      'basket_icon_click',
      'basket_add_list',
      'basket_add_detail',
      'closed_minibasket_click',
    ]
  },
  'Checkout Process': {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
        <line x1="1" y1="10" x2="23" y2="10"></line>
      </svg>
    ),
    features: [
      'saw_checkout',
      'checked_delivery_detail',
      'checked_returns_detail',
    ]
  },
};

// Flatten feature groups for API compatibility
const FEATURE_LIST = Object.values(FEATURE_GROUPS).flatMap(group => group.features);

// Model name mapping
const MODEL_DISPLAY_NAMES = {
  'best_logistic_regression_model.pkl': 'Logistic Regression',
  'best_random_forest_model.pkl': 'Random Forest',
  'best_xgboost_model.pkl': 'XGBoost'
};

function App() {
  const [features, setFeatures] = useState(() =>
    FEATURE_LIST.reduce((acc, f) => ({ ...acc, [f]: 0 }), {})
  );
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCount, setSelectedCount] = useState(0);
  const [activeTab, setActiveTab] = useState('features'); // 'features' or 'results'

  useEffect(() => {
    fetch('http://localhost:5000/models')
      .then(res => res.json())
      .then(data => setModels(data.models || []))
      .catch(() => setError('Could not fetch models'));
  }, []);

  useEffect(() => {
    // Count selected features
    const count = Object.values(features).filter(v => v === 1).length;
    setSelectedCount(count);
  }, [features]);

  const handleCheckbox = (feature) => {
    setFeatures(prev => ({ ...prev, [feature]: prev[feature] ? 0 : 1 }));
  };

  const handleModelChange = (modelName) => {
    // Only proceed if the model is actually changing
    if (selectedModel === modelName) return;
    
    // Update the selected model
    setSelectedModel(modelName);
    
    // If we're on the results page, automatically trigger a prediction
    if (activeTab === 'results' && selectedCount > 0 && !loading) {
      // Directly call the prediction logic
      makePrediction(modelName);
    }
  };

  // Separate prediction logic to be called from both handleSubmit and handleModelChange
  const makePrediction = async (model) => {
    if (!model || loading || selectedCount === 0) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features, model }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setActiveTab('results'); // Switch to results tab after successful prediction
      } else {
        setError(data.error || 'Prediction failed');
      }
    } catch (err) {
      setError('No response from backend.');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    makePrediction(selectedModel);
  };

  const formatFeatureName = (name) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getModelDisplayName = (modelFileName) => {
    return MODEL_DISPLAY_NAMES[modelFileName] || modelFileName;
  };

  const resetForm = () => {
    setFeatures(FEATURE_LIST.reduce((acc, f) => ({ ...acc, [f]: 0 }), {}));
    setResult(null);
    setError('');
    setActiveTab('features');
  };

  const selectAllInGroup = (groupFeatures) => {
    const updatedFeatures = { ...features };
    groupFeatures.forEach(feature => {
      updatedFeatures[feature] = 1;
    });
    setFeatures(updatedFeatures);
  };

  const deselectAllInGroup = (groupFeatures) => {
    const updatedFeatures = { ...features };
    groupFeatures.forEach(feature => {
      updatedFeatures[feature] = 0;
    });
    setFeatures(updatedFeatures);
  };

  const isGroupPartiallySelected = (groupFeatures) => {
    const selectedInGroup = groupFeatures.filter(f => features[f] === 1).length;
    return selectedInGroup > 0 && selectedInGroup < groupFeatures.length;
  };

  const isGroupFullySelected = (groupFeatures) => {
    return groupFeatures.every(f => features[f] === 1);
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Customer Propensity</h2>
        </div>
        
        <div className="sidebar-content">
          <div className="model-selection">
            <h3>Select Model</h3>
            {models.length > 0 ? (
              <div className="model-options">
                {models.map(m => (
                  <div 
                    key={m} 
                    className={`model-option ${selectedModel === m ? 'selected' : ''}`}
                    onClick={() => handleModelChange(m)}
                  >
                    <div className="model-radio">
                      {selectedModel === m && <div className="radio-inner"></div>}
                    </div>
                    <span>{getModelDisplayName(m)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="loading-models">Loading models...</p>
            )}
          </div>
          
          <div className="sidebar-stats">
            <div className="stat-item">
              <span>Selected Features</span>
              <strong>{selectedCount}</strong>
            </div>
          </div>
          
          <div className="sidebar-actions">
            <button 
              className="predict-button"
              onClick={handleSubmit}
              disabled={loading || !selectedModel || selectedCount === 0}
            >
              {loading ? (
                <span>
                  <svg className="spinner" viewBox="0 0 50 50">
                    <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                  </svg>
                  Predicting...
                </span>
              ) : (
                'Predict Behavior'
              )}
            </button>
            
            <button 
              className="reset-button"
              onClick={resetForm}
              disabled={loading}
            >
              Reset All
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        <div className="content-header">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'features' ? 'active' : ''}`}
              onClick={() => setActiveTab('features')}
            >
              User Journey
            </button>
            <button 
              className={`tab ${activeTab === 'results' ? 'active' : ''}`}
              onClick={() => setActiveTab('results')}
              disabled={!result}
            >
              Prediction Results
            </button>
          </div>
        </div>
        
        <div className="content-body">
          {activeTab === 'features' ? (
            <div className="features-container">
              <p className="journey-intro">
                Select the actions taken by the user during their journey:
              </p>
              
              {Object.entries(FEATURE_GROUPS).map(([groupName, group]) => {
                const isPartiallySelected = isGroupPartiallySelected(group.features);
                const isFullySelected = isGroupFullySelected(group.features);
                
                return (
                  <div key={groupName} className="feature-group">
                    <div className="group-header">
                      <div className="group-title-container">
                        <span className="group-icon">{group.icon}</span>
                        <h3 className="group-title">{groupName}</h3>
                      </div>
                      <div className="group-actions">
                        <button 
                          className="group-action-btn select-all"
                          onClick={() => selectAllInGroup(group.features)}
                          disabled={isFullySelected}
                        >
                          Select All
                        </button>
                        <button 
                          className="group-action-btn deselect-all"
                          onClick={() => deselectAllInGroup(group.features)}
                          disabled={!isPartiallySelected && !isFullySelected}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="feature-list">
                      {group.features.map(feature => (
                        <label key={feature} className={`feature-item ${features[feature] ? 'selected' : ''}`}>
                          <input
                            type="checkbox"
                            checked={!!features[feature]}
                            onChange={() => handleCheckbox(feature)}
                          />
                          <div className="feature-checkbox">
                            <svg viewBox="0 0 24 24" className="checkmark">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                          </div>
                          <span>{formatFeatureName(feature)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="results-container">
              {error && (
                <div className="error-message">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span>{error}</span>
                </div>
              )}
              
              {result && (
                <div className="prediction-result">
                  <div className="result-header">
                    <h2>Customer Propensity Prediction</h2>
                    <div className="model-badge">
                      Model: <span>{getModelDisplayName(selectedModel)}</span>
                    </div>
                  </div>
                  
                  <div className="result-card">
                    <div className="prediction-outcome">
                      <h3>Prediction</h3>
                      <div className="outcome-value">{result.prediction}</div>
                    </div>
                    
                    {result.probability !== null && result.probability !== undefined && (
                      <div className="prediction-probability">
                        <h3>Confidence Level</h3>
                        <div className="probability-value">{(result.probability * 100).toFixed(1)}%</div>
                        
                        <div className="probability-bar">
                          <div 
                            className="probability-fill" 
                            style={{ width: `${result.probability * 100}%` }}
                          ></div>
                        </div>
                        
                        <div className="confidence-label">
                          {result.probability > 0.7 
                            ? 'High confidence prediction' 
                            : result.probability > 0.4 
                              ? 'Medium confidence prediction' 
                              : 'Low confidence prediction'}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="selected-features-summary">
                    <h3>Selected User Journey Events ({selectedCount})</h3>
                    <div className="selected-features-list">
                      {Object.entries(features)
                        .filter(([_, value]) => value === 1)
                        .map(([feature, _]) => (
                          <div key={feature} className="selected-feature-item">
                            <svg viewBox="0 0 24 24" className="feature-icon">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                            <span>{formatFeatureName(feature)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function AddressAutocomplete({ value, onChange, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    // Close suggestions when clicking outside
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (input) => {
    console.log('fetchSuggestions called with:', input, 'length:', input.length);
    
    if (input.length < 3) {
      console.log('Input too short, skipping');
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    console.log('Making API call for:', input);
    
    try {
      const url = `/api/address/autocomplete?input=${encodeURIComponent(input)}`;
      console.log('Calling URL:', url);
      
      const res = await axios.get(url);
      console.log('API Response:', res.data);
      console.log('Number of suggestions:', res.data?.length);
      
      setSuggestions(res.data || []);
      
      if (res.data && res.data.length > 0) {
        console.log('Setting showSuggestions to true');
        setShowSuggestions(true);
      } else {
        console.log('No suggestions to show');
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Autocomplete API error:', error);
      console.error('Error response:', error.response?.data);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Debounce the API call
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSelectSuggestion = (suggestion) => {
    console.log('Selected:', suggestion.description);
    onChange(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (value.length >= 3 && suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
        style={{ width: '100%' }}
      />
      
      {loading && (
        <div style={{ fontSize: '12px', color: '#3498db', marginTop: '5px' }}>
          Loading suggestions...
        </div>
      )}
      
      {/* Debug info */}
      <div style={{ fontSize: '10px', color: '#999', marginTop: '5px', background: '#f0f0f0', padding: '4px' }}>
        Debug: {suggestions.length} suggestions, show: {showSuggestions ? 'YES' : 'NO'}, loading: {loading ? 'YES' : 'NO'}
      </div>
      
      {/* Force show dropdown if we have suggestions */}
      {suggestions.length > 0 && (
        <div 
          className="autocomplete-dropdown"
          style={{ 
            display: showSuggestions ? 'block' : 'none',
            position: 'absolute',
            width: '100%',
            backgroundColor: 'white',
            border: '2px solid red',
            zIndex: 99999
          }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id || index}
              className="autocomplete-item"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelectSuggestion(suggestion);
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelectSuggestion(suggestion);
              }}
            >
              <span className="autocomplete-icon">•</span>
              <div>
                <div className="autocomplete-main">{suggestion.main_text}</div>
                <div className="autocomplete-secondary">{suggestion.secondary_text}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AddressAutocomplete;

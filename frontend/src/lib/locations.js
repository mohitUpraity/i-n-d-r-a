import { State, City } from 'country-state-city';

// CODE EXPLANATION:
// This file acts as the "Location Backend".
// Instead of hardcoding "Uttarakhand" or "Dehradun" in your React components,
// we pull the data from the 'country-state-city' package (Industry Standard).

// 1. Get States (filtered for India)
// Returns array: [{ isoCode: 'UK', name: 'Uttarakhand' }, ...]
export const getIndianStates = () => {
  return State.getStatesOfCountry('IN');
};

// 2. Get Cities for a specific State
// Pass stateCode (e.g., 'UK' for Uttarakhand)
export const getCitiesByState = (stateCode) => {
  if (!stateCode) return [];
  return City.getCitiesOfState('IN', stateCode);
};

// 3. Get Localities / Digigrids
// Since standard packages don't have street-level data for Indian cities,
// we use this placeholder function.
// FUTURE SCALABILITY: Connect this to Google Places API or your own Firestore 'localities' collection.
export const getLocalities = (stateCode, cityName) => {
  // Mock data for prototype demonstration
  if (cityName === 'Dehradun') {
    return [
      { id: 'rajpur', name: 'Rajpur Road', type: 'locality' },
      { id: 'clem', name: 'Clement Town', type: 'locality' },
      { id: 'clk', name: 'Clock Tower', type: 'area' },
      { id: 'prem', name: 'Prem Nagar', type: 'locality' },
    ];
  }
  
  if (cityName === 'Shimla') {
    return [
      { id: 'mall', name: 'Mall Road', type: 'area' },
      { id: 'sanj', name: 'Sanjauli', type: 'locality' },
    ];
  }

  // Return empty if we don't have data (UI should show a text input instead)
  return [];
};

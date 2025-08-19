import { useEffect, useRef } from 'react';

const useGooglePlacesAutocomplete = (inputRef, onPlaceSelected, initialValue) => {
    const autocompleteRef = useRef(null);

    // Effect to set the initial value of the input field
    useEffect(() => {
        if (inputRef.current && initialValue) {
            inputRef.current.value = initialValue;
        }
    }, [initialValue, inputRef]);

    useEffect(() => {
        if (process.env.REACT_APP_GOOGLE_MAPS_API_KEY && window.google && inputRef.current) {
            autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
                types: ['(cities)'],
            });

            const listener = autocompleteRef.current.addListener('place_changed', () => {
                const place = autocompleteRef.current.getPlace();
                const value = place.formatted_address || place.name || '';
                
                // Create a synthetic event to pass to the parent's onChange handler
                const syntheticEvent = {
                    target: {
                        name: inputRef.current.name,
                        value: value,
                    },
                };

                if (onPlaceSelected) {
                    onPlaceSelected(syntheticEvent);
                }
            });
            
            // Cleanup the listener on component unmount
            return () => {
                window.google.maps.event.removeListener(listener);
            }
        }
    }, [inputRef, onPlaceSelected]);

    return autocompleteRef;
};

export default useGooglePlacesAutocomplete;

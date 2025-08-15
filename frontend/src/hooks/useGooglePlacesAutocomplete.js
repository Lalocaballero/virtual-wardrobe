import { useEffect, useRef } from 'react';

const useGooglePlacesAutocomplete = (inputRef, onPlaceSelected) => {
    const autocompleteRef = useRef(null);

    useEffect(() => {
        if (process.env.REACT_APP_GOOGLE_MAPS_API_KEY && window.google && inputRef.current) {
            autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
                types: ['(cities)'],
            });

            autocompleteRef.current.addListener('place_changed', () => {
                const place = autocompleteRef.current.getPlace();
                if (onPlaceSelected) {
                    onPlaceSelected(place.formatted_address || place.name);
                }
            });
        }
    }, [inputRef, onPlaceSelected]);

    return autocompleteRef;
};

export default useGooglePlacesAutocomplete;

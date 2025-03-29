(function ($) {
    "use strict";

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner();
    
    
    // Initiate the wowjs
    new WOW().init();


    // Sticky Navbar
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.sticky-top').css('top', '0px');
        } else {
            $('.sticky-top').css('top', '-100px');
        }
    });
    
    
    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    });


    // Header carousel
    $(".header-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1500,
        items: 1,
        dots: true,
        loop: true,
        nav : true,
        navText : [
            '<i class="bi bi-chevron-left"></i>',
            '<i class="bi bi-chevron-right"></i>'
        ]
    });


    // Testimonials carousel
    $(".testimonial-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        center: true,
        margin: 24,
        dots: true,
        loop: true,
        nav : false,
        responsive: {
            0:{
                items:1
            },
            768:{
                items:2
            },
            992:{
                items:3
            }
        }
    });
    
})(jQuery);

function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                console.log("User Location: Latitude: " + latitude + ", Longitude: " + longitude);
            },
            (error) => {
                console.error("Error getting location:", error);
            }
        );
    } else {
        console.error("Geolocation is not supported by this browser.");
    }
}

// Request location as soon as the page loads
$(document).ready(function() {
    getUserLocation();
});
/*
// Example function to send location to the backend (if needed)
function sendLocationToServer(lat, lon) {
    fetch('https://your-backend.com/api/location', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ latitude: lat, longitude: lon })
    })
    .then(response => response.json())
    .then(data => console.log("Server Response:", data))
    .catch(error => console.error("Error sending location:", error));
    console.log("User Location: Latitude: " + lat + ", Longitude: " + lon); 
}*/

// Replace with your actual API key
const KRUTRIM_API_KEY = "YFtLtfLjvMc9EwQ5jrMFTfOVnUDpBsf48Upv6xdM";

// Function to get user's (seller's) location
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            
            console.log("User Location (Seller):", userLat, userLng);
            
            // Call API with buyer (host) and seller (user) locations
            await getDistance(userLat, userLng);
        }, (error) => {
            console.error("Error getting location:", error);
        });
    } else {
        console.error("Geolocation is not supported by this browser.");
    }
}

// Function to call Krutrim API and extract distance
async function getDistance(sellerLat, sellerLng) {
    // Replace with your actual buyer's (host's) coordinates
    const buyerLat = 12.9716;  // Example: Bangalore
    const buyerLng = 77.5946;  // Example: Bangalore

    // API URL
    const apiUrl = `https://api.olamaps.io/routing/v1/distanceMatrix?origins=${buyerLat},${buyerLng}&destinations=${sellerLat},${sellerLng}&api_key=${YFtLtfLjvMc9EwQ5jrMFTfOVnUDpBsf48Upv6xdM}`;
    
    console.log("Calling API URL:", apiUrl);

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        // Log the full response for debugging
        console.log("API Response:", data);

        if (data && data.status === "OK") {
            // Extract the distance (assuming response format)
            if (data.results && data.results[0] && data.results[0].distance) {
     
         const distance = data.results[0].distance.value; // Distance in meters
                console.log(`Distance: ${distance / 1000} km`);
            } else {
                console.error("Distance data not found in the expected format:", data);
            }
        }
        else {
            console.error("Error in API response:", data);
            
            // Fallback to manual calculation if API fails
            const distance = calculateDistance(buyerLat, buyerLng, sellerLat, sellerLng);
            console.log(`Calculated distance (fallback): ${distance.toFixed(2)} km`);
        }
    }   
    catch (error) {
        console.error("API call failed:", error);
        
        // Fallback to manual calculation if API fails
        const distance = calculateDistance(buyerLat, buyerLng, sellerLat, sellerLng);
        console.log(`Calculated distance (fallback): ${distance.toFixed(2)} km`);
    }
}

/**
 * Calculates the distance between two geographical points using the Haversine formula
 * @param {number} lat1 - Latitude of the first point in decimal degrees
 * @param {number} lon1 - Longitude of the first point in decimal degrees
 * @param {number} lat2 - Latitude of the second point in decimal degrees
 * @param {number} lon2 - Longitude of the second point in decimal degrees
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    // Earth's radius in kilometers
    const R = 6371;
    
    // Convert latitude and longitude from degrees to radians
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    // Haversine formula
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    
    return distance;
}

// Call function when page loads
window.onload = getUserLocation;
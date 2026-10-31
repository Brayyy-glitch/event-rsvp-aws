// Base URL of AWS API gateway endpoint.
const API_BASE_URL = 'https://ufs78eg7yi.execute-api.us-east-1.amazonaws.com'

/* Convert date string into a readable format like, "Monday, October 19, 2026".
If no date is available, its shows "Date TBA (To Be Announced)". */
function formatDate(dateString) {
    if (!dateString) return 'Date TBA';
    return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/* Converts a date string into a readable time.
Returns "Time TBA" if there's no time data.*/

function formatTime(dateString) {
    if (!dateString) return 'Time TBA';
    return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/* Closes the event modal popup by hiding it from view.
This is called when the user clicks outside the modal or closes it manually. */
function closeModal() {
    document.getElementById('eventModal').style.display = 'none';
}

/* Detects clicks outside the modal window and closes it automatically. 
This makes the modal easier to exit for users. */
window.onclick = function(event) {
    const modal = document.getElementById('eventModal');
    if (event.target === modal) {
        closeModal();
    }
}

/* Generic helper function for calling AWS API Gateway endpoint.
Handles making GET/POST requests with 'fetch', 
converting responses to JSON, catching and displaying API 
errors in the console. */

async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json();
        
        if (!response.ok) {
            const errorMessage = data.message || `API error: ${response.status}`;
            throw new Error(errorMessage);
        }
        return data;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}
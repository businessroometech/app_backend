import http from 'k6/http';
import { check, sleep } from 'k6';

// Define the API endpoint
const url = 'https://strengthholdings.com/api/v1/post/create-userpost';

// Bearer token for authentication
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjgwNjMwZDc3ODA4ZmI4M2ViZTMxYTZkZjNmZmExMDljIiwiaWF0IjoxNzQyMzQwNzc4LCJleHAiOjE3NDI0MjcxNzh9.-Zl1GZor3ON3zC9j6UNWNf_vPzPTuJyT2DKxMSVIUSc'; // Replace with your actual token

// Load the image file in the init stage
const imageFile = open('./test.png', 'b'); // 'b' for binary mode

// Function to generate random content
function getRandomContent() {
    const texts = [
        "This is a test post with an image.",
        "Hello, world! Check out this image.",
        "Load testing with k6 and images.",
        "Simulating multiple users posting images.",
        "Testing API performance with image uploads."
    ];
    return texts[Math.floor(Math.random() * texts.length)];
}

// Load test configuration
export const options = {
    stages: [
        { duration: '30s', target: 500 }, // Ramp up to 1 user over 15 seconds
        { duration: '1m', target: 500 },  // Stay at 1 user for 30 seconds
        { duration: '10s', target: 0 },  // Ramp down to 0 users over 10 seconds
    ],
};

// Main function for the load test
export default function () {
    // Create form data with the image file and random content
    const payload = {
        files: http.file(imageFile, 'test.png', 'image/png'), // Use the preloaded image file
        content: getRandomContent(), // Add random text content
    };

    // Define headers with the Bearer token
    const headers = {
        Authorization: `Bearer ${token}`,
    };

    // Send a POST request with the form data and headers
    const response = http.post(url, payload, { headers });

    // Log the request and response for debugging
    console.log('Request Headers:', JSON.stringify(headers));
    console.log('Request Payload:', JSON.stringify(payload));
    console.log('Response:', response.status, response.body);

    // Check if the request was successful
    check(response, {
        'Status is 201': (r) => r.status === 201,
    });

    // Add a short delay between requests
    sleep(1);
}
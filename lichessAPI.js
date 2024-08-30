const axios = require('axios');
require('dotenv').config();
const ACCESS_TOKEN = process.env.LICHESS_API_TOKEN;
const username = process.env.LICHESS_USER_NAME;

const headers = {
    Authorization: `Bearer ${ACCESS_TOKEN}`
};

const accountUrl = `https://lichess.org/api/account`;

// Include the access token in the request headers

async function fetchDailyPuzzle() {
    const puzzleUrl = "https://lichess.org/api/puzzle/daily";
    const headers = {
        Authorization: `Bearer ${ACCESS_TOKEN}`
    };

    try {
        const response = await fetch(puzzleUrl, { headers });
        if (response.ok) {
            return { ok: true, puzzle: await response.json() };
        } else {
            throw new Error("Error fetching the puzzle");
        }
    } catch (error) {
        return { ok: false, err: "No Internet Connection!" }
    }
}


async function fetchPuzzle(puzzleId) {
    try {
        // Lichess puzzle API endpoint
        const apiUrl = `https://lichess.org/api/puzzle/${puzzleId}`;

        // Make a GET request to the Lichess API
        const response = await axios.get(apiUrl, {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`
            }
        });

        // Check if the request was successful (status code 200)
        if (response.status === 200) {
            // Extract relevant information from the puzzle data
            const { fen, initialMove, solution } = response.data;

            console.log("Responce:", response.data)
            // Return the puzzle data
            return { fen, initialMove, solution };
        } else {
            // If the request was not successful, throw an error
            throw new Error(`Failed to fetch puzzle. Status code: ${response.status}`);
        }
    } catch (error) {
        // Handle any errors that occur during the process
        console.error('Error fetching puzzle:', error.message);
        return null;
    }
}

// Example usage

module.exports = { fetchDailyPuzzle }
document.getElementById('searchButton').addEventListener('click', function () {
    const query = document.getElementById('searchInput').value.trim();
    if (query) {
        fetchDetails(query);
    }
});

function fetchDetails(query) {
    const apiUrl = `https://api.edamam.com/api/food-database/v2/parser?ingr=${query}&app_id=155a5345&app_key=485ea0358c8efe6de70541560fe0f44e`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.hints && data.hints.length > 0) {
                displayResults(data.hints.slice(0, 6)); // Display only the first 6 results
            } else {
                document.getElementById('result').innerHTML = '<p>No results found.</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            document.getElementById('result').innerHTML = '<p>Error fetching data.</p>';
        });
}

function displayResults(foods) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = ''; // Clear previous results

    foods.forEach(foodItem => {
        const food = foodItem.food;
        const foodHtml = `
            <div class="result-card">
                <h3>${food.label}</h3>
                <p><strong>Category:</strong> ${food.category}</p>
                <p><strong>Calories:</strong> ${food.nutrients.ENERC_KCAL ? food.nutrients.ENERC_KCAL + ' kcal' : 'N/A'}</p>
                <p><strong>Protein:</strong> ${food.nutrients.PROCNT ? food.nutrients.PROCNT + ' g' : 'N/A'}</p>
                <p><strong>Fat:</strong> ${food.nutrients.FAT ? food.nutrients.FAT + ' g' : 'N/A'}</p>
                <p><strong>Carbs:</strong> ${food.nutrients.CHOCDF ? food.nutrients.CHOCDF + ' g' : 'N/A'}</p>
            </div>
        `;
        resultDiv.insertAdjacentHTML('beforeend', foodHtml);
    });
}

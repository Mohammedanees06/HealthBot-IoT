let symptoms = [];

function addSymptom() {
    const input = document.getElementById('symptomInput');
    const symptom = input.value.trim().toLowerCase();
    
    if (symptom && !symptoms.includes(symptom)) {
        symptoms.push(symptom);
        updateSymptomList();
        input.value = '';
        
        // Enable check button if we have at least 3 symptoms
        const checkButton = document.getElementById('checkButton');
        checkButton.disabled = symptoms.length < 3;
        console.log('Symptoms count:', symptoms.length);
        console.log('Button disabled:', checkButton.disabled);
    }
}

function removeSymptom(symptom) {
    symptoms = symptoms.filter(s => s !== symptom);
    updateSymptomList();
    
    // Disable check button if we have less than 3 symptoms
    const checkButton = document.getElementById('checkButton');
    checkButton.disabled = symptoms.length < 3;
    console.log('Symptoms count after removal:', symptoms.length);
    console.log('Button disabled:', checkButton.disabled);
}

function updateSymptomList() {
    const list = document.getElementById('symptomList');
    list.innerHTML = '';
    
    symptoms.forEach(symptom => {
        const tag = document.createElement('div');
        tag.className = 'symptom-tag';
        tag.innerHTML = `
            ${symptom}
            <button onclick="removeSymptom('${symptom}')">&times;</button>
        `;
        list.appendChild(tag);
    });
}

async function checkSymptoms() {
    console.log('Check Symptoms clicked');
    console.log('Current symptoms:', symptoms);
    
    if (symptoms.length < 3) {
        alert('Please enter at least 3 symptoms for a more accurate diagnosis.');
        return;
    }
    
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<div class="loading">Processing symptoms...</div>';
    
    try {
        console.log('Sending request to server...');
        const response = await fetch('http://localhost:3000/check-symptoms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ symptoms })
        });
        
        console.log('Response received:', response);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
            throw new Error(errorData.message || errorData.error || 'Server error occurred');
        }
        
        const results = await response.json();
        console.log('Results:', results);
        
        if (!results || !Array.isArray(results)) {
            throw new Error('Invalid response format from server');
        }
        
        displayResults(results);
    } catch (error) {
        console.error('Error:', error);
        resultsDiv.innerHTML = `
            <div class="error-message">
                <h2>Error</h2>
                <p>${error.message || 'An error occurred while checking symptoms. Please try again.'}</p>
            </div>
        `;
    }
}

function displayResults(results) {
    console.log('Displaying results:', results);
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<h2>Possible Conditions</h2>';
    
    if (results.length === 0) {
        resultsDiv.innerHTML += '<p>No matching conditions found. Please consult a healthcare professional.</p>';
        return;
    }
    
    results.forEach(condition => {
        const probability = Math.min(100, Math.round(condition.probability * 100));
        const card = document.createElement('div');
        card.className = 'condition-card';
        card.innerHTML = `
            <h3>${condition.name}</h3>
            <div class="probability-bar">
                <div class="probability-fill" style="width: ${probability}%"></div>
            </div>
            <p>Probability: ${probability}%</p>
            <div class="symptoms-list">
                <strong>Matching Symptoms:</strong> ${condition.matchingSymptoms.join(', ')}
            </div>
            <div class="symptoms-list">
                <strong>Additional Symptoms to Watch For:</strong> ${condition.additionalSymptoms.join(', ')}
            </div>
        `;
        resultsDiv.appendChild(card);
    });
    
    // Add disclaimer
    const disclaimer = document.createElement('p');
    disclaimer.style.marginTop = '2rem';
    disclaimer.style.fontSize = '0.9rem';
    disclaimer.style.color = '#666';
    disclaimer.innerHTML = '<strong>Disclaimer:</strong> This is not a medical diagnosis. Please consult a healthcare professional for proper medical advice.';
    resultsDiv.appendChild(disclaimer);
}

// Add event listener when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded');
    const checkButton = document.getElementById('checkButton');
    console.log('Check button found:', checkButton);
    
    // Add click event listener
    checkButton.addEventListener('click', function() {
        console.log('Button clicked');
        checkSymptoms();
    });
}); 
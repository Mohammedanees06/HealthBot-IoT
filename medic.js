document.getElementById("searchBtn").addEventListener("click", () => {
    const query = document.getElementById("searchInput").value.trim().toLowerCase();
    if (!query) return alert("Please enter a medicine name!");

    fetch("http://localhost:3000/searchMedicine?name=" + encodeURIComponent(query))
        .then(res => res.json())
        .then(data => {
            const resultBox = document.getElementById("resultBox");
           if (data.found) {
            resultBox.innerHTML = `
        <strong>Name:</strong> ${data.name}<br>
        <strong>Uses:</strong> ${data.usage}<br>
        <strong>Side Effects:</strong> ${data.sideEffects}<br>
        <strong>Dosage:</strong> ${data.dosage}
    `;
            } else {
                resultBox.innerHTML = "❌ Medicine not found!";
            }
        })
        .catch(err => {
            console.error("Error:", err);
            alert("Failed to fetch medicine data.");
        });
});

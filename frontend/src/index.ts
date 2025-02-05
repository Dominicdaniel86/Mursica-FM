console.log("Hello World");

async function fetchData() {
    try {
        const response = await fetch('http://localhost:80/api');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.text();
        console.log(data);
    } catch (error) {
        console.error('Error fetching data: ', error);
    }
}

fetchData();

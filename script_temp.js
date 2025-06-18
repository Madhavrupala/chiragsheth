// Initialize state
let projects = [];
let isLoggedIn = false;
let currentProjectId = null;

// Login functionality
function login(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === 'CS' && password === 'CS') {
        isLoggedIn = true;
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        
        // Prompt user to load CSV
        if (confirm('Do you want to load existing data from CSV?')) {
            document.getElementById('csvFileInput').click();
        } else {
            showDashboard();
        }
    } else {
        alert('Invalid credentials. Please try again.');
    }
}

// CSV Operations
function saveToCSV() {
    const csvHeader = 'H2S No,Project Name,Architect Name,Total Fees,Billed Amount,Received Amount,Receivable,To be Billed,%Billed\n';
    let csvRows = [];

    projects.forEach(project => {
        const billedAmount = project.billing.reduce((sum, b) => sum + b.amount, 0);
        const receivedAmount = project.receipts.reduce((sum, r) => sum + r.amount, 0);
        const receivable = billedAmount - receivedAmount;
        const toBeBilled = project.totalFees - billedAmount;
        const billedPercentage = ((billedAmount / project.totalFees) * 100).toFixed(2);
        
        const row = [
            project.h2sNo,
            project.projectName,
            project.architectName,
            project.totalFees,
            billedAmount,
            receivedAmount,
            receivable,
            toBeBilled,
            billedPercentage
        ].join(',');
        
        csvRows.push(row);
    });

    const csvContent = csvHeader + csvRows.join('\n');
    const downloadLink = document.createElement('a');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Set filename with date
    const date = new Date().toISOString().split('T')[0];
    const filename = `projects_${date}.csv`;
    
    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
    } else {
        downloadLink.href = window.URL.createObjectURL(blob);
        downloadLink.download = filename;
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }
}

// Load CSV
document.getElementById('csvFileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            const rows = text.split('\n');
            const headers = rows[0].split(',');
            
            // Clear existing projects
            projects = [];
            
            // Parse each row
            for(let i = 1; i < rows.length; i++) {
                if(!rows[i].trim()) continue;
                
                const columns = rows[i].split(',');
                if(columns.length < headers.length) continue;
                
                const project = {
                    h2sNo: columns[0],
                    projectName: columns[1],
                    architectName: columns[2],
                    totalFees: parseFloat(columns[3]) || 0,
                    fees: [],
                    billing: [],
                    receipts: []
                };
                
                projects.push(project);
            }
            
            // Show dashboard with loaded data
            showDashboard();
        };
        reader.readAsText(file);
    }
});

// Auto-save on changes
function autoSave() {
    saveToCSV();
}
